package tn.rnu.isetmd.event.event.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.category.repository.CategoryRepository;
import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.dto.EventSearchCriteria;
import tn.rnu.isetmd.event.event.dto.EventStatsResponse;
import tn.rnu.isetmd.event.event.dto.UpdateEventRequest;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.mapper.EventMapper;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.event.service.EventService;
import tn.rnu.isetmd.event.event.specification.EventSpecifications;
import tn.rnu.isetmd.event.notification.repository.NotificationRepository;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationAccessService;
import tn.rnu.isetmd.event.registration.entity.Registration;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.review.repository.ReviewRepository;
import tn.rnu.isetmd.event.ticketType.repository.TicketTypeRepository;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.venue.entity.Venue;
import tn.rnu.isetmd.event.venue.repository.VenueRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RequiredArgsConstructor
@Service
@Transactional
public class EventServiceImpl implements EventService {

    private static final List<RegistrationStatus> ACTIVE_REGISTRATIONS =
            List.of(RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN);
    private static final List<RegistrationStatus> PAID_REGISTRATIONS =
            List.of(RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    private final CategoryRepository categoryRepository;
    private final VenueRepository venueRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final RegistrationRepository registrationRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final OrganizationAccessService organizationAccessService;
    private final NotificationService notificationService;

    @Override
    public EventResponse createEvent(CreateEventRequest request, Long currentUserId) {

        Organization organization = organizationAccessService
                .requireOwnMembership(currentUserId, StaffRole.MODERATOR, StaffRole.ORGANIZER)
                .getOrganization();

        Category category = findCategory(request.categoryId());
        Venue venue = findVenue(request.venueId());
        validateSchedule(request.startDateTime(), request.endDateTime());
        validateCapacity(venue, request.capacity());

        Event event = eventMapper.toEntity(request);
        event.setCategory(category);
        event.setVenue(venue);
        event.setOrganizer(organization);
        event.setStatus(EventStatus.DRAFT);

        Event savedEvent = eventRepository.save(event);
        return eventMapper.toResponse(savedEvent, null);
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        Event event = getEventEntity(id);

        // Drafts are only visible to the organization's staff
        if (event.getStatus() == EventStatus.DRAFT
                && !organizationAccessService.hasAccess(event.getOrganizer().getId())) {
            throw new NotFoundException("Event not found");
        }

        return eventMapper.toResponse(event, ticketTypeRepository.findMinPriceByEventId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEventEntity(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EventResponse> searchEvents(EventSearchCriteria criteria, String sort, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50), resolveSort(sort));
        Page<Event> events = eventRepository.findAll(EventSpecifications.publicSearch(criteria), pageable);
        return PageResponse.of(events, toResponses(events.getContent()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getMyOrganizationEvents(Long currentUserId) {
        Long organizationId = organizationAccessService.requireOwnMembership(currentUserId).getOrganization().getId();
        return toResponses(eventRepository.findByOrganizerIdOrderByStartDateTimeDesc(organizationId));
    }

    @Override
    public EventResponse updateEvent(Long id, UpdateEventRequest request) {
        Event event = getManageableEvent(id);

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("A " + event.getStatus().name().toLowerCase() + " event can no longer be edited");
        }

        Category category = findCategory(request.categoryId());
        Venue venue = findVenue(request.venueId());
        validateSchedule(request.startDateTime(), request.endDateTime());
        validateCapacity(venue, request.capacity());

        if (request.capacity() < event.getRegisteredCount()) {
            throw new BadRequestException("Capacity can't be lower than the " + event.getRegisteredCount() + " existing registrations");
        }

        boolean scheduleChanged = !Objects.equals(event.getStartDateTime(), request.startDateTime())
                || !Objects.equals(event.getEndDateTime(), request.endDateTime())
                || !Objects.equals(event.getVenue().getId(), venue.getId());

        event.setTitle(request.title().trim());
        event.setDescription(request.description());
        event.setCoverImage(request.coverImage());
        event.setCategory(category);
        event.setVenue(venue);
        event.setStartDateTime(request.startDateTime());
        event.setEndDateTime(request.endDateTime());
        event.setCapacity(request.capacity());
        if (scheduleChanged) {
            // The reminder must be sent again for the new date
            event.setReminderSent(false);
        }

        Event updatedEvent = eventRepository.save(event);

        if (scheduleChanged && event.getStatus() != EventStatus.DRAFT) {
            notificationService.notifyAll(attendeesOf(event), event, NotificationType.EVENT_UPDATE,
                    "Event updated: " + event.getTitle(),
                    "New schedule: " + event.getStartDateTime().format(DATE_FORMAT) + " at "
                            + venue.getName() + ", " + venue.getCity() + ".");
        }

        return eventMapper.toResponse(updatedEvent, ticketTypeRepository.findMinPriceByEventId(id));
    }

    @Override
    public EventResponse publishEvent(Long id) {
        Event event = getManageableEvent(id);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BadRequestException("Only draft events can be published");
        }
        if (!event.getStartDateTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("The event start date is in the past, update it before publishing");
        }
        if (!ticketTypeRepository.existsByEventIdAndActiveTrue(id)) {
            throw new BadRequestException("Add at least one active ticket type before publishing");
        }

        event.setStatus(EventStatus.PUBLISHED);
        return eventMapper.toResponse(eventRepository.save(event), ticketTypeRepository.findMinPriceByEventId(id));
    }

    @Override
    public EventResponse cancelEvent(Long id, String reason) {
        Event event = getManageableEvent(id);

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("This event is already " + event.getStatus().name().toLowerCase());
        }

        List<Registration> registrations = registrationRepository.findByEventIdAndStatusIn(id, ACTIVE_REGISTRATIONS);
        LocalDateTime now = LocalDateTime.now();
        registrations.forEach(registration -> {
            registration.setStatus(RegistrationStatus.CANCELLED);
            registration.setCancelledAt(now);
        });
        registrationRepository.saveAll(registrations);

        event.setStatus(EventStatus.CANCELLED);
        Event saved = eventRepository.save(event);

        String message = "\"" + event.getTitle() + "\" scheduled on " + event.getStartDateTime().format(DATE_FORMAT)
                + " has been cancelled by the organizer."
                + (reason != null && !reason.isBlank() ? " Reason: " + reason.trim() : "");
        notificationService.notifyAll(
                registrations.stream().map(Registration::getUser).toList(),
                event, NotificationType.EVENT_CANCELLED, "Event cancelled", message);

        return eventMapper.toResponse(saved, ticketTypeRepository.findMinPriceByEventId(id));
    }

    @Override
    public void deleteEvent(Long id) {
        Event event = getManageableEvent(id);

        if (registrationRepository.existsByEventIdAndStatusIn(id, ACTIVE_REGISTRATIONS)) {
            throw new ConflictException("This event has registrations, cancel it instead of deleting it");
        }

        notificationRepository.detachEvent(id);
        reviewRepository.deleteByEventId(id);
        registrationRepository.deleteByEventId(id);
        eventRepository.delete(event);
    }

    @Override
    @Transactional(readOnly = true)
    public EventStatsResponse getEventStats(Long id) {
        Event event = getEventEntity(id);
        organizationAccessService.checkAccess(event.getOrganizer().getId());

        List<EventStatsResponse.TicketSales> ticketSales = ticketTypeRepository.findByEventIdOrderByPriceAsc(id).stream()
                .map(ticket -> new EventStatsResponse.TicketSales(
                        ticket.getId(), ticket.getName(), ticket.getPrice(), ticket.getQuantity(), ticket.getSoldQuantity()))
                .toList();

        return new EventStatsResponse(
                id,
                event.getCapacity(),
                event.getRegisteredCount(),
                registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.PENDING),
                registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.CONFIRMED),
                registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.CHECKED_IN),
                registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.CANCELLED),
                registrationRepository.sumRevenueByEvent(id, PAID_REGISTRATIONS),
                Math.round(event.getAverageRating() * 10) / 10.0,
                event.getReviewCount(),
                ticketSales
        );
    }

    @Override
    public void refreshRating(Long eventId) {
        Event event = getEventEntity(eventId);
        event.setAverageRating(reviewRepository.averageRatingByEventId(eventId));
        event.setReviewCount((int) reviewRepository.countByEventId(eventId));
        eventRepository.save(event);
    }

    /**
     * Loads the event and checks that the current user can manage it (moderator/organizer of its organization, or admin)
     */
    private Event getManageableEvent(Long id) {
        Event event = getEventEntity(id);
        organizationAccessService.checkAccess(event.getOrganizer().getId(), StaffRole.MODERATOR, StaffRole.ORGANIZER);
        return event;
    }

    private List<EventResponse> toResponses(List<Event> events) {
        if (events.isEmpty()) {
            return List.of();
        }
        // One query for the min price of the whole page
        Map<Long, BigDecimal> minPrices = new HashMap<>();
        ticketTypeRepository.findMinPricesByEventIds(events.stream().map(Event::getId).toList())
                .forEach(row -> minPrices.put((Long) row[0], (BigDecimal) row[1]));

        return events.stream()
                .map(event -> eventMapper.toResponse(event, minPrices.get(event.getId())))
                .toList();
    }

    private List<User> attendeesOf(Event event) {
        return registrationRepository.findByEventIdAndStatusIn(event.getId(), ACTIVE_REGISTRATIONS).stream()
                .map(Registration::getUser)
                .toList();
    }

    private Sort resolveSort(String sort) {
        return switch (sort == null ? "date" : sort) {
            case "newest" -> Sort.by("createdAt").descending();
            case "popular" -> Sort.by("registeredCount").descending().and(Sort.by("startDateTime"));
            case "rating" -> Sort.by("averageRating").descending().and(Sort.by("startDateTime"));
            default -> Sort.by("startDateTime").ascending();
        };
    }

    private void validateSchedule(LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("The end date must be after the start date");
        }
    }

    private void validateCapacity(Venue venue, int capacity) {
        if (venue.getCapacity() != null && capacity > venue.getCapacity()) {
            throw new BadRequestException("Capacity exceeds the venue capacity (" + venue.getCapacity() + ")");
        }
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }

    private Venue findVenue(Long id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venue not found"));
    }

}
