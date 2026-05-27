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
  name: string | null;
  bio: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
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

export type Visibility = "public" | "unlisted" | "private" | "draft" | "archived";

export interface CampaignListItem {
  camp_id: number;
  slug: string | null;
  owner_id: number;
  owner_username: string | null;
  owner_avatar_url: string | null;
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  status: CampaignStatus;
  visibility: Visibility;
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
  slug: string | null;
  owner_id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  rough_goal: number | null;
  media_urls: string[] | null;
  status: IdeaStatus;
  visibility: Visibility;
  campaign_id: number | null;
  campaign_slug: string | null;
  interest_count: number;
  created_at: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Idea extends IdeaListItem {
  target_audience: string | null;
  story: string | null;
  risks: string | null;
  faqs: FaqItem[] | null;
  user_interested: boolean;
}

export interface IdeaCreatePayload {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  story?: string | null;
  category?: string | null;
  target_audience?: string | null;
  rough_goal?: number | null;
  risks?: string | null;
  faqs?: FaqItem[] | null;
  tags?: string[] | null;
  visibility?: Visibility;
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
  slug: string | null;
  owner_id: number;
  owner: CollabOwnerInfo;
  org_id: number | null;
  org: CollabOrgInfo | null;
  idea_id: number | null;
  campaign_id: number | null;
  idea_title: string | null;
  idea_slug: string | null;
  campaign_title: string | null;
  campaign_slug: string | null;
  post_type: CollabPostType;
  title: string;
  description: string | null;
  skills: string[] | null;
  call_type: CollabCallType;
  support_type: string | null;
  status: CollabStatus;
  visibility: Visibility;
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
  status: "pending" | "accepted" | "rejected";
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
  visibility?: Visibility;
}

// ── Search ───────────────────────────────────────────────────────

export interface SearchResult {
  campaigns: { id: number; title: string; subtitle: string | null; category: string | null }[];
  ideas: { id: number; title: string; category: string | null }[];
  collabs: { id: number; title: string; post_type: string }[];
  organizations: { id: number; name: string; org_type: string; avatar_url: string | null }[];
  users: { id: number; username: string; avatar_url: string | null; isverified: boolean }[];
}

export interface AdminSearchResult {
  campaigns: { id: number; slug: string | null; title: string; status: CampaignStatus; goal_amount: number }[];
  users: { id: number; username: string; email: string; isverified: boolean; user_type: number }[];
  organizations: { id: number; slug: string | null; name: string; status: string; org_type: string }[];
  pending_verifications: { id: number; user_id: number; username: string; email: string }[];
}

export type CollabPostUpdatePayload = Partial<Omit<CollabPostCreatePayload, "idea_id" | "campaign_id">>;

export interface CollabResponseCreatePayload {
  message: string;
  portfolio_link?: string | null;
}

// ── Organizations ────────────────────────────────────────────────

export type OrgStatus = "pending" | "verified" | "rejected";
export type OrgType = "marketing" | "investors" | "incubators" | "manufacturers" | "av_production" | "consultancy" | "software" | "other";
export type EntityType = "solo" | "pvt_ltd" | "llc" | "partnership" | "ngo" | "trust" | "other";

export interface UserSearchResult {
  user_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
}
export type OrgRole = "owner" | "member" | "collaborator";
export type MemberType = "permanent" | "freelancer" | "contract";
export type CertificationType = "ZED" | "ISO9001" | "ISO14001" | "ISO45001" | "ISO27001" | "MSME" | "FSSAI" | "BIS" | "other";

export interface OrgMember {
  id: number;
  org_id: number;
  user_id: number | null;
  email: string;
  name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  role: OrgRole;
  member_type: MemberType;
  claimed: boolean;
  created_at: string;
}

export interface OrgEquipment {
  id: number;
  org_id: number;
  name: string;
  make: string | null;
  model_number: string | null;
  description: string | null;
  capabilities: string | null;
  image_urls: string[] | null;
  created_at: string;
}

export interface OrgClient {
  id: number;
  org_id: number;
  name: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  years_worked: string | null;
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

export interface OrgCertification {
  id: number;
  org_id: number;
  name: string;
  cert_type: CertificationType;
  issuer: string | null;
  cert_number: string | null;
  description: string | null;
  file_url: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  created_at: string;
}

export interface OrgOffice {
  id: number;
  org_id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  is_headquarters: boolean;
  created_at: string;
}

export interface Organization {
  id: number;
  slug: string | null;
  owner_id: number;
  owner_username: string;
  owner_avatar_url: string | null;
  name: string;
  description: string | null;
  history: string | null;
  founded_year: number | null;
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
  ecosystem_access: string[] | null;
  certifications: OrgCertification[];
  offices: OrgOffice[];
  equipment: OrgEquipment[];
  clients: OrgClient[];
}

export interface AdminOrganization extends Organization {
  identity_proof_url: string | null;
}

export interface OrgListItem {
  id: number;
  slug: string | null;
  owner_id: number;
  owner_username: string;
  owner_avatar_url: string | null;
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
  history?: string | null;
  founded_year?: number | null;
  org_type: OrgType;
  entity_type: EntityType;
  license_number?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
  ecosystem_access?: string[] | null;
}

export type OrgUpdatePayload = Partial<OrgCreatePayload>;

export interface OrgMemberAddPayload {
  email: string;
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  role?: OrgRole;
  member_type?: MemberType;
}

export interface OrgMemberUpdatePayload {
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  role?: OrgRole;
  member_type?: MemberType;
}

export interface OrgPortfolioItemCreatePayload {
  title: string;
  description?: string | null;
  media_urls?: string[] | null;
  link?: string | null;
  tags?: string[] | null;
}

export interface OrgCertificationCreatePayload {
  name: string;
  cert_type?: CertificationType;
  issuer?: string | null;
  cert_number?: string | null;
  description?: string | null;
  issued_date?: string | null;
  expiry_date?: string | null;
}

export interface OrgOfficeCreatePayload {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  description?: string | null;
  is_headquarters?: boolean;
}

export type OrgOfficeUpdatePayload = Partial<OrgOfficeCreatePayload>;

export interface OrgEquipmentCreatePayload {
  name: string;
  make?: string | null;
  model_number?: string | null;
  description?: string | null;
  capabilities?: string | null;
}

export interface OrgClientCreatePayload {
  name: string;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  years_worked?: string | null;
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
  camp_slug: string | null;
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
  username: string | null;
  avatar_url: string | null;
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
  visibility?: Visibility;
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
