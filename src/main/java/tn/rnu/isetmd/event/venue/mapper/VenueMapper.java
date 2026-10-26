package tn.rnu.isetmd.event.venue.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.venue.dto.VenueRequest;
import tn.rnu.isetmd.event.venue.dto.VenueResponse;
import tn.rnu.isetmd.event.venue.entity.Venue;

@Component
public class VenueMapper {

    public VenueResponse toVenueResponse(Venue venue) {
        return new VenueResponse(
                venue.getId(),
                venue.getName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getCountry(),
                venue.getLatitude(),
                venue.getLongitude(),
                venue.getCapacity(),
                venue.getDescription()
        );
    }

    public void updateEntity(Venue venue, VenueRequest request) {
        venue.setName(request.name().trim());
        venue.setAddress(request.address().trim());
        venue.setCity(request.city().trim());
        venue.setCountry(request.country().trim());
        venue.setLatitude(request.latitude());
        venue.setLongitude(request.longitude());
        venue.setCapacity(request.capacity());
        venue.setDescription(request.description());
    }

}
