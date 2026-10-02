package tn.rnu.isetmd.event.review.dto;

public record UpdateReviewRequest (
        int rating,
        String comment
){}
