package tn.rnu.isetmd.event.venue.dto;

public record VenueResponse(
        Long id,
        String name,
        String address,
        String city,
        String country,
        Double latitude,
        Double longitude,
        Integer capacity,
        String description
) {}
