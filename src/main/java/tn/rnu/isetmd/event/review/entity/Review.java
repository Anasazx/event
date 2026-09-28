package tn.rnu.isetmd.event.review.entity;

import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "event_id"})}
)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    Event event;

    @Column(nullable = false)
    int rating;

    @Column(length = 2000)
    String comment;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

}