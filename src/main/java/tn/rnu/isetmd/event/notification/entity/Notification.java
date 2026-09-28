package tn.rnu.isetmd.event.notification.entity;

import tn.rnu.isetmd.event.enums.NotificationType;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne
    @JoinColumn(name = "event_id")
    Event event;

    @Column(nullable = false)
    String title;

    @Column(nullable = false, length = 2000)
    String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    NotificationType type;

    @Column(nullable = false)
    boolean read = false;

    @CreationTimestamp
    LocalDateTime createdAt;

}