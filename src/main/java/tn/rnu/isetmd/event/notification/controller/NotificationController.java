package tn.rnu.isetmd.event.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.notification.dto.NotificationResponse;
import tn.rnu.isetmd.event.notification.service.NotificationService;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    PageResponse<NotificationResponse> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return notificationService.getMyNotifications(SecurityUtils.getCurrentUserId(), page, size);
    }

    @GetMapping("/unread-count")
    Map<String, Long> getUnreadCount() {
        return Map.of("count", notificationService.getUnreadCount(SecurityUtils.getCurrentUserId()));
    }

    @PatchMapping("/{notificationId}/read")
    NotificationResponse markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(SecurityUtils.getCurrentUserId(), notificationId);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markAllAsRead() {
        notificationService.markAllAsRead(SecurityUtils.getCurrentUserId());
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteNotification(@PathVariable Long notificationId) {
        notificationService.deleteNotification(SecurityUtils.getCurrentUserId(), notificationId);
    }

}
