package tn.rnu.isetmd.event.event.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.event.entity.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
}
