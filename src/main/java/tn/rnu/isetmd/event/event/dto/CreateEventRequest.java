package tn.rnu.isetmd.event.event.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateEventRequest(

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
        @Future
        LocalDateTime startDateTime,

        @NotNull
        @Future
        LocalDateTime endDateTime,

        @NotNull
        @Min(1)
        Integer capacity

) {}
