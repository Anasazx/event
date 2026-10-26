package tn.rnu.isetmd.event.notification.dto;

import tn.rnu.isetmd.event.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        boolean read,
        Long eventId,
        String eventTitle,
        LocalDateTime createdAt
) {}
