package tn.rnu.isetmd.event.event.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * Dates are not required to be in the future here: an ongoing event can still be edited.
 */
public record UpdateEventRequest(

        @NotBlank @Size(max = 150)
        String title,

        @Size(max = 5000)
        String description,

        String coverImage,

        @NotNull
        Long categoryId,

        @NotNull
        Long venueId,

        @NotNull
        LocalDateTime startDateTime,

        @NotNull
        LocalDateTime endDateTime,

        @NotNull
        @Min(1)
        Integer capacity
) {
}
