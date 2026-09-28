package tn.rnu.isetmd.event.event.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.antlr.v4.runtime.misc.NotNull;
import java.time.LocalDateTime;

public record UpdateEventRequest(

        @NotBlank
        String title,

        String description,

        String coverImage,

        @NotNull
        Long categoryId,

        @NotNull
        Long venueId,

        @NotNull
        @Future
        LocalDateTime startDateTime,

        @NotNull
        @Future
        LocalDateTime endDateTime,

        @NotNull
        @Min(1)
        Integer capacity
) {
}
