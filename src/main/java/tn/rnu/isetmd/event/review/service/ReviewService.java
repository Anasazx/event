package tn.rnu.isetmd.event.review.service;

import org.springframework.stereotype.Service;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.review.entity.Review;
import tn.rnu.isetmd.event.review.repository.ReviewRepository;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    public ReviewService(ReviewRepository reviewRepository){
        this.reviewRepository = reviewRepository;
    }
    public List<Review> getAllReviews(){
        return reviewRepository.findAll();
    }
    public Review getReviewById(Long id){
        return reviewRepository.findBytId(id)
                .orElseThrow(()-> new RuntimeException("Review not found with id: "+ id));

    }
    public List<Review> getReviewsByEvent(Long eventId) {
        return reviewRepository.findByEventId(eventId);
    }

    // Get reviews of a user
    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserId(userId);
    }

    // Create review
    public Review createReview(
            Long userId,
            Long eventId,
            int rating,
            String comment
    ) {

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5"
            );
        }

        // Check if user already reviewed this event
        if (reviewRepository.existsByUserIdAndEventId(userId, eventId)) {
            throw new RuntimeException(
                    "User has already reviewed this event"
            );
        }

        Review review = new Review();

        User user = new User();
        user.setId(userId);

        Event event = new Event();
        event.setId(eventId);

        review.setUser(user);
        review.setEvent(event);
        review.setRating(rating);
        review.setComment(comment);

        return reviewRepository.save(review);
    }

    // Update review
    public Review updateReview(
            Long id,
            int rating,
            String comment
    ) {

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException(
                    "Rating must be between 1 and 5"
            );
        }

        Review review = getReviewById(id);

        review.setRating(rating);
        review.setComment(comment);

        return reviewRepository.save(review);
    }

    // Delete review
    public void deleteReview(Long id) {

        if (!reviewRepository.existsById(id)) {
            throw new RuntimeException(
                    "Review not found with id: " + id
            );
        }

        reviewRepository.deleteById(id);
    }


}
