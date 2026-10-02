package tn.rnu.isetmd.event.review.mapper;

import org.springframework.stereotype.Component;
import tn.rnu.isetmd.event.review.dto.ReviewResponse;
import tn.rnu.isetmd.event.review.entity.Review;

@Component
public class ReviewMapper {

    public ReviewResponse toReviewResponse(Review review){
        return new ReviewResponse(
                review.getUser().getFirstName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }

}
