package tn.rnu.isetmd.event.organizer.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.service.OrganizationService;
import tn.rnu.isetmd.event.config.JwtService;


import java.util.List;

@RestController
@RequestMapping("/org")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final JwtService jwtService;

    //TODO: We should add created by here, it should be extracted from the token so we need a global method for that

    @GetMapping("/{organizationId}")
    OrganizationResponse getOrganization(@PathVariable Long organizationId) {
        return organizationService.getOrganizationById(organizationId);
    }

    @GetMapping
    List<OrganizationResponse> getAllOrganization(){
        return organizationService.getAllOrganization();
    }

    @PostMapping
    OrganizationResponse CreateOrganization(@RequestBody CreateOrganizationRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return organizationService.createOrganization(request, currentUserId);
    }

    @PutMapping("/{organizationId}")
    OrganizationResponse updateOrganization(@PathVariable Long organizationId, @RequestBody UpdateOrganizationRequest request) {
        return organizationService.updateOrganizationById(organizationId, request);
    }

    @DeleteMapping("/{organizationId}")
    void deleteOrganizationById(@PathVariable Long organizationId){
        organizationService.deleteOrganizationById(organizationId);
    }

}
