import { EventStatus, RegistrationStatus } from './enums';

/** registration/dto/RegistrationResponse.java. qrCode is only filled for the registration owner. */
export interface RegistrationResponse {
  id: number;
  status: RegistrationStatus;
  qrCode: string | null;
  registeredAt: string;
  checkedInAt: string | null;
  cancelledAt: string | null;
  ticketTypeId: number;
  ticketTypeName: string;
  price: number;
  eventId: number;
  eventTitle: string;
  eventCoverImage: string | null;
  eventStartDateTime: string;
  eventEndDateTime: string;
  eventStatus: EventStatus;
  venueName: string;
  venueCity: string;
  userId: number;
  userFullName: string;
  userEmail: string;
}

/** registration/dto/CreateRegistrationRequest.java */
export interface CreateRegistrationRequest {
  ticketTypeId: number;
}

/** registration/dto/CheckInRequest.java */
export interface CheckInRequest {
  eventId: number;
  qrCode: string;
  confirmPayment?: boolean;
}
