package tn.rnu.isetmd.event.organizerProfile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.organizerProfile.entity.OrganizationProfile;

public interface OrganizationProfileRepository extends JpaRepository<OrganizationProfile, Long> {
}
