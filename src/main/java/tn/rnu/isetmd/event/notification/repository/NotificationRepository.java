package tn.rnu.isetmd.event.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.notification.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
