package tn.rnu.isetmd.event.event.service;

import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.dto.EventSearchCriteria;
import tn.rnu.isetmd.event.event.dto.EventStatsResponse;
import tn.rnu.isetmd.event.event.dto.UpdateEventRequest;
import tn.rnu.isetmd.event.event.entity.Event;

import java.util.List;

public interface EventService {
    EventResponse createEvent(CreateEventRequest request, Long currentUserId);
    EventResponse getEventById(Long id);
    Event getEventEntity(Long id);
    PageResponse<EventResponse> searchEvents(EventSearchCriteria criteria, String sort, int page, int size);
    List<EventResponse> getMyOrganizationEvents(Long currentUserId);
    EventResponse updateEvent(Long id, UpdateEventRequest request);
    EventResponse publishEvent(Long id);
    EventResponse cancelEvent(Long id, String reason);
    void deleteEvent(Long id);
    EventStatsResponse getEventStats(Long id);
    void refreshRating(Long eventId);
}
