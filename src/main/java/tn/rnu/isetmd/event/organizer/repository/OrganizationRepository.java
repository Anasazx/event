package tn.rnu.isetmd.event.organizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.organizer.entity.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
}
