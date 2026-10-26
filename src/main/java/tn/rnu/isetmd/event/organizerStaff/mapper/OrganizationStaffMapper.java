package tn.rnu.isetmd.event.organizerStaff.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffResponse;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;

@Component
public class OrganizationStaffMapper {

    public OrganizationStaffResponse toOrganizationStaffResponse(OrganizationStaff staff) {
        return new OrganizationStaffResponse(
                staff.getId(),
                staff.getOrganization().getId(),
                staff.getOrganization().getName(),
                staff.getUser().getId(),
                staff.getUser().getFirstName(),
                staff.getUser().getLastName(),
                staff.getUser().getEmail(),
                staff.getRole(),
                staff.getStatus(),
                staff.getAddedAt()
        );
    }

}
