import { UserResponse } from './user.model';

/** auth/dto/LoginRequest.java */
export interface LoginRequest {
  email: string;
  password: string;
}

/** auth/dto/RegisterRequest.java */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** auth/dto/AuthResponse.java. expiresIn is in milliseconds (JWT lifetime). */
export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: UserResponse;
}
