import { RequestStatus, StaffRole } from './enums';

/** organizer/dto/OrganizationResponse.java */
export interface OrganizationResponse {
  id: number;
  name: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  logo: string | null;
  email: string | null;
  address: string | null;
  verified: boolean;
  createdAt: string;
}

/** Shared by CreateOrganizationRequest and UpdateOrganizationRequest */
export interface OrganizationRequest {
  name: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  email: string | null;
  address: string | null;
  logo: string | null;
}

/** organizer/dto/MyOrganizationResponse.java (GET /api/organizations/me, 204 when none) */
export interface MyOrganizationResponse {
  organization: OrganizationResponse;
  staffId: number;
  role: StaffRole;
  status: RequestStatus;
}

/** organizer/dto/OrganizationStatsResponse.java */
export interface OrganizationStatsResponse {
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  revenue: number;
  staffCount: number;
  pendingRequests: number;
}

/** organizer/dto/VerifyOrganizationRequest.java */
export interface VerifyOrganizationRequest {
  verified: boolean;
}
