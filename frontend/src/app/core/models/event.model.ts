import { EventStatus } from './enums';

/** event/dto/EventResponse.java */
export interface EventResponse {
  id: number;
  title: string;
  description: string | null;
  coverImage: string | null;
  categoryId: number;
  categoryName: string;
  venueId: number;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  registeredCount: number;
  availableSeats: number;
  status: EventStatus;
  organizerId: number;
  organizerName: string;
  organizerLogo: string | null;
  organizerVerified: boolean;
  minPrice: number | null;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** event/dto/CreateEventRequest.java (UpdateEventRequest has the same shape) */
export interface EventRequest {
  title: string;
  description: string | null;
  coverImage: string | null;
  categoryId: number;
  venueId: number;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
}

/** event/dto/CancelEventRequest.java */
export interface CancelEventRequest {
  reason?: string | null;
}

/** event/dto/EventStatsResponse.java */
export interface EventStatsResponse {
  eventId: number;
  capacity: number;
  registeredCount: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  cancelled: number;
  revenue: number;
  averageRating: number;
  reviewCount: number;
  ticketSales: TicketSales[];
}

export interface TicketSales {
  ticketTypeId: number;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

/** Sort values accepted by GET /api/events (EventController.searchEvents) */
export type EventSort = 'date' | 'popular' | 'rating' | 'newest';

/** Query parameters of GET /api/events */
export interface EventSearchParams {
  keyword?: string;
  categoryId?: number;
  city?: string;
  organizationId?: number;
  from?: string;
  to?: string;
  freeOnly?: boolean;
  includePast?: boolean;
  sort?: EventSort;
  page?: number;
  size?: number;
}
