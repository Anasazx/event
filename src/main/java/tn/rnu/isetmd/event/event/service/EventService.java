package tn.rnu.isetmd.event.event.service;

import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.dto.UpdateEventRequest;

import java.util.List;

public interface EventService {
    EventResponse createEvent(CreateEventRequest request);
    EventResponse getEventById(Long id);
    List<EventResponse> getAllEvents();
    EventResponse updateEvent(Long id, UpdateEventRequest request);
    void deleteEvent(Long id);
}
