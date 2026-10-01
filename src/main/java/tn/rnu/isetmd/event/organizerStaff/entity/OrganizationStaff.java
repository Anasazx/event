package tn.rnu.isetmd.event.organizerStaff.entity;

import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.organizer.entity.Organization;
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
        name = "organization_staff",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"organization_id", "user_id"})}
)
public class OrganizationStaff {

    public OrganizationStaff(
            Organization organization,
            User user,
            StaffRole staffRole
    ) {
        this.organization = organization;
        this.user = user;
        this.role = staffRole;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    Organization organization;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    StaffRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    RequestStatus status = RequestStatus.PENDING;

    @Column(nullable = false)
    LocalDateTime addedAt = LocalDateTime.now();



}
