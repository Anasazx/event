package tn.rnu.isetmd.event.notification.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.dto.PageResponse;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.notification.dto.NotificationResponse;
import tn.rnu.isetmd.event.notification.entity.Notification;
import tn.rnu.isetmd.event.notification.mapper.NotificationMapper;
import tn.rnu.isetmd.event.notification.repository.NotificationRepository;
import tn.rnu.isetmd.event.notification.service.NotificationService;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.Collection;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    @Override
    public void notify(User user, Event event, NotificationType type, String title, String message) {
        notificationRepository.save(build(user, event, type, title, message));
    }

    @Override
    public void notifyAll(Collection<User> users, Event event, NotificationType type, String title, String message) {
        notificationRepository.saveAll(
                users.stream().map(user -> build(user, event, type, title, message)).toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(Long userId, int page, int size) {
        return PageResponse.from(
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, Math.min(size, 50))),
                notificationMapper::toNotificationResponse
        );
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = getOwnedNotification(userId, notificationId);
        notification.setRead(true);
        return notificationMapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    public void deleteNotification(Long userId, Long notificationId) {
        notificationRepository.delete(getOwnedNotification(userId, notificationId));
    }

    private Notification getOwnedNotification(Long userId, Long notificationId) {
        // Someone else's notification is reported as missing rather than forbidden
        return notificationRepository.findById(notificationId)
                .filter(notification -> Objects.equals(notification.getUser().getId(), userId))
                .orElseThrow(() -> new NotFoundException("Notification not found"));
    }

    private Notification build(User user, Event event, NotificationType type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setEvent(event);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        return notification;
    }
}
