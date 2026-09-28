package tn.rnu.isetmd.event.registration.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.registration.entity.Registration;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
}
