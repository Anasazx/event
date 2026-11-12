package tn.rnu.isetmd.event.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank
        String token,
        @NotBlank @Size(min = 8, max = 100, message = "Password must contain at least 8 characters")
        String newPassword
) {}
