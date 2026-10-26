package tn.rnu.isetmd.event.organizerStaff.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.organizer.repository.OrganizationRepository;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffRequest;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffResponse;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.organizerStaff.mapper.OrganizationStaffMapper;
import tn.rnu.isetmd.event.organizerStaff.repository.OrganizationStaffRepository;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationAccessService;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationStaffService;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;
import tn.rnu.isetmd.event.user.service.UserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationStaffServiceImpl implements OrganizationStaffService {

    private final OrganizationStaffRepository organizationStaffRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationStaffMapper organizationStaffMapper;
    private final OrganizationAccessService organizationAccessService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Override
    public OrganizationStaffResponse addUserToOrganizationWithRole(Long organizationId, OrganizationStaffRequest request) {
        Organization organization = findOrganization(organizationId);
        organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);

        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new NotFoundException("No user found with this email"));

        clearRejectedOrFail(user.getId());

        OrganizationStaff staff = organizationStaffRepository.save(
                new OrganizationStaff(organization, user, request.role(), RequestStatus.APPROVED)
        );
        organizationAccessService.promoteToOrganizer(user);

        notificationService.notify(user, null, NotificationType.SYSTEM,
                "You joined " + organization.getName(),
                "You were added to \"" + organization.getName() + "\" as " + request.role().name().toLowerCase() + ".");

        return organizationStaffMapper.toOrganizationStaffResponse(staff);
    }

    @Override
    public OrganizationStaffResponse requestToJoin(Long organizationId, Long userId) {
        Organization organization = findOrganization(organizationId);
        User user = userService.getUserEntity(userId);

        clearRejectedOrFail(userId);

        OrganizationStaff staff = organizationStaffRepository.save(
                new OrganizationStaff(organization, user, StaffRole.VOLUNTEER, RequestStatus.PENDING)
        );

        List<User> moderators = moderatorsOf(organizationId);
        notificationService.notifyAll(moderators, null, NotificationType.SYSTEM,
                "New join request",
                user.getFullName() + " wants to join \"" + organization.getName() + "\".");

        return organizationStaffMapper.toOrganizationStaffResponse(staff);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationStaffResponse> getStaff(Long organizationId) {
        findOrganization(organizationId);
        organizationAccessService.checkAccess(organizationId);

        return organizationStaffRepository.findByOrganizationIdOrderByAddedAtAsc(organizationId).stream()
                .map(organizationStaffMapper::toOrganizationStaffResponse)
                .toList();
    }

    @Override
    public OrganizationStaffResponse approveRequest(Long organizationId, Long staffId, StaffRole role) {
        organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);
        OrganizationStaff staff = findStaff(organizationId, staffId);

        if (staff.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be approved");
        }

        staff.setStatus(RequestStatus.APPROVED);
        if (role != null) {
            staff.setRole(role);
        }
        staff.setAddedAt(LocalDateTime.now());
        organizationAccessService.promoteToOrganizer(staff.getUser());

        notificationService.notify(staff.getUser(), null, NotificationType.SYSTEM,
                "Request approved",
                "Welcome to \"" + staff.getOrganization().getName() + "\"! You joined as " + staff.getRole().name().toLowerCase() + ".");

        return organizationStaffMapper.toOrganizationStaffResponse(organizationStaffRepository.save(staff));
    }

    @Override
    public OrganizationStaffResponse rejectRequest(Long organizationId, Long staffId) {
        organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);
        OrganizationStaff staff = findStaff(organizationId, staffId);

        if (staff.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be rejected");
        }

        staff.setStatus(RequestStatus.REJECTED);

        notificationService.notify(staff.getUser(), null, NotificationType.SYSTEM,
                "Request declined",
                "Your request to join \"" + staff.getOrganization().getName() + "\" was declined.");

        return organizationStaffMapper.toOrganizationStaffResponse(organizationStaffRepository.save(staff));
    }

    @Override
    public OrganizationStaffResponse updateRole(Long organizationId, Long staffId, StaffRole role) {
        organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);
        OrganizationStaff staff = findStaff(organizationId, staffId);

        if (staff.getRole() == StaffRole.MODERATOR && role != StaffRole.MODERATOR) {
            ensureAnotherModerator(organizationId);
        }

        staff.setRole(role);
        return organizationStaffMapper.toOrganizationStaffResponse(organizationStaffRepository.save(staff));
    }

    @Override
    public void removeStaff(Long organizationId, Long staffId, Long currentUserId) {
        OrganizationStaff staff = findStaff(organizationId, staffId);

        // Members can leave on their own (or cancel their pending request), moderators can remove anyone
        boolean leavingOnOwn = Objects.equals(staff.getUser().getId(), currentUserId);
        if (!leavingOnOwn) {
            organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);
        }

        if (staff.getStatus() == RequestStatus.APPROVED && staff.getRole() == StaffRole.MODERATOR) {
            ensureAnotherModerator(organizationId);
        }

        if (staff.getStatus() == RequestStatus.APPROVED) {
            organizationAccessService.demoteToUser(staff.getUser());
        }
        organizationStaffRepository.delete(staff);
    }

    /**
     * A user has at most one membership row. A previously rejected request is
     * cleared so he can try again, anything else blocks the operation.
     */
    private void clearRejectedOrFail(Long userId) {
        Optional<OrganizationStaff> existing = organizationStaffRepository.findByUserId(userId);
        if (existing.isEmpty()) {
            return;
        }
        if (existing.get().getStatus() != RequestStatus.REJECTED) {
            throw new ConflictException("This user already belongs to an organization or has a pending request");
        }
        organizationStaffRepository.delete(existing.get());
        organizationStaffRepository.flush();
    }

    private void ensureAnotherModerator(Long organizationId) {
        long moderators = organizationStaffRepository.countByOrganizationIdAndRoleAndStatus(
                organizationId, StaffRole.MODERATOR, RequestStatus.APPROVED);
        if (moderators <= 1) {
            throw new BadRequestException("The organization must keep at least one moderator");
        }
    }

    private List<User> moderatorsOf(Long organizationId) {
        return organizationStaffRepository.findByOrganizationIdAndStatus(organizationId, RequestStatus.APPROVED).stream()
                .filter(staff -> staff.getRole() == StaffRole.MODERATOR)
                .map(OrganizationStaff::getUser)
                .toList();
    }

    private Organization findOrganization(Long organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    private OrganizationStaff findStaff(Long organizationId, Long staffId) {
        return organizationStaffRepository.findById(staffId)
                .filter(staff -> Objects.equals(staff.getOrganization().getId(), organizationId))
                .orElseThrow(() -> new NotFoundException("Staff member not found"));
    }
}
