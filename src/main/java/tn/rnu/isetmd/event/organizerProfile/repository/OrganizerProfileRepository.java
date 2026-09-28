package tn.rnu.isetmd.event.organizerProfile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.organizerProfile.entity.OrganizerProfile;

public interface OrganizerProfileRepository extends JpaRepository<OrganizerProfile, Long> {
}
