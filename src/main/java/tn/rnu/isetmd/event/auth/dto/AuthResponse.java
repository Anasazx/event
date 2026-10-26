package tn.rnu.isetmd.event.auth.dto;

import tn.rnu.isetmd.event.user.dto.UserResponse;

public record AuthResponse (
        String token,
        long expiresIn,
        UserResponse user
){}
