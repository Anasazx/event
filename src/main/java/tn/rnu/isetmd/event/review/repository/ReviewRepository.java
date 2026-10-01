package tn.rnu.isetmd.event.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.review.entity.Review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.lang.ScopedValue;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Get all reviews of an event
    List<Review> findByEventId(Long eventId);

    // Get all reviews made by a user
    List<Review> findByUserId(Long userId);

    // Find a specific review by user + event
    Optional<Review> findByUserIdAndEventId(Long userId, Long eventId);

    // Check if a user already reviewed an event
    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    <T> ScopedValue<T> findBytId(Long id);
}