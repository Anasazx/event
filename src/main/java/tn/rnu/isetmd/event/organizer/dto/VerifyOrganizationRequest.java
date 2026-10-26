package tn.rnu.isetmd.event.organizer.dto;

import jakarta.validation.constraints.NotNull;

public record VerifyOrganizationRequest(
        @NotNull
        Boolean verified
) {}
