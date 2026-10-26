package tn.rnu.isetmd.event.organizerStaff.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.enums.RequestStatus;
import tn.rnu.isetmd.event.enums.StaffRole;
import tn.rnu.isetmd.event.organizerStaff.entity.OrganizationStaff;

import java.util.List;
import java.util.Optional;

public interface OrganizationStaffRepository extends JpaRepository<OrganizationStaff, Long> {
    Optional<OrganizationStaff> findByUserId(Long userId);
    Optional<OrganizationStaff> findByUserIdAndStatus(Long userId, RequestStatus status);
    List<OrganizationStaff> findByOrganizationIdOrderByAddedAtAsc(Long organizationId);
    List<OrganizationStaff> findByOrganizationIdAndStatus(Long organizationId, RequestStatus status);
    long countByOrganizationIdAndRoleAndStatus(Long organizationId, StaffRole role, RequestStatus status);
}
