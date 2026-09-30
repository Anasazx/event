package tn.rnu.isetmd.event.auth.dto;

public record RegisterRequest (
    String firstName,
    String lastName,
    String email,
    String password
){}