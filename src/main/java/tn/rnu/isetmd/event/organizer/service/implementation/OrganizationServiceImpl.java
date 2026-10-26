package tn.rnu.isetmd.event.organizer.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.event.repository.EventRepository;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.MyOrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.OrganizationStatsResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.organizer.mapper.OrganizationMapper;
import tn.rnu.isetmd.event.organizer.repository.OrganizationRepository;
import tn.rnu.isetmd.event.organizer.service.OrganizationService;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.organizerStaff.repository.OrganizationStaffRepository;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationAccessService;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.service.UserService;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationServiceImpl implements OrganizationService {

    private static final List<RegistrationStatus> ACTIVE_REGISTRATIONS =
            List.of(RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN);
    private static final List<RegistrationStatus> PAID_REGISTRATIONS =
            List.of(RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN);

    private final OrganizationRepository organizationRepository;
    private final OrganizationStaffRepository organizationStaffRepository;
    private final OrganizationMapper organizationMapper;
    private final OrganizationAccessService organizationAccessService;
    private final UserService userService;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final NotificationService notificationService;

    @Override
    public OrganizationResponse createOrganization(CreateOrganizationRequest request, Long currentUserId) {

        Optional<OrganizationStaff> organizationStaffOpt = organizationStaffRepository.findByUserId(currentUserId);

        if (organizationStaffOpt.isPresent()) {
            OrganizationStaff existing = organizationStaffOpt.get();
            if (existing.getStatus() != RequestStatus.REJECTED) {
                throw new ConflictException("User already belongs to an organization or has a pending request");
            }
            // A rejected request does not block the user from creating his own organization
            organizationStaffRepository.delete(existing);
            organizationStaffRepository.flush();
        }

        if (organizationRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new ConflictException("An organization with this name already exists");
        }

        User currentUser = userService.getUserEntity(currentUserId);
        Organization savedOrganization = organizationRepository.save(organizationMapper.toEntity(request));

        // The creator is the moderator (owner) of the organization
        OrganizationStaff organizationStaff = new OrganizationStaff(
                savedOrganization,
                currentUser,
                StaffRole.MODERATOR,
                RequestStatus.APPROVED
        );
        organizationStaffRepository.save(organizationStaff);
        organizationAccessService.promoteToOrganizer(currentUser);

        notificationService.notify(
                currentUser,
                null,
                NotificationType.SYSTEM,
                "Organization created",
                "\"" + savedOrganization.getName() + "\" is ready. You can now create your first event."
        );

        return organizationMapper.toOrganizationResponse(savedOrganization);
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationResponse getOrganizationById(Long id) {
        return organizationMapper.toOrganizationResponse(findOrganization(id));
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationResponse getOrganizationByUserId(Long userId) {
        OrganizationStaff organizationStaff = organizationStaffRepository.findByUserIdAndStatus(userId, RequestStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("User doesn't belong to any organization"));
        return organizationMapper.toOrganizationResponse(organizationStaff.getOrganization());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MyOrganizationResponse> getMyOrganization(Long userId) {
        return organizationStaffRepository.findByUserId(userId)
                .map(staff -> new MyOrganizationResponse(
                        organizationMapper.toOrganizationResponse(staff.getOrganization()),
                        staff.getId(),
                        staff.getRole(),
                        staff.getStatus()
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationStatsResponse getMyOrganizationStats(Long userId) {
        Long organizationId = organizationAccessService.requireOwnMembership(userId).getOrganization().getId();
        return new OrganizationStatsResponse(
                eventRepository.countByOrganizerId(organizationId),
                eventRepository.countByOrganizerIdAndStatusIn(organizationId, List.of(EventStatus.PUBLISHED, EventStatus.ONGOING)),
                registrationRepository.countByOrganization(organizationId, ACTIVE_REGISTRATIONS),
                registrationRepository.sumRevenueByOrganization(organizationId, PAID_REGISTRATIONS),
                organizationStaffRepository.findByOrganizationIdAndStatus(organizationId, RequestStatus.APPROVED).size(),
                organizationStaffRepository.findByOrganizationIdAndStatus(organizationId, RequestStatus.PENDING).size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationResponse> getAllOrganization(String search, Boolean verified) {
        return organizationRepository.search(search == null ? "" : search.trim(), verified).stream()
                .map(organizationMapper::toOrganizationResponse)
                .toList();
    }

    @Override
    public OrganizationResponse updateOrganizationById(Long organizationId, UpdateOrganizationRequest request) {
        Organization organization = findOrganization(organizationId);
        organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);

        organizationMapper.updateEntity(organization, request);
        return organizationMapper.toOrganizationResponse(organizationRepository.save(organization));
    }

    @Override
    public OrganizationResponse verifyOrganization(Long organizationId, boolean verified) {
        Organization organization = findOrganization(organizationId);
        organization.setVerified(verified);
        Organization saved = organizationRepository.save(organization);

        if (verified) {
            List<User> moderators = organizationStaffRepository.findByOrganizationIdAndStatus(organizationId, RequestStatus.APPROVED)
                    .stream()
                    .filter(staff -> staff.getRole() == StaffRole.MODERATOR)
                    .map(OrganizationStaff::getUser)
                    .toList();
            notificationService.notifyAll(moderators, null, NotificationType.SYSTEM,
                    "Organization verified",
                    "\"" + organization.getName() + "\" is now a verified organizer.");
        }
        return organizationMapper.toOrganizationResponse(saved);
    }

    @Override
    public void deleteOrganizationById(Long organizationId) {
        Organization organization = findOrganization(organizationId);
        organizationAccessService.checkAccess(organizationId, StaffRole.MODERATOR);

        if (eventRepository.existsByOrganizerId(organizationId)) {
            throw new ConflictException("Delete or transfer the organization's events first");
        }

        organizationStaffRepository.findByOrganizationIdOrderByAddedAtAsc(organizationId).forEach(staff -> {
            if (staff.getStatus() == RequestStatus.APPROVED) {
                organizationAccessService.demoteToUser(staff.getUser());
            }
        });
        organizationRepository.delete(organization);
    }

    private Organization findOrganization(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

}
