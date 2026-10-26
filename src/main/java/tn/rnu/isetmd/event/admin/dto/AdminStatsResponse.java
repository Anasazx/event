package tn.rnu.isetmd.event.admin.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminStatsResponse(
        long totalUsers,
        long totalOrganizers,
        long totalOrganizations,
        long totalEvents,
        Map<String, Long> eventsByStatus,
        long totalRegistrations,
        long checkedIn,
        BigDecimal revenue,
        long totalReviews,
        List<TopEvent> topEvents
) {
    public record TopEvent(Long id, String title, String organizerName, int registeredCount, int capacity) {}
}
