package tn.rnu.isetmd.event.organizer.dto;

import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;

/**
 * The organization of the current user together with his membership
 */
public record MyOrganizationResponse(
        OrganizationResponse organization,
        Long staffId,
        StaffRole role,
        RequestStatus status
) {}
