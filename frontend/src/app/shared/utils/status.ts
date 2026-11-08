import { BadgeTone } from '../ui/badge.component';
import { EventStatus, NotificationType, RegistrationStatus, RequestStatus, StaffRole, UserRole } from '../../core/models';

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function eventStatusTone(status: EventStatus): BadgeTone {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'ONGOING':
      return 'primary';
    case 'DRAFT':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  PENDING: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  CANCELLED: 'Cancelled',
};

export function registrationStatusTone(status: RegistrationStatus): BadgeTone {
  switch (status) {
    case 'CONFIRMED':
      return 'success';
    case 'CHECKED_IN':
      return 'primary';
    case 'PENDING':
      return 'warning';
    default:
      return 'neutral';
  }
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  MODERATOR: 'Moderator',
  ORGANIZER: 'Organizer',
  CHECK_IN: 'Check-in staff',
  VOLUNTEER: 'Volunteer',
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  REJECTED: 'Declined',
};

export function requestStatusTone(status: RequestStatus): BadgeTone {
  return status === 'APPROVED' ? 'success' : status === 'PENDING' ? 'warning' : 'danger';
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  USER: 'Attendee',
  ORGANIZER: 'Organizer',
  ADMIN: 'Administrator',
};

export function userRoleTone(role: UserRole): BadgeTone {
  return role === 'ADMIN' ? 'danger' : role === 'ORGANIZER' ? 'primary' : 'neutral';
}

export const NOTIFICATION_ICON: Record<NotificationType, 'ticket' | 'calendar' | 'alert' | 'clock' | 'check-circle' | 'bell' | 'x-circle'> = {
  REGISTRATION: 'ticket',
  EVENT_UPDATE: 'calendar',
  EVENT_CANCELLED: 'x-circle',
  EVENT_REMINDER: 'clock',
  CHECK_IN: 'check-circle',
  SYSTEM: 'bell',
};

/** Sorting helpers for dates coming from the API (ISO local date-times). */
export function timestamp(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}
