package tn.rnu.isetmd.event.event.specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.event.dto.EventSearchCriteria;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class EventSpecifications {

    private EventSpecifications() {
    }

    /**
     * Builds the WHERE clause of the public catalogue from the optional filters.
     * Drafts and cancelled events are never listed.
     */
    public static Specification<Event> publicSearch(EventSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();

            if (criteria.includePast()) {
                predicates.add(root.get("status").in(EventStatus.PUBLISHED, EventStatus.ONGOING, EventStatus.COMPLETED));
            } else {
                predicates.add(root.get("status").in(EventStatus.PUBLISHED, EventStatus.ONGOING));
                predicates.add(cb.greaterThan(root.get("endDateTime"), now));
            }

            if (criteria.keyword() != null && !criteria.keyword().isBlank()) {
                String pattern = "%" + criteria.keyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("organizer").get("name")), pattern)
                ));
            }

            if (criteria.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), criteria.categoryId()));
            }

            if (criteria.city() != null && !criteria.city().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("venue").get("city")), criteria.city().trim().toLowerCase()));
            }

            if (criteria.organizationId() != null) {
                predicates.add(cb.equal(root.get("organizer").get("id"), criteria.organizationId()));
            }

            if (criteria.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startDateTime"), criteria.from().atStartOfDay()));
            }

            if (criteria.to() != null) {
                predicates.add(cb.lessThan(root.get("startDateTime"), criteria.to().plusDays(1).atStartOfDay()));
            }

            if (criteria.freeOnly()) {
                Subquery<Long> freeTicket = query.subquery(Long.class);
                var ticket = freeTicket.from(TicketType.class);
                freeTicket.select(ticket.get("id")).where(
                        cb.equal(ticket.get("event"), root),
                        cb.equal(ticket.get("price"), BigDecimal.ZERO),
                        cb.isTrue(ticket.get("active"))
                );
                predicates.add(cb.exists(freeTicket));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
