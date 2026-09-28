package tn.rnu.isetmd.event.venue.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.venue.entity.Venue;

public interface VenueRepository extends JpaRepository<Venue, Long> {
}
