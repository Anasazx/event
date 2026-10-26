package tn.rnu.isetmd.event.review.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long userId,
        String username,
        String userProfileImage,
        Long eventId,
        String eventTitle,
        int rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
