package tn.rnu.isetmd.event.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.review.entity.Review;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findById(Long id);

    // Get all reviews of an event
    List<Review> findByEventId(Long eventId);

    // Get all reviews made by a user
    List<Review> findByUserId(Long userId);

    // Check if a user already reviewed an event
    boolean existsByUserIdAndEventId(Long userId, Long eventId);

}