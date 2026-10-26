package tn.rnu.isetmd.event.organizerStaff.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffRequest;
import tn.rnu.isetmd.event.organizerStaff.dto.OrganizationStaffResponse;
import tn.rnu.isetmd.event.organizerStaff.dto.UpdateStaffRoleRequest;
import tn.rnu.isetmd.event.organizerStaff.service.OrganizationStaffService;

import java.util.List;

@RestController
@RequestMapping("/api/organizations/{organizationId}")
@RequiredArgsConstructor
public class OrganizationStaffController {

    private final OrganizationStaffService organizationStaffService;

    @GetMapping("/staff")
    List<OrganizationStaffResponse> getStaff(@PathVariable Long organizationId) {
        return organizationStaffService.getStaff(organizationId);
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    OrganizationStaffResponse addStaff(@PathVariable Long organizationId,
                                       @Valid @RequestBody OrganizationStaffRequest request) {
        return organizationStaffService.addUserToOrganizationWithRole(organizationId, request);
    }

    @PostMapping("/join")
    @ResponseStatus(HttpStatus.CREATED)
    OrganizationStaffResponse requestToJoin(@PathVariable Long organizationId) {
        return organizationStaffService.requestToJoin(organizationId, SecurityUtils.getCurrentUserId());
    }

    /**
     * The body is optional, it lets the moderator pick the role while approving
     */
    @PatchMapping("/staff/{staffId}/approve")
    OrganizationStaffResponse approveRequest(@PathVariable Long organizationId,
                                             @PathVariable Long staffId,
                                             @RequestBody(required = false) UpdateStaffRoleRequest request) {
        return organizationStaffService.approveRequest(organizationId, staffId, request != null ? request.role() : null);
    }

    @PatchMapping("/staff/{staffId}/reject")
    OrganizationStaffResponse rejectRequest(@PathVariable Long organizationId, @PathVariable Long staffId) {
        return organizationStaffService.rejectRequest(organizationId, staffId);
    }

    @PatchMapping("/staff/{staffId}/role")
    OrganizationStaffResponse updateRole(@PathVariable Long organizationId,
                                         @PathVariable Long staffId,
                                         @Valid @RequestBody UpdateStaffRoleRequest request) {
        return organizationStaffService.updateRole(organizationId, staffId, request.role());
    }

    @DeleteMapping("/staff/{staffId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void removeStaff(@PathVariable Long organizationId, @PathVariable Long staffId) {
        organizationStaffService.removeStaff(organizationId, staffId, SecurityUtils.getCurrentUserId());
    }

}
