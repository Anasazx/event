package tn.rnu.isetmd.event.eventStaff.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.eventStaff.entity.EventStaff;

public interface EventStaffRepository extends JpaRepository<EventStaff, Long> {
}
