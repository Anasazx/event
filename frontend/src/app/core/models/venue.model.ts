/** venue/dto/VenueResponse.java */
export interface VenueResponse {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  description: string | null;
}

/** venue/dto/VenueRequest.java */
export interface VenueRequest {
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  description: string | null;
}
