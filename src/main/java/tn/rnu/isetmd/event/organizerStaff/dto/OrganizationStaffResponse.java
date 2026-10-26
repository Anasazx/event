package tn.rnu.isetmd.event.organizerStaff.dto;

import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;

import java.time.LocalDateTime;

public record OrganizationStaffResponse(
        Long id,
        Long organizationId,
        String organizationName,
        Long userId,
        String firstName,
        String lastName,
        String email,
        StaffRole role,
        RequestStatus status,
        LocalDateTime addedAt
) {}
