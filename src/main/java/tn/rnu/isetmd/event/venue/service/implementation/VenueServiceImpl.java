package tn.rnu.isetmd.event.venue.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.venue.dto.VenueRequest;
import tn.rnu.isetmd.event.venue.dto.VenueResponse;
import tn.rnu.isetmd.event.venue.entity.Venue;
import tn.rnu.isetmd.event.venue.mapper.VenueMapper;
import tn.rnu.isetmd.event.venue.repository.VenueRepository;
import tn.rnu.isetmd.event.venue.service.VenueService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final VenueMapper venueMapper;
    private final EventRepository eventRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VenueResponse> searchVenues(String search) {
        return venueRepository.search(search == null ? "" : search.trim()).stream()
                .map(venueMapper::toVenueResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCities() {
        return venueRepository.findDistinctCities();
    }

    @Override
    @Transactional(readOnly = true)
    public VenueResponse getVenueById(Long id) {
        return venueMapper.toVenueResponse(findVenue(id));
    }

    @Override
    public VenueResponse createVenue(VenueRequest request) {
        Venue venue = new Venue();
        venueMapper.updateEntity(venue, request);
        return venueMapper.toVenueResponse(venueRepository.save(venue));
    }

    @Override
    public VenueResponse updateVenue(Long id, VenueRequest request) {
        Venue venue = findVenue(id);
        venueMapper.updateEntity(venue, request);
        return venueMapper.toVenueResponse(venueRepository.save(venue));
    }

    @Override
    public void deleteVenue(Long id) {
        Venue venue = findVenue(id);
        if (eventRepository.existsByVenueId(id)) {
            throw new ConflictException("This venue is used by existing events");
        }
        venueRepository.delete(venue);
    }

    private Venue findVenue(Long id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venue not found"));
    }
}
