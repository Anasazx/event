package tn.rnu.isetmd.event.organizer.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.organizer.mapper.OrganizationMapper;
import tn.rnu.isetmd.event.organizer.repository.OrganizationRepository;
import tn.rnu.isetmd.event.organizer.service.OrganizationService;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.organizerStaff.repository.OrganizationStaffRepository;
import tn.rnu.isetmd.event.user.entity.User;
import tn.rnu.isetmd.event.user.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationStaffRepository organizationStaffRepository;
    private final OrganizationMapper organizationMapper;
    private final UserRepository userRepository;

    @Override
    public OrganizationResponse createOrganization(CreateOrganizationRequest request, Long currentUserId) {

        Optional<OrganizationStaff> organizationStaffOpt = organizationStaffRepository.findByUserId(currentUserId);

        if (organizationStaffOpt.isPresent()) {
            throw new RuntimeException("User already belongs to an organization");
        }

        Organization newOrganization = new Organization();
        newOrganization.setName(request.name());
        newOrganization.setPhone(request.phone());
        newOrganization.setWebsite(request.website());
        newOrganization.setDescription(request.description());

        Organization savedOrganization = organizationRepository.save(newOrganization);
        Optional<User> currentUserOpt = userRepository.findById(currentUserId);

        if (currentUserOpt.isEmpty()) {
            throw new RuntimeException();
        }

        OrganizationStaff organizationStaff = new OrganizationStaff(
                savedOrganization,
                currentUserOpt.get(),
                StaffRole.MODERATOR
        );

        organizationStaffRepository.save(organizationStaff);


        return organizationMapper.toOrganizationResponse(savedOrganization);
    }


    @Override
    public OrganizationResponse getOrganizationById(Long id) {
        Optional<Organization> organization = organizationRepository.findById(id);
        if (organization.isEmpty()) {
            throw new RuntimeException("Organization not found");
        }
        return organizationMapper.toOrganizationResponse(organization.get());
    }

    @Override
    public OrganizationResponse getOrganizationByUserId(Long userId) {
        Optional<OrganizationStaff> organizationStaff = organizationStaffRepository.findByUserId(userId);
        if (organizationStaff.isEmpty()) {
            throw new RuntimeException("User doesnt belong to any organization");
        }
        return organizationMapper.toOrganizationResponse(organizationStaff.get().getOrganization());
    }

    @Override
    public List<OrganizationResponse> getAllOrganization() {
        return organizationRepository.findAll().stream()
                .map(organizationMapper::toOrganizationResponse)
                .toList();
    }

    @Override
    public OrganizationResponse updateOrganizationById(Long organizationId, UpdateOrganizationRequest request) {
        Optional<Organization> oldOrganization = organizationRepository.findById(organizationId);
        if (oldOrganization.isEmpty()) {
            throw new RuntimeException("Organization not found");
        }
        Organization newOrganization = oldOrganization.get();
        newOrganization.setName(request.name());
        newOrganization.setPhone(request.phone());
        newOrganization.setWebsite(request.website());
        newOrganization.setDescription(request.description());
        return organizationMapper.toOrganizationResponse(organizationRepository.save(newOrganization));
    }

    @Override
    public void deleteOrganizationById(Long organizationId) {
        organizationRepository.deleteById(organizationId);
    }

}
