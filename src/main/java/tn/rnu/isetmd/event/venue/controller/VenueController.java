package tn.rnu.isetmd.event.venue.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.venue.dto.VenueRequest;
import tn.rnu.isetmd.event.venue.dto.VenueResponse;
import tn.rnu.isetmd.event.venue.service.VenueService;

import java.util.List;

@RestController
@RequestMapping("/api/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @GetMapping
    List<VenueResponse> searchVenues(@RequestParam(required = false) String search) {
        return venueService.searchVenues(search);
    }

    @GetMapping("/cities")
    List<String> getCities() {
        return venueService.getCities();
    }

    @GetMapping("/{id}")
    VenueResponse getVenueById(@PathVariable Long id) {
        return venueService.getVenueById(id);
    }

    // Organizers can add the venue of their event if it does not exist yet
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    VenueResponse createVenue(@Valid @RequestBody VenueRequest request) {
        return venueService.createVenue(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    VenueResponse updateVenue(@PathVariable Long id, @Valid @RequestBody VenueRequest request) {
        return venueService.updateVenue(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    void deleteVenue(@PathVariable Long id) {
        venueService.deleteVenue(id);
    }

}
