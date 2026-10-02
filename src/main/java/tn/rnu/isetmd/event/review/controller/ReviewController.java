package tn.rnu.isetmd.event.review.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.review.dto.CreateReviewRequest;
import tn.rnu.isetmd.event.review.dto.ReviewResponse;
import tn.rnu.isetmd.event.review.dto.UpdateReviewRequest;
import tn.rnu.isetmd.event.review.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    //This method is unnecessary
    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    //This method is unnecessary
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewById(id));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(reviewService.getReviewsByEvent(eventId));
    }

    @GetMapping("/user")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(reviewService.getReviewsByUser(currentUserId));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(CreateReviewRequest request) {

        Long currentUserId = SecurityUtils.getCurrentUserId();
        ReviewResponse review = reviewService.createReview(currentUserId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(review);
    }
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(@PathVariable Long reviewId, UpdateReviewRequest request) {

        Long currentUserId = SecurityUtils.getCurrentUserId();
        ReviewResponse review = reviewService.updateReview(currentUserId, reviewId, request);

        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        reviewService.deleteReview(currentUserId, reviewId);
        return ResponseEntity.noContent().build();
    }

}
