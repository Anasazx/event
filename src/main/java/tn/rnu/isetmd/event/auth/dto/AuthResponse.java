package tn.rnu.isetmd.event.auth.dto;

public record AuthResponse (
        String token,
        String role,
        String username
){}