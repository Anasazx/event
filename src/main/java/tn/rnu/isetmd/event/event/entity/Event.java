package tn.rnu.isetmd.event.event.entity;


import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.ticketType.entity.TicketType;
import tn.rnu.isetmd.event.venue.entity.Venue;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@DynamicUpdate
@Table(
        name = "events",
        indexes = {
                @Index(name = "idx_events_status_start", columnList = "status, startDateTime"),
                @Index(name = "idx_events_organizer", columnList = "organizer_id")
        }
)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String title;

    @Column(length = 5000)
    String description;

    String coverImage;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    Category category;

    @ManyToOne
    @JoinColumn(name = "venue_id", nullable = false)
    Venue venue;

    @Column(nullable = false)
    LocalDateTime startDateTime;

    @Column(nullable = false)
    LocalDateTime endDateTime;

    @Column(nullable = false)
    int capacity;

    /**
     * Number of active (non cancelled) registrations.
     * Kept in sync under a pessimistic lock so capacity can't be oversold.
     */
    @Column(nullable = false)
    int registeredCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    EventStatus status;

    @ManyToOne
    @JoinColumn(name = "organizer_id", nullable = false)
    Organization organizer;

    /**
     * Denormalized review aggregates, refreshed whenever a review changes
     */
    @Column(nullable = false)
    double averageRating = 0;

    @Column(nullable = false)
    int reviewCount = 0;

    @Column(nullable = false)
    boolean reminderSent = false;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "event", cascade = CascadeType.REMOVE)
    List<TicketType> ticketTypes = new ArrayList<>();

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

    public int getAvailableSeats() {
        return Math.max(capacity - registeredCount, 0);
    }

}
