package tn.rnu.isetmd.event.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull
        Long eventId,
        @NotNull @Min(1) @Max(5)
        Integer rating,
        @Size(max = 2000)
        String comment
) {
}
