/** category/dto/CategoryResponse.java */
export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
}

/** category/dto/CategoryRequest.java */
export interface CategoryRequest {
  name: string;
  description: string | null;
  image: string | null;
}
