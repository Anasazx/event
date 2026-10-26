package tn.rnu.isetmd.event.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest (
    @NotBlank @Email
    String email,
    @NotBlank
    String password
){}
