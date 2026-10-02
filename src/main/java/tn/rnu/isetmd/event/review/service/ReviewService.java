package tn.rnu.isetmd.event.review.service;

import tn.rnu.isetmd.event.review.dto.CreateReviewRequest;
import tn.rnu.isetmd.event.review.dto.ReviewResponse;
import tn.rnu.isetmd.event.review.dto.UpdateReviewRequest;

import java.util.List;

public interface ReviewService {

    List<ReviewResponse> getAllReviews();
    ReviewResponse getReviewById(Long id);
    List<ReviewResponse> getReviewsByEvent(Long eventId);
    List<ReviewResponse> getReviewsByUser(Long userId);
    ReviewResponse createReview(Long currentUserId, CreateReviewRequest request);
    ReviewResponse updateReview(Long currentUserId, Long reviewId, UpdateReviewRequest request);
    void deleteReview(Long currentUserId, Long reviewId);

}
