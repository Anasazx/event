/** admin/dto/AdminStatsResponse.java */
export interface AdminStatsResponse {
  totalUsers: number;
  totalOrganizers: number;
  totalOrganizations: number;
  totalEvents: number;
  eventsByStatus: Record<string, number>;
  totalRegistrations: number;
  checkedIn: number;
  revenue: number;
  totalReviews: number;
  topEvents: TopEvent[];
}

export interface TopEvent {
  id: number;
  title: string;
  organizerName: string;
  registeredCount: number;
  capacity: number;
}
