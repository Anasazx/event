package tn.rnu.isetmd.event.organizerStaff.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.exception.ForbiddenException;
import tn.rnu.isetmd.event.config.AuthenticatedUser;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.organizerStaff.repository.OrganizationStaffRepository;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationAccessService;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;

import java.util.Arrays;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationAccessServiceImpl implements OrganizationAccessService {

    private final OrganizationStaffRepository organizationStaffRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public void checkAccess(Long organizationId, StaffRole... allowedRoles) {
        if (!hasAccess(organizationId, allowedRoles)) {
            throw new ForbiddenException("You are not allowed to manage this organization");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAccess(Long organizationId, StaffRole... allowedRoles) {
        Optional<AuthenticatedUser> currentUser = SecurityUtils.findCurrentUser();
        if (currentUser.isEmpty()) {
            return false;
        }
        if (currentUser.get().role() == UserRole.ADMIN) {
            return true;
        }
        return findApprovedMembership(currentUser.get().id())
                .filter(staff -> Objects.equals(staff.getOrganization().getId(), organizationId))
                .filter(staff -> hasRole(staff, allowedRoles))
                .isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationStaff requireOwnMembership(Long userId, StaffRole... allowedRoles) {
        OrganizationStaff staff = findApprovedMembership(userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of any organization"));
        if (!hasRole(staff, allowedRoles)) {
            throw new ForbiddenException("Your staff role does not allow this action");
        }
        return staff;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OrganizationStaff> findApprovedMembership(Long userId) {
        return organizationStaffRepository.findByUserIdAndStatus(userId, RequestStatus.APPROVED);
    }

    @Override
    public void promoteToOrganizer(User user) {
        if (user.getRole() == UserRole.USER) {
            user.setRole(UserRole.ORGANIZER);
            userRepository.save(user);
        }
    }

    @Override
    public void demoteToUser(User user) {
        if (user.getRole() == UserRole.ORGANIZER) {
            user.setRole(UserRole.USER);
            userRepository.save(user);
        }
    }

    private boolean hasRole(OrganizationStaff staff, StaffRole... allowedRoles) {
        return allowedRoles.length == 0 || Arrays.asList(allowedRoles).contains(staff.getRole());
    }
}
