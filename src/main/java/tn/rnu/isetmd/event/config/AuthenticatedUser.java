package tn.rnu.isetmd.event.config;

import tn.rnu.isetmd.event.enums.UserRole;

public record AuthenticatedUser(
        Long id,
        String email,
        UserRole role
) {
}
