package tn.rnu.isetmd.event.venue.service;

import tn.rnu.isetmd.event.venue.dto.VenueRequest;
import tn.rnu.isetmd.event.venue.dto.VenueResponse;

import java.util.List;

public interface VenueService {
    List<VenueResponse> searchVenues(String search);
    List<String> getCities();
    VenueResponse getVenueById(Long id);
    VenueResponse createVenue(VenueRequest request);
    VenueResponse updateVenue(Long id, VenueRequest request);
    void deleteVenue(Long id);
}
