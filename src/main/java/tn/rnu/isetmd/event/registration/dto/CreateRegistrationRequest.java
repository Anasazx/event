package tn.rnu.isetmd.event.registration.dto;

import jakarta.validation.constraints.NotNull;

public record CreateRegistrationRequest(
        @NotNull
        Long ticketTypeId
) {}
