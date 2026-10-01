package tn.rnu.isetmd.event.organizer.service;

import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;

import java.util.List;

public interface OrganizationService {
    OrganizationResponse createOrganization(CreateOrganizationRequest request, Long userId);
    OrganizationResponse getOrganizationById(Long organizationId);
    OrganizationResponse getOrganizationByUserId(Long userId);
    List<OrganizationResponse> getAllOrganization();
    OrganizationResponse updateOrganizationById(Long organizationId, UpdateOrganizationRequest request);
    void deleteOrganizationById(Long id);
}
