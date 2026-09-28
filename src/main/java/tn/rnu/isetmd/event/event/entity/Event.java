package tn.rnu.isetmd.event.event.entity;


import tn.rnu.isetmd.event.category.entity.Category;
import tn.rnu.isetmd.event.enums.EventStatus;
import tn.rnu.isetmd.event.organizerProfile.entity.OrganizationProfile;
import tn.rnu.isetmd.event.venue.entity.Venue;
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
@Table(name = "events")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    EventStatus status;

    @ManyToOne
    @JoinColumn(name = "organizer_id", nullable = false)
    OrganizationProfile organizer;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

}