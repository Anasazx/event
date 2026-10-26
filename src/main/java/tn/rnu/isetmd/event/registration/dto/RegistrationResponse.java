package tn.rnu.isetmd.event.registration.dto;

import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.RegistrationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RegistrationResponse(
        Long id,
        RegistrationStatus status,
        String qrCode,
        LocalDateTime registeredAt,
        LocalDateTime checkedInAt,
        LocalDateTime cancelledAt,
        Long ticketTypeId,
        String ticketTypeName,
        BigDecimal price,
        Long eventId,
        String eventTitle,
        String eventCoverImage,
        LocalDateTime eventStartDateTime,
        LocalDateTime eventEndDateTime,
        EventStatus eventStatus,
        String venueName,
        String venueCity,
        Long userId,
        String userFullName,
        String userEmail
) {}
