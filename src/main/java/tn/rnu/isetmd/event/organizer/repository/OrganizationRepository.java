package tn.rnu.isetmd.event.organizer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.organizer.entity.Organization;

import java.util.List;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    boolean existsByNameIgnoreCase(String name);

    @Query("""
            select o from Organization o
            where lower(o.name) like lower(concat('%', :search, '%'))
              and (:verified is null or o.verified = :verified)
            order by o.name
            """)
    List<Organization> search(@Param("search") String search, @Param("verified") Boolean verified);
}
