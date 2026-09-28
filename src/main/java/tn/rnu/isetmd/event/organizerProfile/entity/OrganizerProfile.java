package tn.rnu.isetmd.event.organizerProfile.entity;

import tn.rnu.isetmd.event.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "organizer_profiles")
public class OrganizerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    User user;

    @Column(nullable = false)
    String name;

    @Column(length = 2000)
    String description;

    String logo;

    String website;

    String phone;

    boolean verified = false;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

}