package tn.rnu.isetmd.event.event.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.event.dto.CancelEventRequest;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.dto.EventSearchCriteria;
import tn.rnu.isetmd.event.event.dto.EventStatsResponse;
import tn.rnu.isetmd.event.event.dto.UpdateEventRequest;
import tn.rnu.isetmd.event.event.service.EventService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(request, SecurityUtils.getCurrentUserId());
    }

    @GetMapping("/{id}")
    public EventResponse getEventById(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    /**
     * Public catalogue: published and ongoing events, filtered and paginated.
     * sort = date (default) | newest | popular | rating
     */
    @GetMapping
    public PageResponse<EventResponse> searchEvents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "false") boolean freeOnly,
            @RequestParam(defaultValue = "false") boolean includePast,
            @RequestParam(defaultValue = "date") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        EventSearchCriteria criteria = new EventSearchCriteria(
                keyword, categoryId, city, organizationId, from, to, freeOnly, includePast);
        return eventService.searchEvents(criteria, sort, page, size);
    }

    /**
     * Every event of the current user's organization, drafts included
     */
    @GetMapping("/organization/me")
    public List<EventResponse> getMyOrganizationEvents() {
        return eventService.getMyOrganizationEvents(SecurityUtils.getCurrentUserId());
    }

    @GetMapping("/{id}/stats")
    public EventStatsResponse getEventStats(@PathVariable Long id) {
        return eventService.getEventStats(id);
    }

    @PutMapping("/{id}")
    public EventResponse updateEvent(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request) {
        return eventService.updateEvent(id, request);
    }

    @PatchMapping("/{id}/publish")
    public EventResponse publishEvent(@PathVariable Long id) {
        return eventService.publishEvent(id);
    }

    @PatchMapping("/{id}/cancel")
    public EventResponse cancelEvent(@PathVariable Long id, @Valid @RequestBody(required = false) CancelEventRequest request) {
        return eventService.cancelEvent(id, request != null ? request.reason() : null);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
    }

}
