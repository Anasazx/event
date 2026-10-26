package tn.rnu.isetmd.event.notification.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.notification.dto.NotificationResponse;
import tn.rnu.isetmd.event.notification.entity.Notification;

@Component
public class NotificationMapper {

    public NotificationResponse toNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getEvent() != null ? notification.getEvent().getId() : null,
                notification.getEvent() != null ? notification.getEvent().getTitle() : null,
                notification.getCreatedAt()
        );
    }

}
