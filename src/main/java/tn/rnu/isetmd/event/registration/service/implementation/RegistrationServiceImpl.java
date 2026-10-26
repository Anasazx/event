package tn.rnu.isetmd.event.registration.service.implementation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.ForbiddenException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.service.EventService;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationAccessService;
import tn.rnu.isetmd.event.registration.dto.CheckInRequest;
import tn.rnu.isetmd.event.registration.dto.RegistrationResponse;
import tn.rnu.isetmd.event.registration.entity.Registration;
import tn.rnu.isetmd.event.registration.mapper.RegistrationMapper;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.registration.service.RegistrationService;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;
import tn.rnu.isetmd.event.ticketType.repository.TicketTypeRepository;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.service.UserService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class RegistrationServiceImpl implements RegistrationService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final RegistrationRepository registrationRepository;
    private final RegistrationMapper registrationMapper;
    private final TicketTypeRepository ticketTypeRepository;
    private final EventService eventService;
    private final UserService userService;
    private final OrganizationAccessService organizationAccessService;
    private final NotificationService notificationService;
    private final EntityManager entityManager;

    /**
     * Seats are a shared counter: the event row is locked (SELECT ... FOR UPDATE) for the
     * duration of the transaction so two users can never take the last seat at the same time.
     */
    @Override
    public RegistrationResponse register(Long userId, Long ticketTypeId) {
        TicketType ticketType = ticketTypeRepository.findById(ticketTypeId)
                .orElseThrow(() -> new NotFoundException("Ticket type not found"));
        Event event = lock(ticketType.getEvent());
        // Re-read the ticket counters now that we hold the lock
        entityManager.refresh(ticketType);

        LocalDateTime now = LocalDateTime.now();

        if (event.getStatus() != EventStatus.PUBLISHED && event.getStatus() != EventStatus.ONGOING) {
            throw new BadRequestException("Registrations are closed for this event");
        }
        if (!event.getEndDateTime().isAfter(now)) {
            throw new BadRequestException("This event is over");
        }
        if (!ticketType.isActive()) {
            throw new BadRequestException("This ticket type is not available");
        }
        if (ticketType.getSaleStart() != null && now.isBefore(ticketType.getSaleStart())) {
            throw new BadRequestException("Sales for this ticket start on " + ticketType.getSaleStart().format(DATE_FORMAT));
        }
        if (ticketType.getSaleEnd() != null && !now.isBefore(ticketType.getSaleEnd())) {
            throw new BadRequestException("Sales for this ticket are closed");
        }
        if (ticketType.getAvailable() <= 0) {
            throw new ConflictException("This ticket type is sold out");
        }
        if (event.getAvailableSeats() <= 0) {
            throw new ConflictException("This event is full");
        }

        Optional<Registration> existing = registrationRepository.findByUserIdAndEventId(userId, event.getId());
        if (existing.isPresent() && existing.get().getStatus() != RegistrationStatus.CANCELLED) {
            throw new ConflictException("You are already registered for this event");
        }

        User user = userService.getUserEntity(userId);

        // A cancelled registration is reused because (user, event) is unique
        Registration registration = existing.orElseGet(Registration::new);
        registration.setUser(user);
        registration.setEvent(event);
        registration.setTicketType(ticketType);
        registration.setStatus(isFree(ticketType) ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING);
        registration.setQrCode(generateQrCode());
        registration.setRegisteredAt(now);
        registration.setCancelledAt(null);
        registration.setCheckedInAt(null);

        ticketType.setSoldQuantity(ticketType.getSoldQuantity() + 1);
        event.setRegisteredCount(event.getRegisteredCount() + 1);

        Registration saved = registrationRepository.save(registration);

        notificationService.notify(user, event, NotificationType.REGISTRATION,
                "Registration " + (saved.getStatus() == RegistrationStatus.CONFIRMED ? "confirmed" : "received"),
                "Your " + ticketType.getName() + " ticket for \"" + event.getTitle() + "\" on "
                        + event.getStartDateTime().format(DATE_FORMAT) + " is "
                        + (saved.getStatus() == RegistrationStatus.CONFIRMED
                            ? "confirmed. Show your QR code at the entrance."
                            : "reserved. Payment of " + ticketType.getPrice() + " TND is due at the venue."));

        return registrationMapper.toRegistrationResponse(saved, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getMyRegistrations(Long userId) {
        return registrationRepository.findByUserIdOrderByRegisteredAtDesc(userId).stream()
                .map(registration -> registrationMapper.toRegistrationResponse(registration, true))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RegistrationResponse> getMyRegistrationForEvent(Long userId, Long eventId) {
        return registrationRepository.findByUserIdAndEventId(userId, eventId)
                .map(registration -> registrationMapper.toRegistrationResponse(registration, true));
    }

    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationById(Long userId, Long registrationId) {
        Registration registration = findRegistration(registrationId);
        boolean isOwner = Objects.equals(registration.getUser().getId(), userId);

        if (!isOwner && !organizationAccessService.hasAccess(registration.getEvent().getOrganizer().getId())) {
            throw new NotFoundException("Registration not found");
        }
        return registrationMapper.toRegistrationResponse(registration, isOwner);
    }

    @Override
    public RegistrationResponse cancelRegistration(Long userId, Long registrationId) {
        Registration registration = findRegistration(registrationId);

        if (!Objects.equals(registration.getUser().getId(), userId)) {
            throw new NotFoundException("Registration not found");
        }
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BadRequestException("This registration is already cancelled");
        }
        if (registration.getStatus() == RegistrationStatus.CHECKED_IN) {
            throw new BadRequestException("You already attended this event");
        }
        if (!registration.getEvent().getStartDateTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("The event has already started");
        }

        Event event = lock(registration.getEvent());
        TicketType ticketType = registration.getTicketType();
        entityManager.refresh(ticketType);

        ticketType.setSoldQuantity(Math.max(ticketType.getSoldQuantity() - 1, 0));
        event.setRegisteredCount(Math.max(event.getRegisteredCount() - 1, 0));
        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(LocalDateTime.now());

        return registrationMapper.toRegistrationResponse(registrationRepository.save(registration), true);
    }

    @Override
    public RegistrationResponse confirmRegistration(Long registrationId) {
        Registration registration = findRegistration(registrationId);
        organizationAccessService.checkAccess(registration.getEvent().getOrganizer().getId(),
                StaffRole.MODERATOR, StaffRole.ORGANIZER, StaffRole.CHECK_IN);

        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new BadRequestException("Only pending registrations can be confirmed");
        }

        confirm(registration);
        return registrationMapper.toRegistrationResponse(registrationRepository.save(registration), false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getEventRegistrations(Long eventId, RegistrationStatus status) {
        Event event = eventService.getEventEntity(eventId);
        organizationAccessService.checkAccess(event.getOrganizer().getId());

        return registrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId).stream()
                .filter(registration -> status == null || registration.getStatus() == status)
                .map(registration -> registrationMapper.toRegistrationResponse(registration, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public String exportEventRegistrationsCsv(Long eventId) {
        StringBuilder csv = new StringBuilder("id,first_name,last_name,email,ticket,price,status,registered_at,checked_in_at\n");
        Event event = eventService.getEventEntity(eventId);
        organizationAccessService.checkAccess(event.getOrganizer().getId());

        registrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId).forEach(registration -> csv
                .append(registration.getId()).append(',')
                .append(csvValue(registration.getUser().getFirstName())).append(',')
                .append(csvValue(registration.getUser().getLastName())).append(',')
                .append(csvValue(registration.getUser().getEmail())).append(',')
                .append(csvValue(registration.getTicketType().getName())).append(',')
                .append(registration.getTicketType().getPrice()).append(',')
                .append(registration.getStatus()).append(',')
                .append(registration.getRegisteredAt()).append(',')
                .append(registration.getCheckedInAt() != null ? registration.getCheckedInAt() : "")
                .append('\n'));
        return csv.toString();
    }

    @Override
    public RegistrationResponse checkIn(CheckInRequest request) {
        Event event = eventService.getEventEntity(request.eventId());
        organizationAccessService.checkAccess(event.getOrganizer().getId(),
                StaffRole.MODERATOR, StaffRole.ORGANIZER, StaffRole.CHECK_IN);

        Registration registration = registrationRepository.findByQrCode(request.qrCode().trim())
                .orElseThrow(() -> new NotFoundException("Unknown ticket"));

        if (!Objects.equals(registration.getEvent().getId(), event.getId())) {
            throw new ForbiddenException("This ticket belongs to another event");
        }
        if (event.getStatus() != EventStatus.PUBLISHED && event.getStatus() != EventStatus.ONGOING) {
            throw new BadRequestException("Check-in is closed for this event");
        }

        switch (registration.getStatus()) {
            case CANCELLED -> throw new BadRequestException("This registration was cancelled");
            case CHECKED_IN -> throw new ConflictException(
                    "Already checked in at " + registration.getCheckedInAt().format(DATE_FORMAT));
            case PENDING -> {
                if (!request.shouldConfirmPayment()) {
                    throw new BadRequestException("Payment not confirmed yet for this ticket");
                }
                confirm(registration);
            }
            case CONFIRMED -> { }
        }

        registration.setStatus(RegistrationStatus.CHECKED_IN);
        registration.setCheckedInAt(LocalDateTime.now());

        notificationService.notify(registration.getUser(), event, NotificationType.CHECK_IN,
                "Welcome to " + event.getTitle(),
                "You have been checked in. Enjoy the event!");

        return registrationMapper.toRegistrationResponse(registrationRepository.save(registration), false);
    }

    private void confirm(Registration registration) {
        registration.setStatus(RegistrationStatus.CONFIRMED);
        notificationService.notify(registration.getUser(), registration.getEvent(), NotificationType.REGISTRATION,
                "Payment confirmed",
                "Your ticket for \"" + registration.getEvent().getTitle() + "\" is now confirmed.");
    }

    /**
     * Reloads the event and locks its row until the end of the transaction
     */
    private Event lock(Event event) {
        entityManager.refresh(event, LockModeType.PESSIMISTIC_WRITE);
        return event;
    }

    private boolean isFree(TicketType ticketType) {
        return ticketType.getPrice().compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Random, unguessable ticket identifier encoded in the QR code
     */
    private String generateQrCode() {
        return "EVT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }

    private String csvValue(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return escaped.contains(",") || escaped.contains("\"") ? "\"" + escaped + "\"" : escaped;
    }

    private Registration findRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));
    }
}
