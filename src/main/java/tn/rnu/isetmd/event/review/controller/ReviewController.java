package tn.rnu.isetmd.event.review.controller;

import org.springframework.core.SpringVersion;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.rnu.isetmd.event.review.entity.Review;
import tn.rnu.isetmd.event.review.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping


public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(
                reviewService.getAllReviews()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                reviewService.getReviewById(id)
        );
    }
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<Review>> getReviewsByEvent(
            @PathVariable Long eventId
    ) {

        return ResponseEntity.ok(
                reviewService.getReviewsByEvent(eventId)
        );
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUser(
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                reviewService.getReviewsByUser(userId)
        );
    }
    @PostMapping
    public ResponseEntity<Review> createReview(
            @RequestParam Long userId,
            @RequestParam Long eventId,
            @RequestParam int rating,
            @RequestParam(required = false) String comment
    ) {

        Review review = reviewService.createReview(
                userId,
                eventId,
                rating,
                comment
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(review);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(
            @PathVariable Long id,
            @RequestParam int rating,
            @RequestParam(required = false) String comment
    ) {

        Review review = reviewService.updateReview(
                id,
                rating,
                comment
        );

        return ResponseEntity.ok(review);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long id
    ) {

        reviewService.deleteReview(id);

        return ResponseEntity.noContent().build();
    }

}
