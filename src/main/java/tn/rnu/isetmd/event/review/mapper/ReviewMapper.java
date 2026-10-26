package tn.rnu.isetmd.event.review.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.review.dto.ReviewResponse;
import tn.rnu.isetmd.event.review.entity.Review;

@Component
public class ReviewMapper {

    public ReviewResponse toReviewResponse(Review review){
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFirstName() + " " + review.getUser().getLastName().charAt(0) + ".",
                review.getUser().getProfileImage(),
                review.getEvent().getId(),
                review.getEvent().getTitle(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }

}
