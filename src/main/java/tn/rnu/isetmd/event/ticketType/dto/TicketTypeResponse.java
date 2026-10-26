package tn.rnu.isetmd.event.ticketType.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TicketTypeResponse(
        Long id,
        Long eventId,
        String name,
        String description,
        BigDecimal price,
        int quantity,
        int soldQuantity,
        int available,
        LocalDateTime saleStart,
        LocalDateTime saleEnd,
        boolean active,
        boolean onSale
) {}
