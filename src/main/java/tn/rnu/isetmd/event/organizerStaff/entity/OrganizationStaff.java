package tn.rnu.isetmd.event.organizerStaff.entity;

import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.organizerProfile.entity.OrganizationProfile;
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
        name = "Organization_staff",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"Organization_profile_id", "user_id"})}
)
public class OrganizationStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "Organization_profile_id", nullable = false)
    OrganizationProfile Organization;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    StaffRole role;

    @Column(nullable = false)
    LocalDateTime addedAt;

}
