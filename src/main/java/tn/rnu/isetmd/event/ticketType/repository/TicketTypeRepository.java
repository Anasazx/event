package tn.rnu.isetmd.event.ticketType.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {

    List<TicketType> findByEventIdOrderByPriceAsc(Long eventId);

    boolean existsByEventIdAndActiveTrue(Long eventId);

    @Query("select min(t.price) from TicketType t where t.event.id = :eventId and t.active = true")
    BigDecimal findMinPriceByEventId(@Param("eventId") Long eventId);

    /**
     * Rows of [eventId, minPrice], one query for a whole page of events
     */
    @Query("""
            select t.event.id, min(t.price) from TicketType t
            where t.event.id in :eventIds and t.active = true
            group by t.event.id
            """)
    List<Object[]> findMinPricesByEventIds(@Param("eventIds") Collection<Long> eventIds);
}
