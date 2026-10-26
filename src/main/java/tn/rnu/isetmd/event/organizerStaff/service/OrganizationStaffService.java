package tn.rnu.isetmd.event.organizerStaff.service;

import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffRequest;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffResponse;

import java.util.List;

public interface OrganizationStaffService {
    OrganizationStaffResponse addUserToOrganizationWithRole(Long organizationId, OrganizationStaffRequest request);
    OrganizationStaffResponse requestToJoin(Long organizationId, Long userId);
    List<OrganizationStaffResponse> getStaff(Long organizationId);
    OrganizationStaffResponse approveRequest(Long organizationId, Long staffId, StaffRole role);
    OrganizationStaffResponse rejectRequest(Long organizationId, Long staffId);
    OrganizationStaffResponse updateRole(Long organizationId, Long staffId, StaffRole role);
    void removeStaff(Long organizationId, Long staffId, Long currentUserId);
}
