package tn.rnu.isetmd.event.unit;

import org.junit.jupiter.api.Test;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class TicketTypeTest {

    private final LocalDateTime now = LocalDateTime.of(2026, 6, 1, 12, 0);

    @Test
    void ticketIsOnSaleWhenActiveInStockAndInsideTheWindow() {
        TicketType ticket = ticket(10, 3);
        ticket.setSaleStart(now.minusDays(1));
        ticket.setSaleEnd(now.plusDays(1));

        assertThat(ticket.getAvailable()).isEqualTo(7);
        assertThat(ticket.isOnSale(now)).isTrue();
    }

    @Test
    void ticketIsNotOnSaleWhenSoldOutInactiveOrOutsideTheWindow() {
        assertThat(ticket(5, 5).isOnSale(now)).isFalse();

        TicketType inactive = ticket(5, 0);
        inactive.setActive(false);
        assertThat(inactive.isOnSale(now)).isFalse();

        TicketType notStarted = ticket(5, 0);
        notStarted.setSaleStart(now.plusHours(1));
        assertThat(notStarted.isOnSale(now)).isFalse();

        TicketType ended = ticket(5, 0);
        ended.setSaleEnd(now);
        assertThat(ended.isOnSale(now)).isFalse();
    }

    @Test
    void availableSeatsNeverGoNegative() {
        Event event = new Event();
        event.setCapacity(10);
        event.setRegisteredCount(12);
        assertThat(event.getAvailableSeats()).isZero();
    }

    private TicketType ticket(int quantity, int sold) {
        TicketType ticket = new TicketType();
        ticket.setQuantity(quantity);
        ticket.setSoldQuantity(sold);
        return ticket;
    }
}
