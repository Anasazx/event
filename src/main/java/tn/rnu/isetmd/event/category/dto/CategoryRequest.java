package tn.rnu.isetmd.event.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 80)
        String name,
        @Size(max = 1000)
        String description,
        String image
) {}
