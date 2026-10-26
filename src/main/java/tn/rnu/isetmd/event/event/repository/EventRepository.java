package tn.rnu.isetmd.event.event.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.event.entity.Event;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    /**
     * Catalogue search, the associations displayed on event cards are fetched in the same query (no N+1)
     */
    @Override
    @EntityGraph(attributePaths = {"category", "venue", "organizer"})
    Page<Event> findAll(Specification<Event> spec, Pageable pageable);

    List<Event> findByOrganizerIdOrderByStartDateTimeDesc(Long organizerId);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByVenueId(Long venueId);

    boolean existsByOrganizerId(Long organizerId);

    long countByStatus(EventStatus status);

    long countByOrganizerId(Long organizerId);

    long countByOrganizerIdAndStatusIn(Long organizerId, List<EventStatus> statuses);

    @Modifying
    @Query("""
            update Event e set e.status = :to
            where e.status = :from and e.startDateTime <= :now and e.endDateTime > :now
            """)
    int startEvents(@Param("from") EventStatus from, @Param("to") EventStatus to, @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            update Event e set e.status = :to
            where e.status in :from and e.endDateTime <= :now
            """)
    int completeEvents(@Param("from") List<EventStatus> from, @Param("to") EventStatus to, @Param("now") LocalDateTime now);

    @Query("""
            select e from Event e
            where e.status = :status and e.reminderSent = false
              and e.startDateTime > :now and e.startDateTime <= :until
            """)
    List<Event> findEventsNeedingReminder(@Param("status") EventStatus status,
                                          @Param("now") LocalDateTime now,
                                          @Param("until") LocalDateTime until);

    @Query("select e from Event e where e.status in :statuses order by e.registeredCount desc limit 5")
    List<Event> findTopByRegistrations(@Param("statuses") List<EventStatus> statuses);
}
