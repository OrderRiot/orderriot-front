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
  has_google: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface TokenWithUser extends AuthTokens {
  user: Pick<User, "user_id" | "username" | "email" | "avatar_url">;
  is_new_user: boolean;
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
  rejection_note?: string | null;
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
  rejection_note?: string | null;
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

// ── Ideas ────────────────────────────────────────────────────────

export type IdeaStatus = "draft" | "published" | "converted";

export interface IdeaListItem {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  category: string | null;
  rough_goal: number | null;
  media_urls: string[] | null;
  status: IdeaStatus;
  campaign_id: number | null;
  interest_count: number;
  created_at: string;
}

export interface Idea extends IdeaListItem {
  target_audience: string | null;
  user_interested: boolean;
}

export interface IdeaCreatePayload {
  title: string;
  description?: string | null;
  category?: string | null;
  target_audience?: string | null;
  rough_goal?: number | null;
}

export type IdeaUpdatePayload = Partial<IdeaCreatePayload>;

// ── Notifications ────────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Portfolio ─────────────────────────────────────────────────────

export interface UserPortfolioItem {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  media_urls: string[] | null;
  link: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface UserPortfolioItemCreatePayload {
  title: string;
  description?: string | null;
  link?: string | null;
  tags?: string[] | null;
}

export type UserPortfolioItemUpdatePayload = Partial<UserPortfolioItemCreatePayload>;

// ── Messages ─────────────────────────────────────────────────────

export interface MessageUserBrief {
  user_id: number;
  username: string;
  avatar_url: string | null;
}

export interface Conversation {
  id: number;
  other_user: MessageUserBrief;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

export interface DirectMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  is_read: boolean;
  created_at: string;
}

// ── Collabs ──────────────────────────────────────────────────────

export type CollabPostType = "request" | "offer";
export type CollabCallType = "open" | "outreach" | "both";
export type CollabStatus = "open" | "closed" | "filled";

export interface CollabOwnerInfo {
  user_id: number;
  username: string;
  avatar_url: string | null;
}

export interface CollabOrgInfo {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface CollabPost {
  id: number;
  owner_id: number;
  owner: CollabOwnerInfo;
  org_id: number | null;
  org: CollabOrgInfo | null;
  idea_id: number | null;
  campaign_id: number | null;
  idea_title: string | null;
  campaign_title: string | null;
  post_type: CollabPostType;
  title: string;
  description: string | null;
  skills: string[] | null;
  call_type: CollabCallType;
  support_type: string | null;
  status: CollabStatus;
  response_count: number;
  created_at: string;
}

export interface CollabResponseInfo {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  message: string;
  portfolio_link: string | null;
  created_at: string;
}

export interface CollabPostCreatePayload {
  post_type?: CollabPostType;
  title: string;
  description?: string | null;
  skills?: string[] | null;
  call_type?: CollabCallType;
  support_type?: string | null;
  org_id?: number | null;
  idea_id?: number | null;
  campaign_id?: number | null;
}

export type CollabPostUpdatePayload = Partial<Omit<CollabPostCreatePayload, "idea_id" | "campaign_id">>;

export interface CollabResponseCreatePayload {
  message: string;
  portfolio_link?: string | null;
}

// ── Organizations ────────────────────────────────────────────────

export type OrgStatus = "pending" | "verified" | "rejected";
export type OrgType = "personal" | "studio" | "agency" | "brand" | "ngo" | "other";
export type EntityType = "solo" | "pvt_ltd" | "llc" | "partnership" | "other";
export type OrgRole = "owner" | "member" | "collaborator";

export interface OrgMember {
  id: number;
  org_id: number;
  user_id: number | null;
  email: string;
  name: string | null;
  title: string | null;
  role: OrgRole;
  claimed: boolean;
  created_at: string;
}

export interface OrgPortfolioItem {
  id: number;
  org_id: number;
  title: string;
  description: string | null;
  media_urls: string[] | null;
  link: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface Organization {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  org_type: OrgType;
  entity_type: EntityType;
  license_number: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  status: OrgStatus;
  rejection_note: string | null;
  created_at: string;
  members: OrgMember[];
  portfolio: OrgPortfolioItem[];
}

export interface AdminOrganization extends Organization {
  identity_proof_url: string | null;
}

export interface OrgListItem {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  org_type: OrgType;
  entity_type: EntityType;
  status: OrgStatus;
  created_at: string;
}

export interface OrgCreatePayload {
  name: string;
  description?: string | null;
  org_type: OrgType;
  entity_type: EntityType;
  license_number?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
}

export type OrgUpdatePayload = Partial<OrgCreatePayload>;

export interface OrgMemberAddPayload {
  email: string;
  name?: string | null;
  title?: string | null;
  role?: OrgRole;
}

export interface OrgPortfolioItemCreatePayload {
  title: string;
  description?: string | null;
  media_urls?: string[] | null;
  link?: string | null;
  tags?: string[] | null;
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
