package tn.rnu.isetmd.event.user.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.enums.UserRole;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByRole(UserRole role);

    @Query("""
            select u from User u
            where (lower(u.email) like lower(concat('%', :search, '%'))
                   or lower(u.firstName) like lower(concat('%', :search, '%'))
                   or lower(u.lastName) like lower(concat('%', :search, '%')))
              and (:role is null or u.role = :role)
            """)
    Page<User> search(@Param("search") String search, @Param("role") UserRole role, Pageable pageable);
}
