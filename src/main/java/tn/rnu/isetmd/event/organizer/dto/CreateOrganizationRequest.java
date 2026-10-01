package tn.rnu.isetmd.event.organizer.dto;

public record CreateOrganizationRequest(
        String name,
        String phone,
        String website,
        String description
) {}