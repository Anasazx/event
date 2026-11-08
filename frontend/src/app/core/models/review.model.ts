/** review/dto/ReviewResponse.java */
export interface ReviewResponse {
  id: number;
  userId: number;
  username: string;
  userProfileImage: string | null;
  eventId: number;
  eventTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

/** review/dto/CreateReviewRequest.java */
export interface CreateReviewRequest {
  eventId: number;
  rating: number;
  comment: string | null;
}

/** review/dto/UpdateReviewRequest.java */
export interface UpdateReviewRequest {
  rating: number;
  comment: string | null;
}
