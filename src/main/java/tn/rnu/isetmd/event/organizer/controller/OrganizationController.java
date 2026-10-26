package tn.rnu.isetmd.event.organizer.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.MyOrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.OrganizationStatsResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.VerifyOrganizationRequest;
import tn.rnu.isetmd.event.organizer.service.OrganizationService;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping
    List<OrganizationResponse> getAllOrganization(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean verified
    ) {
        return organizationService.getAllOrganization(search, verified);
    }

    /**
     * 204 when the current user has no organization (nor a pending request)
     */
    @GetMapping("/me")
    ResponseEntity<MyOrganizationResponse> getMyOrganization() {
        return organizationService.getMyOrganization(SecurityUtils.getCurrentUserId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/me/stats")
    OrganizationStatsResponse getMyOrganizationStats() {
        return organizationService.getMyOrganizationStats(SecurityUtils.getCurrentUserId());
    }

    @GetMapping("/{organizationId}")
    OrganizationResponse getOrganization(@PathVariable Long organizationId) {
        return organizationService.getOrganizationById(organizationId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    OrganizationResponse createOrganization(@Valid @RequestBody CreateOrganizationRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return organizationService.createOrganization(request, currentUserId);
    }

    @PutMapping("/{organizationId}")
    OrganizationResponse updateOrganization(@PathVariable Long organizationId,
                                            @Valid @RequestBody UpdateOrganizationRequest request) {
        return organizationService.updateOrganizationById(organizationId, request);
    }

    @PatchMapping("/{organizationId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    OrganizationResponse verifyOrganization(@PathVariable Long organizationId,
                                            @Valid @RequestBody VerifyOrganizationRequest request) {
        return organizationService.verifyOrganization(organizationId, request.verified());
    }

    @DeleteMapping("/{organizationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteOrganizationById(@PathVariable Long organizationId){
        organizationService.deleteOrganizationById(organizationId);
    }

}
