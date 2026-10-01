package tn.rnu.isetmd.event.organizerStaff.service;

import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffRequest;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffResponse;

public interface OrganizationStaffService {
    OrganizationStaffResponse addUserToOrganizationWithRole(OrganizationStaffRequest request);
}
