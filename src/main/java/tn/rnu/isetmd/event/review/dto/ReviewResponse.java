package tn.rnu.isetmd.event.review.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
        String username,
        int rating,
        String comment,
        LocalDateTime createdAt
) {
}
