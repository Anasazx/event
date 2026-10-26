package tn.rnu.isetmd.event.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest (
    @NotBlank @Size(max = 60)
    String firstName,
    @NotBlank @Size(max = 60)
    String lastName,
    @NotBlank @Email
    String email,
    @NotBlank @Size(min = 8, max = 100, message = "Password must contain at least 8 characters")
    String password
){}
