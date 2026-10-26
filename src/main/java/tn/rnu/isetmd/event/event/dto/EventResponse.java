package tn.rnu.isetmd.event.event.dto;

import tn.rnu.isetmd.event.enums.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String title,
        String description,
        String coverImage,
        Long categoryId,
        String categoryName,
        Long venueId,
        String venueName,
        String venueAddress,
        String venueCity,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        Integer capacity,
        Integer registeredCount,
        Integer availableSeats,
        EventStatus status,
        Long organizerId,
        String organizerName,
        String organizerLogo,
        boolean organizerVerified,
        BigDecimal minPrice,
        double averageRating,
        int reviewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
