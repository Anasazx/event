package tn.rnu.isetmd.event.organizer.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.user.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "organization")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;

    @Column(length = 2000)
    String description;

    String logo;

    String website;

    String phone;

    boolean verified = false;

    @OneToMany(mappedBy = "organization")
    List<OrganizationStaff> staff;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

}