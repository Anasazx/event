package tn.rnu.isetmd.event.event.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.entity.Event;

@Component
public class EventMapper {
    public Event toEntity(CreateEventRequest request) {
        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setCoverImage(request.coverImage());
        event.setStartDateTime(request.startDateTime());
        event.setEndDateTime(request.endDateTime());
        event.setCapacity(request.capacity());
        return event;
    }

    public EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCoverImage(),
                event.getCategory().getId(),
                event.getCategory().getName(),
                event.getVenue().getId(),
                event.getVenue().getName(),
                event.getStartDateTime(),
                event.getEndDateTime(),
                event.getCapacity(),
                event.getStatus(),
                event.getOrganizer().getId(),
                event.getOrganizer().getName(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

}