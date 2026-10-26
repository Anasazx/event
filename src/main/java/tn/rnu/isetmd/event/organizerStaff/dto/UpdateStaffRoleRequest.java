package tn.rnu.isetmd.event.organizerStaff.dto;

import jakarta.validation.constraints.NotNull;
import tn.rnu.isetmd.event.enums.StaffRole;

public record UpdateStaffRoleRequest(
        @NotNull
        StaffRole role
) {}
