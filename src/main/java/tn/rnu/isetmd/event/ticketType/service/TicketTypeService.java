package tn.rnu.isetmd.event.ticketType.service;

import tn.rnu.isetmd.event.ticketType.dto.TicketTypeRequest;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeResponse;

import java.util.List;

public interface TicketTypeService {
    List<TicketTypeResponse> getTicketTypesByEvent(Long eventId);
    TicketTypeResponse getTicketTypeById(Long ticketTypeId);
    TicketTypeResponse createTicketType(Long eventId, TicketTypeRequest request);
    TicketTypeResponse updateTicketType(Long ticketTypeId, TicketTypeRequest request);
    void deleteTicketType(Long ticketTypeId);
}
