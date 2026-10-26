package tn.rnu.isetmd.event.venue.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.venue.entity.Venue;

import java.util.List;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    @Query("""
            select v from Venue v
            where lower(v.name) like lower(concat('%', :search, '%'))
               or lower(v.city) like lower(concat('%', :search, '%'))
            order by v.city, v.name
            """)
    List<Venue> search(@Param("search") String search);

    @Query("select distinct v.city from Venue v order by v.city")
    List<String> findDistinctCities();
}
