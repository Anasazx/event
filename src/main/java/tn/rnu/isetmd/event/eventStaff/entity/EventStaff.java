package tn.rnu.isetmd.event.eventStaff.entity;

import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "event_staff",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"event_id", "user_id"})}
)
public class EventStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    Event event;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    StaffRole role;

    @Column(nullable = false)
    LocalDateTime addedAt;

}
