package tn.rnu.isetmd.event.ticketType.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TicketTypeRequest(
        @NotBlank @Size(max = 80)
        String name,
        @Size(max = 1000)
        String description,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2)
        BigDecimal price,
        @NotNull @Min(1)
        Integer quantity,
        LocalDateTime saleStart,
        LocalDateTime saleEnd,
        Boolean active
) {}
