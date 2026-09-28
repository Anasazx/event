package tn.rnu.isetmd.event.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.rnu.isetmd.event.review.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
}
