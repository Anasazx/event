package tn.rnu.isetmd.event.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank
        String currentPassword,
        @NotBlank @Size(min = 8, max = 100, message = "Password must contain at least 8 characters")
        String newPassword
) {}
