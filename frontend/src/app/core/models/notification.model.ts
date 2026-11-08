import { NotificationType } from './enums';

/** notification/dto/NotificationResponse.java */
export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  eventId: number | null;
  eventTitle: string | null;
  createdAt: string;
}
