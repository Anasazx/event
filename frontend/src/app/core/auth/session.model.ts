import { UserResponse } from '../models';

/** What is persisted in localStorage after a successful login. */
export interface StoredSession {
  token: string;
  /** epoch milliseconds when the token stops being accepted by the backend */
  expiresAt: number;
  user: UserResponse;
}
