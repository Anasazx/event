import { UserRole } from './enums';

/** user/dto/UserResponse.java */
export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profileImage: string | null;
  enabled: boolean;
  createdAt: string;
}

/** user/dto/UpdateProfileRequest.java (PUT replaces all three fields) */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

/** user/dto/ChangePasswordRequest.java */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** user/dto/UpdateUserRoleRequest.java and UpdateUserStatusRequest.java */
export interface UpdateUserRoleRequest {
  role: UserRole;
}
export interface UpdateUserStatusRequest {
  enabled: boolean;
}
