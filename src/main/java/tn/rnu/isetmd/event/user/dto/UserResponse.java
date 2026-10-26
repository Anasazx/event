package tn.rnu.isetmd.event.user.dto;

import tn.rnu.isetmd.event.enums.UserRole;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        UserRole role,
        String profileImage,
        boolean enabled,
        LocalDateTime createdAt
) {}
