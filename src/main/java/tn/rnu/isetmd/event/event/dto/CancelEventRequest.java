package tn.rnu.isetmd.event.event.dto;

import jakarta.validation.constraints.Size;

public record CancelEventRequest(
        @Size(max = 500)
        String reason
) {}
