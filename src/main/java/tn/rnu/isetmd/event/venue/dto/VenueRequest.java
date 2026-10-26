package tn.rnu.isetmd.event.venue.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VenueRequest(
        @NotBlank @Size(max = 120)
        String name,
        @NotBlank @Size(max = 255)
        String address,
        @NotBlank @Size(max = 80)
        String city,
        @NotBlank @Size(max = 80)
        String country,
        @DecimalMin("-90") @DecimalMax("90")
        Double latitude,
        @DecimalMin("-180") @DecimalMax("180")
        Double longitude,
        @Min(1)
        Integer capacity,
        @Size(max = 1000)
        String description
) {}
