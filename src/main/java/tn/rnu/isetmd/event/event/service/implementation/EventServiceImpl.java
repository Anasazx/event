package tn.rnu.isetmd.event.event.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.category.repository.CategoryRepository;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.event.dto.CreateEventRequest;
import tn.rnu.isetmd.event.event.dto.EventResponse;
import tn.rnu.isetmd.event.event.dto.UpdateEventRequest;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.mapper.EventMapper;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.event.service.EventService;
import tn.rnu.isetmd.event.organizer.repository.OrganizationRepository;
import tn.rnu.isetmd.event.venue.entity.Venue;
import tn.rnu.isetmd.event.venue.repository.VenueRepository;

import java.util.List;

@RequiredArgsConstructor
@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    private final CategoryRepository categoryRepository;
    private final VenueRepository venueRepository;
    private final OrganizationRepository organizerProfileRepository;

    @Override
    public EventResponse createEvent(CreateEventRequest request) {

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Venue venue = venueRepository.findById(request.venueId())
                .orElseThrow(() -> new RuntimeException("Venue not found"));

        Event event = eventMapper.toEntity(request);
        event.setCategory(category);
        event.setVenue(venue);
        event.setStatus(EventStatus.DRAFT);

        Event savedEvent = eventRepository.save(event);
        return eventMapper.toResponse(savedEvent);
    }

    @Override

    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return eventMapper.toResponse(event);
    }

    @Override
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(eventMapper::toResponse)
                .toList();
    }

    @Override
    public EventResponse updateEvent(Long id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Venue venue = venueRepository.findById(request.venueId())
                .orElseThrow(() -> new RuntimeException("Venue not found"));

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setCoverImage(request.coverImage());
        event.setCategory(category);
        event.setVenue(venue);
        event.setStartDateTime(request.startDateTime());
        event.setEndDateTime(request.endDateTime());
        event.setCapacity(request.capacity());

        Event updatedEvent = eventRepository.save(event);

        return eventMapper.toResponse(updatedEvent);
    }

    @Override
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Event not found");
        }
        eventRepository.deleteById(id);
    }

}
