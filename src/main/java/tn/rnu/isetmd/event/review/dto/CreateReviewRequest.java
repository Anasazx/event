package tn.rnu.isetmd.event.review.dto;

public record CreateReviewRequest(
        Long eventId,
        int rating,
        String comment
) {
}
