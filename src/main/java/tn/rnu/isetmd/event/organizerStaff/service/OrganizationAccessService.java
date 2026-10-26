package tn.rnu.isetmd.event.organizerStaff.service;

import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.Optional;

/**
 * Central place for "can the current user act on behalf of this organization" checks.
 */
public interface OrganizationAccessService {

    /**
     * Throws ForbiddenException unless the current user is an admin or an approved
     * staff member of the organization with one of the given roles (any role when empty).
     */
    void checkAccess(Long organizationId, StaffRole... allowedRoles);

    /**
     * Same check without throwing, false for anonymous users.
     */
    boolean hasAccess(Long organizationId, StaffRole... allowedRoles);

    /**
     * The approved membership of the user, throws ForbiddenException when there is none.
     */
    OrganizationStaff requireOwnMembership(Long userId, StaffRole... allowedRoles);

    Optional<OrganizationStaff> findApprovedMembership(Long userId);

    void promoteToOrganizer(User user);

    void demoteToUser(User user);
}
