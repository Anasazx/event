package tn.rnu.isetmd.event.ticketType.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeRequest;
import tn.rnu.isetmd.event.ticketType.dto.TicketTypeResponse;
import tn.rnu.isetmd.event.ticketType.service.TicketTypeService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TicketTypeController {

    private final TicketTypeService ticketTypeService;

    @GetMapping("/events/{eventId}/ticket-types")
    List<TicketTypeResponse> getTicketTypesByEvent(@PathVariable Long eventId) {
        return ticketTypeService.getTicketTypesByEvent(eventId);
    }

    @PostMapping("/events/{eventId}/ticket-types")
    @ResponseStatus(HttpStatus.CREATED)
    TicketTypeResponse createTicketType(@PathVariable Long eventId, @Valid @RequestBody TicketTypeRequest request) {
        return ticketTypeService.createTicketType(eventId, request);
    }

    @GetMapping("/ticket-types/{ticketTypeId}")
    TicketTypeResponse getTicketType(@PathVariable Long ticketTypeId) {
        return ticketTypeService.getTicketTypeById(ticketTypeId);
    }

    @PutMapping("/ticket-types/{ticketTypeId}")
    TicketTypeResponse updateTicketType(@PathVariable Long ticketTypeId, @Valid @RequestBody TicketTypeRequest request) {
        return ticketTypeService.updateTicketType(ticketTypeId, request);
    }

    @DeleteMapping("/ticket-types/{ticketTypeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteTicketType(@PathVariable Long ticketTypeId) {
        ticketTypeService.deleteTicketType(ticketTypeId);
    }

}
