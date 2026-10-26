package tn.rnu.isetmd.event.organizer.dto;

import java.math.BigDecimal;

public record OrganizationStatsResponse(
        long totalEvents,
        long activeEvents,
        long totalRegistrations,
        BigDecimal revenue,
        long staffCount,
        long pendingRequests
) {}
