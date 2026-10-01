package tn.rnu.isetmd.event.organizer.dto;

public record UpdateOrganizationRequest(
        String name,
        String phone,
        String website,
        String description
) {}
