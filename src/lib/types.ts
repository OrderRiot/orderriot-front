// Mirrors backend pydantic schemas in orderriot-back/app/schemas/*

export const UserType = {
  backer: 1,
  creator: 2,
  both: 3,
  admin: 6,
} as const;
export type UserTypeValue = (typeof UserType)[keyof typeof UserType];

export type Gender = "male" | "female" | "other" | "prefer_not";

export interface User {
  user_id: number;
  username: string;
  email: string;
  phone: string | null;
  user_type: number;
  gender: Gender | null;
  location: string | null;
  avatar_url: string | null;
  isverified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export type CampaignStatus = "draft" | "pending_review" | "active" | "funded" | "failed" | "cancelled";

export interface CampaignListItem {
  camp_id: number;
  owner_id: number;
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  status: CampaignStatus;
  goal_amount: number;
  current_amount: number;
  media: string[] | null;
  creation_date: string;
  completion_date: string | null;
}

export interface Campaign extends CampaignListItem {
  description: string | null;
  company: string | null;
  team_members: number[] | null;
  key_backers: number[] | null;
  launch_date: string | null;
  documents?: string[] | null; // admin-only, never shown publicly
}

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationRequest {
  id: number;
  user_id: number;
  id_proof_urls: string[];
  status: VerificationStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface VerificationWithUser extends VerificationRequest {
  username: string;
  email: string;
  avatar_url: string | null;
}

export interface Reward {
  reward_id: number;
  camp_id: number;
  title: string;
  description: string | null;
  min_amount: number;
  max_backers: number | null;
  current_backers: number;
  estimated_delivery: string | null;
}

export type PaymentMode = "card" | "upi" | "wallet" | "bank";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface Contribution {
  contrib_id: number;
  user_id: number;
  camp_id: number;
  reward_id: number | null;
  contrib_amount: number;
  contrib_date: string;
  transaction_ref: string | null;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
}

export interface Comment {
  comment_id: number;
  user_id: number | null;
  camp_id: number;
  parent_comment_id: number | null;
  comment_body: string;
  posted_date: string;
}

export interface ReactionCounts {
  comment_id: number;
  likes: number;
  dislikes: number;
}

// Request payloads

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  phone?: string | null;
  gender?: Gender | null;
  location?: string | null;
  user_type?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CampaignCreatePayload {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  company?: string | null;
  category?: string | null;
  location?: string | null;
  goal_amount: number;
  completion_date?: string | null;
  media?: string[] | null;
  team_members?: number[] | null;
}

export type CampaignUpdatePayload = Partial<CampaignCreatePayload>;

export interface RewardCreatePayload {
  title: string;
  description?: string | null;
  min_amount: number;
  max_backers?: number | null;
  estimated_delivery?: string | null;
}

export interface ContributionCreatePayload {
  camp_id: number;
  reward_id?: number | null;
  contrib_amount: number;
  payment_mode: PaymentMode;
  transaction_ref?: string | null;
}
