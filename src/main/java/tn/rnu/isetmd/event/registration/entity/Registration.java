package tn.rnu.isetmd.event.registration.entity;

import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;
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
        name = "registrations",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "event_id"})}
)
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
     Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    Event event;

    @ManyToOne
    @JoinColumn(name = "ticket_type_id", nullable = false)
    TicketType ticketType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    RegistrationStatus status;

    @Column(nullable = false, unique = true)
    String qrCode;

    @Column(nullable = false)
    LocalDateTime registeredAt;

    LocalDateTime checkedInAt;

    LocalDateTime cancelledAt;

}