package tn.rnu.isetmd.event.organizer.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.entity.Organization;

@Component
public class OrganizationMapper {

    public Organization toEntity(CreateOrganizationRequest organizationRequest){
        return new Organization();
    }

    public OrganizationResponse toOrganizationResponse(Organization organization){
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.getPhone(),
                organization.getWebsite(),
                organization.getDescription(),
                organization.getLogo(),
                organization.isVerified(),
                organization.getCreatedAt()
        );
    }

}
