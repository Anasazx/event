package tn.rnu.isetmd.event.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 60)
        String firstName,
        @NotBlank @Size(max = 60)
        String lastName,
        String profileImage
) {}
