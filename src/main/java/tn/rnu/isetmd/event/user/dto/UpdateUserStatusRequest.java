package tn.rnu.isetmd.event.user.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull
        Boolean enabled
) {}
