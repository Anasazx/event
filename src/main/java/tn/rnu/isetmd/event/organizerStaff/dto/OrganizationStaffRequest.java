package tn.rnu.isetmd.event.organizerStaff.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tn.rnu.isetmd.event.enums.StaffRole;

/**
 * Adds an existing user (found by email) to the organization
 */
public record OrganizationStaffRequest(
        @NotBlank @Email
        String email,
        @NotNull
        StaffRole role
) {}
