export type AdminApprovalStatus = "approved" | "pending";

export interface SuperAdminStats {
  total_admins: number;
  approved_admins: number;
  pending_admins: number;
  total_quizzes: number;
  total_quiz_links: number;
  total_submitted_attempts: number;
}

export interface PlatformAdmin {
  id: number;
  name: string;
  email: string;
  is_approved: boolean;
  created_at: string;
}

export interface PlatformAdminDetail extends PlatformAdmin {
  questions_count: number;
  quizzes_count: number;
  quiz_links_count: number;
}

export interface AdminListParams {
  page: number;
  per_page: number;
  search?: string;
  status?: AdminApprovalStatus;
}

export interface AdminListPage {
  current_page: number;
  data: PlatformAdmin[];
  last_page: number;
  per_page: number;
  total: number;
}
