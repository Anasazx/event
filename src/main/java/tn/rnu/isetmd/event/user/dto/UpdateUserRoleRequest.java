package tn.rnu.isetmd.event.user.dto;

import jakarta.validation.constraints.NotNull;
import tn.rnu.isetmd.event.enums.UserRole;

public record UpdateUserRoleRequest(
        @NotNull
        UserRole role
) {}
