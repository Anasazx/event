package tn.rnu.isetmd.event.organizer.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.entity.Organization;

@Component
public class OrganizationMapper {

    public Organization toEntity(CreateOrganizationRequest request) {
        Organization organization = new Organization();
        organization.setName(request.name().trim());
        organization.setPhone(request.phone());
        organization.setWebsite(request.website());
        organization.setDescription(request.description());
        organization.setEmail(request.email());
        organization.setAddress(request.address());
        organization.setLogo(request.logo());
        return organization;
    }

    public void updateEntity(Organization organization, UpdateOrganizationRequest request) {
        organization.setName(request.name().trim());
        organization.setPhone(request.phone());
        organization.setWebsite(request.website());
        organization.setDescription(request.description());
        organization.setEmail(request.email());
        organization.setAddress(request.address());
        organization.setLogo(request.logo());
    }

    public OrganizationResponse toOrganizationResponse(Organization organization){
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.getPhone(),
                organization.getWebsite(),
                organization.getDescription(),
                organization.getLogo(),
                organization.getEmail(),
                organization.getAddress(),
                organization.isVerified(),
                organization.getCreatedAt()
        );
    }

}
