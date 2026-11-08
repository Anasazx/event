/** Enums mirrored from tn.rnu.isetmd.event.enums (serialized as their names). */
export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN';
export type StaffRole = 'MODERATOR' | 'ORGANIZER' | 'CHECK_IN' | 'VOLUNTEER';
export type RequestStatus = 'APPROVED' | 'REJECTED' | 'PENDING';
export type NotificationType =
  | 'REGISTRATION'
  | 'EVENT_UPDATE'
  | 'EVENT_CANCELLED'
  | 'EVENT_REMINDER'
  | 'CHECK_IN'
  | 'SYSTEM';

export const USER_ROLES: UserRole[] = ['USER', 'ORGANIZER', 'ADMIN'];
export const STAFF_ROLES: StaffRole[] = ['MODERATOR', 'ORGANIZER', 'CHECK_IN', 'VOLUNTEER'];
