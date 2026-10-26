package tn.rnu.isetmd.event.ticketType.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.service.EventService;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationAccessService;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeRequest;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeResponse;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;
import tn.rnu.isetmd.event.ticketType.mapper.TicketTypeMapper;
import tn.rnu.isetmd.event.ticketType.repository.TicketTypeRepository;
import tn.rnu.isetmd.event.ticketType.service.TicketTypeService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketTypeServiceImpl implements TicketTypeService {

    private final TicketTypeRepository ticketTypeRepository;
    private final TicketTypeMapper ticketTypeMapper;
    private final EventService eventService;
    private final OrganizationAccessService organizationAccessService;
    private final RegistrationRepository registrationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TicketTypeResponse> getTicketTypesByEvent(Long eventId) {
        Event event = eventService.getEventEntity(eventId);
        boolean isStaff = organizationAccessService.hasAccess(event.getOrganizer().getId());

        if (event.getStatus() == EventStatus.DRAFT && !isStaff) {
            throw new NotFoundException("Event not found");
        }

        // The public only sees active tickets
        return ticketTypeRepository.findByEventIdOrderByPriceAsc(eventId).stream()
                .filter(ticket -> isStaff || ticket.isActive())
                .map(ticketTypeMapper::toTicketTypeResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TicketTypeResponse getTicketTypeById(Long ticketTypeId) {
        return ticketTypeMapper.toTicketTypeResponse(findTicketType(ticketTypeId));
    }

    @Override
    public TicketTypeResponse createTicketType(Long eventId, TicketTypeRequest request) {
        Event event = eventService.getEventEntity(eventId);
        checkManageable(event);
        validate(request, event);

        TicketType ticketType = new TicketType();
        ticketType.setEvent(event);
        ticketTypeMapper.updateEntity(ticketType, request);
        return ticketTypeMapper.toTicketTypeResponse(ticketTypeRepository.save(ticketType));
    }

    @Override
    public TicketTypeResponse updateTicketType(Long ticketTypeId, TicketTypeRequest request) {
        TicketType ticketType = findTicketType(ticketTypeId);
        checkManageable(ticketType.getEvent());
        validate(request, ticketType.getEvent());

        if (request.quantity() < ticketType.getSoldQuantity()) {
            throw new BadRequestException("Quantity can't be lower than the " + ticketType.getSoldQuantity() + " tickets already sold");
        }
        if (ticketType.getSoldQuantity() > 0 && request.price().compareTo(ticketType.getPrice()) != 0) {
            throw new BadRequestException("The price can't change once tickets have been sold");
        }

        ticketTypeMapper.updateEntity(ticketType, request);
        return ticketTypeMapper.toTicketTypeResponse(ticketTypeRepository.save(ticketType));
    }

    @Override
    public void deleteTicketType(Long ticketTypeId) {
        TicketType ticketType = findTicketType(ticketTypeId);
        checkManageable(ticketType.getEvent());

        if (registrationRepository.existsByTicketTypeId(ticketTypeId)) {
            throw new ConflictException("Tickets of this type were already sold, deactivate it instead");
        }
        ticketTypeRepository.delete(ticketType);
    }

    private void checkManageable(Event event) {
        organizationAccessService.checkAccess(event.getOrganizer().getId(), StaffRole.MODERATOR, StaffRole.ORGANIZER);
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("Tickets of a " + event.getStatus().name().toLowerCase() + " event can't be changed");
        }
    }

    private void validate(TicketTypeRequest request, Event event) {
        if (request.saleStart() != null && request.saleEnd() != null && !request.saleEnd().isAfter(request.saleStart())) {
            throw new BadRequestException("The sale end must be after the sale start");
        }
        if (request.saleEnd() != null && request.saleEnd().isAfter(event.getEndDateTime())) {
            throw new BadRequestException("Sales can't end after the event");
        }
        if (request.quantity() > event.getCapacity()) {
            throw new BadRequestException("Quantity exceeds the event capacity (" + event.getCapacity() + ")");
        }
    }

    private TicketType findTicketType(Long ticketTypeId) {
        return ticketTypeRepository.findById(ticketTypeId)
                .orElseThrow(() -> new NotFoundException("Ticket type not found"));
    }
}
