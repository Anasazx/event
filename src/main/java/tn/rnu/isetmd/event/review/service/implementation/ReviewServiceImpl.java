package tn.rnu.isetmd.event.review.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.mapper.EventMapper;
import tn.rnu.isetmd.event.review.dto.CreateReviewRequest;
import tn.rnu.isetmd.event.review.dto.ReviewResponse;
import tn.rnu.isetmd.event.review.dto.UpdateReviewRequest;
import tn.rnu.isetmd.event.review.entity.Review;
import tn.rnu.isetmd.event.review.mapper.ReviewMapper;
import tn.rnu.isetmd.event.review.repository.ReviewRepository;
import tn.rnu.isetmd.event.review.service.ReviewService;
import tn.rnu.isetmd.event.user.entity.User;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;


    @Override
    public List<ReviewResponse> getAllReviews(){
        return reviewRepository.findAll().stream()
                .map(reviewMapper::toReviewResponse)
                .toList();
    }

    @Override
    public ReviewResponse getReviewById(Long id){
        Review review = reviewRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Review not found with this id"));
        return reviewMapper.toReviewResponse(review);
    }

    @Override
    public List<ReviewResponse> getReviewsByEvent(Long eventId) {
        return reviewRepository.findByEventId(eventId).stream()
                .map(reviewMapper::toReviewResponse)
                .toList();
    }

    // Get reviews of a user
    @Override
    public List<ReviewResponse> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserId(userId).stream()
                .map(reviewMapper::toReviewResponse)
                .toList();
    }

    // Create review
    @Override
    public ReviewResponse createReview(Long currentUserId, CreateReviewRequest request) {

        int rating = request.rating();
        Long eventId = request.eventId();
        String comment = request.comment();

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // Check if user already reviewed this event
        if (reviewRepository.existsByUserIdAndEventId(currentUserId, eventId)) {
            throw new RuntimeException("User has already reviewed this event");
        }

        Review review = new Review();

        User user = new User();
        user.setId(currentUserId);

        Event event = new Event();
        event.setId(eventId);

        review.setUser(user);
        review.setEvent(event);
        review.setRating(rating);
        review.setComment(comment);

        return reviewMapper.toReviewResponse(reviewRepository.save(review));
    }

    // Update review
    @Override
    public ReviewResponse updateReview(Long currentUserId, Long reviewId, UpdateReviewRequest request) {

        int rating = request.rating();
        String comment = request.comment();

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Review review = reviewRepository.findById(reviewId).orElseThrow(
                ()-> new IllegalArgumentException("Rating must be between 1 and 5")
        );

        if (!Objects.equals(currentUserId, review.getUser().getId())){
            throw new RuntimeException();
        }

        review.setRating(rating);
        review.setComment(comment);

        return reviewMapper.toReviewResponse(reviewRepository.save(review));
    }

    // Delete review
    @Override
    public void deleteReview(Long currentUserId, Long reviewId) {

        Review review = reviewRepository.findById(reviewId).orElseThrow(
                () -> new RuntimeException("Review not found with this id")
        );

        if (!Objects.equals(currentUserId, review.getUser().getId())){
            throw new RuntimeException();
        }

        reviewRepository.deleteById(reviewId);
    }


}
