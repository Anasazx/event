package tn.rnu.isetmd.event.ticketType.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;

public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {
}
