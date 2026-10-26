package tn.rnu.isetmd.event.registration.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.registration.entity.Registration;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByUserIdAndEventId(Long userId, Long eventId);

    Optional<Registration> findByQrCode(String qrCode);

    List<Registration> findByUserIdOrderByRegisteredAtDesc(Long userId);

    List<Registration> findByEventIdOrderByRegisteredAtDesc(Long eventId);

    List<Registration> findByEventIdAndStatusIn(Long eventId, Collection<RegistrationStatus> statuses);

    boolean existsByEventIdAndStatusIn(Long eventId, Collection<RegistrationStatus> statuses);

    boolean existsByTicketTypeId(Long ticketTypeId);

    boolean existsByUserIdAndEventIdAndStatusIn(Long userId, Long eventId, Collection<RegistrationStatus> statuses);

    long countByStatus(RegistrationStatus status);

    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);

    @Query("""
            select coalesce(sum(r.ticketType.price), 0) from Registration r
            where r.status in :statuses
            """)
    BigDecimal sumRevenue(@Param("statuses") Collection<RegistrationStatus> statuses);

    @Query("""
            select coalesce(sum(r.ticketType.price), 0) from Registration r
            where r.event.id = :eventId and r.status in :statuses
            """)
    BigDecimal sumRevenueByEvent(@Param("eventId") Long eventId, @Param("statuses") Collection<RegistrationStatus> statuses);

    @Query("""
            select count(r) from Registration r
            where r.event.organizer.id = :organizationId and r.status in :statuses
            """)
    long countByOrganization(@Param("organizationId") Long organizationId, @Param("statuses") Collection<RegistrationStatus> statuses);

    @Query("""
            select coalesce(sum(r.ticketType.price), 0) from Registration r
            where r.event.organizer.id = :organizationId and r.status in :statuses
            """)
    BigDecimal sumRevenueByOrganization(@Param("organizationId") Long organizationId, @Param("statuses") Collection<RegistrationStatus> statuses);

    @Modifying
    @Query("delete from Registration r where r.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}
