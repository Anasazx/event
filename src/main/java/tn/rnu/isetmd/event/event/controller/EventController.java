package tn.rnu.isetmd.event.event.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.dto.UpdateEventRequest;
import tn.rnu.isetmd.event.event.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(request);
    }

    @GetMapping("/{id}")
    public EventResponse getEventById(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    @GetMapping
    public List<EventResponse> getAllEvents() {
        return eventService.getAllEvents();
    }

    @PutMapping("/{id}")
    public EventResponse updateEvent(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request) {
        return eventService.updateEvent(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
    }

}