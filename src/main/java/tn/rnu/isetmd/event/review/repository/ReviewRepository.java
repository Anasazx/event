package tn.rnu.isetmd.event.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.rnu.isetmd.event.review.entity.Review;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Get all reviews of an event
    List<Review> findByEventIdOrderByCreatedAtDesc(Long eventId);

    // Get all reviews made by a user
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Check if a user already reviewed an event
    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.event.id = :eventId")
    double averageRatingByEventId(@Param("eventId") Long eventId);

    long countByEventId(Long eventId);

    @Modifying
    @Query("delete from Review r where r.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}
