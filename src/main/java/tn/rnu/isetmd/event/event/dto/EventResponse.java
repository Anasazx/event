package tn.rnu.isetmd.event.event.dto;

import tn.rnu.isetmd.event.enums.EventStatus;

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
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        Integer capacity,
        EventStatus status,
        Long organizerId,
        String organizerName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}