package tn.rnu.isetmd.event.review.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.common.exception.ConflictException;
import tn.rnu.isetmd.event.common.exception.ForbiddenException;
import tn.rnu.isetmd.event.common.exception.NotFoundException;
import tn.rnu.isetmd.event.config.SecurityUtils;
import tn.rnu.isetmd.event.enums.RegistrationStatus;
import tn.rnu.isetmd.event.event.entity.Event;
import tn.rnu.isetmd.event.event.service.EventService;
import tn.rnu.isetmd.event.registration.repository.RegistrationRepository;
import tn.rnu.isetmd.event.review.dto.CreateReviewRequest;
import tn.rnu.isetmd.event.review.dto.ReviewResponse;
import tn.rnu.isetmd.event.review.dto.UpdateReviewRequest;
import tn.rnu.isetmd.event.review.entity.Review;
import tn.rnu.isetmd.event.review.mapper.ReviewMapper;
import tn.rnu.isetmd.event.review.repository.ReviewRepository;
import tn.rnu.isetmd.event.review.service.ReviewService;
import tn.rnu.isetmd.event.user.service.UserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;
    private final EventService eventService;
    private final UserService userService;
    private final RegistrationRepository registrationRepository;

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(Long id){
        return reviewMapper.toReviewResponse(findReview(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByEvent(Long eventId) {
        return reviewRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream()
                .map(reviewMapper::toReviewResponse)
                .toList();
    }

    // Get reviews of a user
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(reviewMapper::toReviewResponse)
                .toList();
    }

    // Create review: only attendees can review, once the event has started
    @Override
    public ReviewResponse createReview(Long currentUserId, CreateReviewRequest request) {

        Event event = eventService.getEventEntity(request.eventId());

        if (event.getStartDateTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("You can review an event once it has started");
        }

        boolean attended = registrationRepository.existsByUserIdAndEventIdAndStatusIn(
                currentUserId, event.getId(), List.of(RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN));
        if (!attended) {
            throw new ForbiddenException("Only attendees can review this event");
        }

        // Check if user already reviewed this event
        if (reviewRepository.existsByUserIdAndEventId(currentUserId, event.getId())) {
            throw new ConflictException("You have already reviewed this event");
        }

        Review review = new Review();
        review.setUser(userService.getUserEntity(currentUserId));
        review.setEvent(event);
        review.setRating(request.rating());
        review.setComment(request.comment());

        Review saved = reviewRepository.saveAndFlush(review);
        eventService.refreshRating(event.getId());
        return reviewMapper.toReviewResponse(saved);
    }

    // Update review
    @Override
    public ReviewResponse updateReview(Long currentUserId, Long reviewId, UpdateReviewRequest request) {

        Review review = findReview(reviewId);

        if (!Objects.equals(currentUserId, review.getUser().getId())){
            throw new ForbiddenException("You can only edit your own reviews");
        }

        review.setRating(request.rating());
        review.setComment(request.comment());

        Review saved = reviewRepository.saveAndFlush(review);
        eventService.refreshRating(review.getEvent().getId());
        return reviewMapper.toReviewResponse(saved);
    }

    // Delete review: the author or an admin (moderation)
    @Override
    public void deleteReview(Long currentUserId, Long reviewId) {

        Review review = findReview(reviewId);

        if (!Objects.equals(currentUserId, review.getUser().getId()) && !SecurityUtils.isAdmin()){
            throw new ForbiddenException("You can only delete your own reviews");
        }

        Long eventId = review.getEvent().getId();
        reviewRepository.delete(review);
        reviewRepository.flush();
        eventService.refreshRating(eventId);
    }

    private Review findReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(()-> new NotFoundException("Review not found"));
    }

}
