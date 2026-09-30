package tn.rnu.isetmd.event.auth.dto;

public record LoginRequest (
    String email,
    String password
){}