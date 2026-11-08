import { RequestStatus, StaffRole } from './enums';

/** organizerStaff/dto/OrganizationStaffResponse.java */
export interface OrganizationStaffResponse {
  id: number;
  organizationId: number;
  organizationName: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  status: RequestStatus;
  addedAt: string;
}

/** organizerStaff/dto/OrganizationStaffRequest.java (add an existing user by email) */
export interface OrganizationStaffRequest {
  email: string;
  role: StaffRole;
}

/** organizerStaff/dto/UpdateStaffRoleRequest.java */
export interface UpdateStaffRoleRequest {
  role: StaffRole;
}
