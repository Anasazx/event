package tn.rnu.isetmd.event.notification.service;

import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.notification.dto.NotificationResponse;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.Collection;

public interface NotificationService {
    void notify(User user, Event event, NotificationType type, String title, String message);
    void notifyAll(Collection<User> users, Event event, NotificationType type, String title, String message);
    PageResponse<NotificationResponse> getMyNotifications(Long userId, int page, int size);
    long getUnreadCount(Long userId);
    NotificationResponse markAsRead(Long userId, Long notificationId);
    void markAllAsRead(Long userId);
    void deleteNotification(Long userId, Long notificationId);
}
