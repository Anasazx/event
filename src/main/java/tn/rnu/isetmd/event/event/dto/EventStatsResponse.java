package tn.rnu.isetmd.event.event.dto;

import java.math.BigDecimal;
import java.util.List;

public record EventStatsResponse(
        Long eventId,
        int capacity,
        int registeredCount,
        long pending,
        long confirmed,
        long checkedIn,
        long cancelled,
        BigDecimal revenue,
        double averageRating,
        int reviewCount,
        List<TicketSales> ticketSales
) {
    public record TicketSales(
            Long ticketTypeId,
            String name,
            BigDecimal price,
            int quantity,
            int sold
    ) {}
}
