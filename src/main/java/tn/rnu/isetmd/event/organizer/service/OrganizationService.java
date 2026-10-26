package tn.rnu.isetmd.event.organizer.service;

import tn.rnu.isetmd.event.organizer.dto.CreateOrganizationRequest;
import tn.rnu.isetmd.event.organizer.dto.MyOrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.OrganizationResponse;
import tn.rnu.isetmd.event.organizer.dto.OrganizationStatsResponse;
import tn.rnu.isetmd.event.organizer.dto.UpdateOrganizationRequest;

import java.util.List;
import java.util.Optional;

public interface OrganizationService {
    OrganizationResponse createOrganization(CreateOrganizationRequest request, Long userId);
    OrganizationResponse getOrganizationById(Long organizationId);
    OrganizationResponse getOrganizationByUserId(Long userId);
    Optional<MyOrganizationResponse> getMyOrganization(Long userId);
    OrganizationStatsResponse getMyOrganizationStats(Long userId);
    List<OrganizationResponse> getAllOrganization(String search, Boolean verified);
    OrganizationResponse updateOrganizationById(Long organizationId, UpdateOrganizationRequest request);
    OrganizationResponse verifyOrganization(Long organizationId, boolean verified);
    void deleteOrganizationById(Long id);
}
