package tn.rnu.isetmd.event.organizerStaff.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.organizer.entity.Organization;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.List;
import java.util.Optional;

public interface OrganizationStaffRepository extends JpaRepository<OrganizationStaff, Long> {
    Optional<OrganizationStaff> findByUserId(Long userId);
    Long user(User user);
}
