package tn.rnu.isetmd.event.event.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.entity.Event;

import java.math.BigDecimal;

@Component
public class EventMapper {
    public Event toEntity(CreateEventRequest request) {
        Event event = new Event();
        event.setTitle(request.title().trim());
        event.setDescription(request.description());
        event.setCoverImage(request.coverImage());
        event.setStartDateTime(request.startDateTime());
        event.setEndDateTime(request.endDateTime());
        event.setCapacity(request.capacity());
        return event;
    }

    /**
     * @param minPrice cheapest active ticket, null when the event has no ticket yet
     */
    public EventResponse toResponse(Event event, BigDecimal minPrice) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCoverImage(),
                event.getCategory().getId(),
                event.getCategory().getName(),
                event.getVenue().getId(),
                event.getVenue().getName(),
                event.getVenue().getAddress(),
                event.getVenue().getCity(),
                event.getStartDateTime(),
                event.getEndDateTime(),
                event.getCapacity(),
                event.getRegisteredCount(),
                event.getAvailableSeats(),
                event.getStatus(),
                event.getOrganizer().getId(),
                event.getOrganizer().getName(),
                event.getOrganizer().getLogo(),
                event.getOrganizer().isVerified(),
                minPrice,
                Math.round(event.getAverageRating() * 10) / 10.0,
                event.getReviewCount(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

}
