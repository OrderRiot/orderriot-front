// Centralized React Query keys + fetchers, all typed against /lib/types.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { tokenStore } from "./auth-store";
import type {
  AdminOrganization,
  AuthTokens,
  TokenWithUser,
  Campaign,
  CollabPost,
  UserPortfolioItem,
  UserPortfolioItemCreatePayload,
  UserPortfolioItemUpdatePayload,
  CollabPostCreatePayload,
  CollabPostType,
  CollabPostUpdatePayload,
  CollabResponseCreatePayload,
  CollabResponseInfo,
  Conversation,
  DirectMessage,
  Idea,
  IdeaCreatePayload,
  IdeaListItem,
  IdeaUpdatePayload,
  Notification,
  CampaignCreatePayload,
  CampaignListItem,
  CampaignStatus,
  CampaignUpdatePayload,
  Comment,
  Contribution,
  ContributionCreatePayload,
  LoginPayload,
  OrgCreatePayload,
  OrgListItem,
  OrgMember,
  OrgMemberAddPayload,
  OrgPortfolioItem,
  OrgPortfolioItemCreatePayload,
  OrgStatus,
  OrgUpdatePayload,
  Organization,
  ReactionCounts,
  RegisterPayload,
  Reward,
  RewardCreatePayload,
  User,
  VerificationRequest,
  VerificationStatus,
  VerificationWithUser,
} from "./types";

export const qk = {
  me: ["me"] as const,
  user: (id: number) => ["user", id] as const,
  campaigns: (params?: CampaignFilters) => ["campaigns", params] as const,
  myCampaigns: ["campaigns", "mine"] as const,
  campaign: (id: number) => ["campaign", id] as const,
  rewards: (id: number) => ["campaign", id, "rewards"] as const,
  comments: (id: number) => ["campaign", id, "comments"] as const,
  reactionCounts: (campId: number, commentId: number) =>
    ["campaign", campId, "comment", commentId, "reactions"] as const,
  myContributions: ["contributions", "mine"] as const,
  myVerification: ["verification", "me"] as const,
  adminVerifications: (status?: VerificationStatus) => ["admin", "verifications", status ?? "pending"] as const,
  myOrganizations: ["organizations", "mine"] as const,
  organization: (id: number) => ["organization", id] as const,
  adminOrganizations: (status?: OrgStatus) => ["admin", "organizations", status ?? "pending"] as const,
  ideas: (params?: { category?: string }) => ["ideas", params] as const,
  myIdeas: ["ideas", "mine"] as const,
  idea: (id: number) => ["idea", id] as const,
  notifications: ["notifications"] as const,
  notifUnread: ["notifications", "unread"] as const,
  collabs: (params?: { skill?: string }) => ["collabs", params] as const,
  myCollabs: ["collabs", "mine"] as const,
  collab: (id: number) => ["collab", id] as const,
  collabResponses: (id: number) => ["collab", id, "responses"] as const,
  conversations: ["conversations"] as const,
  conversation: (id: number) => ["conversation", id] as const,
  messages: (convId: number) => ["conversation", convId, "messages"] as const,
  msgUnread: ["messages", "unread"] as const,
  myPortfolio: ["portfolio", "me"] as const,
  userPortfolio: (userId: number) => ["portfolio", "user", userId] as const,
};

// ── Auth ─────────────────────────────────────────────────────────

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await api.post<AuthTokens>("/auth/login", payload);
      return res.data;
    },
    onSuccess: (tokens) => {
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useGoogleAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (idToken: string) => {
      const res = await api.post<TokenWithUser>("/auth/google", { id_token: idToken });
      return res.data;
    },
    onSuccess: (data) => {
      tokenStore.set(data.access_token, data.refresh_token);
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await api.post<User>("/auth/register", payload);
      return res.data;
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refresh = tokenStore.refresh();
      if (refresh) {
        try {
          await api.post("/auth/logout", null, { params: { refresh_token: refresh } });
        } catch {
          // ignore — we clear locally regardless
        }
      }
      tokenStore.clear();
    },
    onSuccess: () => qc.clear(),
  });
}

// ── Users ────────────────────────────────────────────────────────

export function useMe(enabled = true) {
  return useQuery({
    queryKey: qk.me,
    enabled: enabled && !!tokenStore.access(),
    queryFn: async () => (await api.get<User>("/users/me")).data,
    retry: false,
    staleTime: 60_000,
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: qk.user(userId),
    queryFn: async () => (await api.get<User>(`/users/${userId}`)).data,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) =>
      (await api.patch<User>("/users/me", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

// ── Campaigns ────────────────────────────────────────────────────

export interface CampaignFilters {
  category?: string;
  location?: string;
  status?: CampaignStatus;
  search?: string;
  skip?: number;
  limit?: number;
}

export function useCampaigns(filters: CampaignFilters = {}) {
  return useQuery({
    queryKey: qk.campaigns(filters),
    queryFn: async () => {
      const res = await api.get<CampaignListItem[]>("/campaigns/", { params: filters });
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useMyCampaigns() {
  return useQuery({
    queryKey: qk.myCampaigns,
    queryFn: async () => (await api.get<CampaignListItem[]>("/campaigns/mine/all")).data,
    enabled: !!tokenStore.access(),
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: qk.campaign(id),
    queryFn: async () => (await api.get<Campaign>(`/campaigns/${id}`)).data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CampaignCreatePayload) =>
      (await api.post<Campaign>("/campaigns/", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CampaignUpdatePayload) =>
      (await api.patch<Campaign>(`/campaigns/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.campaign(id) });
      qc.invalidateQueries({ queryKey: qk.myCampaigns });
    },
  });
}

export function useLaunchCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<Campaign>(`/campaigns/${id}/launch`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.campaign(id) });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSubmitCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<Campaign>(`/campaigns/${id}/submit`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.campaign(id) });
      qc.invalidateQueries({ queryKey: qk.myCampaigns });
    },
  });
}

// ── Admin ─────────────────────────────────────────────────────────

export function useAdminCampaigns(status?: CampaignStatus) {
  return useQuery({
    queryKey: ["admin", "campaigns", status ?? "all"],
    queryFn: async () => {
      const params = status ? { status } : {};
      return (await api.get<Campaign[]>("/admin/campaigns", { params })).data;
    },
    enabled: !!tokenStore.access(),
  });
}

export function useApproveCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<Campaign>(`/admin/campaigns/${id}/approve`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      qc.invalidateQueries({ queryKey: qk.campaign(id) });
    },
  });
}

export function useRejectCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note?: string) =>
      (await api.post<Campaign>(`/admin/campaigns/${id}/reject`, { note: note ?? null })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      qc.invalidateQueries({ queryKey: qk.campaign(id) });
    },
  });
}

export function useCancelCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<Campaign>(`/campaigns/${id}/cancel`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.campaign(id) });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

// ── Rewards ──────────────────────────────────────────────────────

export function useRewards(campId: number) {
  return useQuery({
    queryKey: qk.rewards(campId),
    queryFn: async () => (await api.get<Reward[]>(`/campaigns/${campId}/rewards`)).data,
    enabled: Number.isFinite(campId) && campId > 0,
  });
}

export function useAddReward(campId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RewardCreatePayload) =>
      (await api.post<Reward>(`/campaigns/${campId}/rewards`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.rewards(campId) }),
  });
}

// ── Contributions ────────────────────────────────────────────────

export function useBackCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContributionCreatePayload) =>
      (await api.post<Contribution>("/contributions/", payload)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.campaign(vars.camp_id) });
      qc.invalidateQueries({ queryKey: qk.rewards(vars.camp_id) });
      qc.invalidateQueries({ queryKey: qk.myContributions });
    },
  });
}

export function useMyContributions() {
  return useQuery({
    queryKey: qk.myContributions,
    queryFn: async () => (await api.get<Contribution[]>("/contributions/mine")).data,
    enabled: !!tokenStore.access(),
  });
}

// ── Comments ─────────────────────────────────────────────────────

export function useComments(campId: number) {
  return useQuery({
    queryKey: qk.comments(campId),
    queryFn: async () =>
      (await api.get<Comment[]>(`/campaigns/${campId}/comments/`)).data,
    enabled: Number.isFinite(campId) && campId > 0,
  });
}

export function usePostComment(campId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { comment_body: string; parent_comment_id?: number | null }) =>
      (await api.post<Comment>(`/campaigns/${campId}/comments/`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.comments(campId) }),
  });
}

export function useReactToComment(campId: number, commentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reaction_type: "like" | "dislike") =>
      api.post(`/campaigns/${campId}/comments/${commentId}/react`, { reaction_type }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.reactionCounts(campId, commentId) }),
  });
}

export function useReactionCounts(campId: number, commentId: number) {
  return useQuery({
    queryKey: qk.reactionCounts(campId, commentId),
    queryFn: async () =>
      (
        await api.get<ReactionCounts>(
          `/campaigns/${campId}/comments/${commentId}/reactions`,
        )
      ).data,
  });
}

// ── Uploads ──────────────────────────────────────────────────────

export async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ avatar_url: string }>("/uploads/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.avatar_url;
}

export async function uploadCampaignMedia(campId: number, files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await api.post<{ uploaded: string[]; all_media: string[] }>(
    `/uploads/campaign/${campId}`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.all_media;
}

export async function uploadIdProof(files: File[]): Promise<{ uploaded: string[]; status: string }> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await api.post<{ uploaded: string[]; status: string }>("/uploads/id-proof", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function uploadCampaignDocuments(campId: number, files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await api.post<{ uploaded: string[]; all_documents: string[] }>(
    `/uploads/campaign/${campId}/documents`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.all_documents;
}

// ── Verification (user) ───────────────────────────────────────────

export function useMyVerification() {
  return useQuery({
    queryKey: qk.myVerification,
    queryFn: async () => (await api.get<VerificationRequest | null>("/verifications/me")).data,
    enabled: !!tokenStore.access(),
  });
}

// ── Admin: Verifications ─────────────────────────────────────────

export function useAdminVerifications(status?: VerificationStatus) {
  return useQuery({
    queryKey: qk.adminVerifications(status),
    queryFn: async () => {
      const params = status ? { status } : {};
      return (await api.get<VerificationWithUser[]>("/admin/verifications", { params })).data;
    },
    enabled: !!tokenStore.access(),
  });
}

export function useApproveVerification(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post(`/admin/verifications/${id}/approve`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "verifications"] }),
  });
}

export function useRejectVerification(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note?: string) =>
      (await api.post(`/admin/verifications/${id}/reject`, { note: note ?? null })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "verifications"] }),
  });
}

// ── Organizations ────────────────────────────────────────────────

export function useMyOrganizations() {
  return useQuery({
    queryKey: qk.myOrganizations,
    queryFn: async () => (await api.get<OrgListItem[]>("/organizations/mine")).data,
    enabled: !!tokenStore.access(),
  });
}

export function useOrganization(id: number) {
  return useQuery({
    queryKey: qk.organization(id),
    queryFn: async () => (await api.get<Organization>(`/organizations/${id}`)).data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrgCreatePayload) =>
      (await api.post<Organization>("/organizations/", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myOrganizations }),
  });
}

export function useUpdateOrganization(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrgUpdatePayload) =>
      (await api.patch<Organization>(`/organizations/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organization(id) });
      qc.invalidateQueries({ queryKey: qk.myOrganizations });
    },
  });
}

export function useAddOrgMember(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrgMemberAddPayload) =>
      (await api.post<OrgMember>(`/organizations/${orgId}/members`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organization(orgId) }),
  });
}

export function useRemoveOrgMember(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: number) =>
      api.delete(`/organizations/${orgId}/members/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organization(orgId) }),
  });
}

export function useAddPortfolioItem(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrgPortfolioItemCreatePayload) =>
      (await api.post<OrgPortfolioItem>(`/organizations/${orgId}/portfolio`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organization(orgId) }),
  });
}

export function useDeleteOrgPortfolioItem(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) =>
      api.delete(`/organizations/${orgId}/portfolio/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organization(orgId) }),
  });
}

export async function uploadOrgAvatar(orgId: number, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ avatar_url: string }>(
    `/uploads/organization/${orgId}/avatar`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.avatar_url;
}

export async function uploadOrgIdentityProof(orgId: number, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ identity_proof_url: string }>(
    `/uploads/organization/${orgId}/identity-proof`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.identity_proof_url;
}

// ── Admin: Organizations ─────────────────────────────────────────

export function useAdminOrganizations(status?: OrgStatus) {
  return useQuery({
    queryKey: qk.adminOrganizations(status),
    queryFn: async () => {
      const params = status ? { status } : {};
      return (await api.get<AdminOrganization[]>("/admin/organizations", { params })).data;
    },
    enabled: !!tokenStore.access(),
  });
}

export function useVerifyOrganization(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post(`/admin/organizations/${id}/verify`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "organizations"] }),
  });
}

export async function uploadIdeaMedia(ideaId: number, files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await api.post<{ uploaded: string[]; all_media: string[] }>(
    `/uploads/idea/${ideaId}/media`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.all_media;
}

export async function deleteIdeaMedia(ideaId: number, fileUrl: string): Promise<void> {
  await api.delete(`/uploads/idea/${ideaId}/media`, { params: { file_url: fileUrl } });
}

export function useRejectOrganization(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note?: string) =>
      (await api.post(`/admin/organizations/${id}/reject`, { note: note ?? null })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "organizations"] }),
  });
}

// ── Ideas ─────────────────────────────────────────────────────────

export function useIdeas(params: { category?: string } = {}) {
  return useQuery({
    queryKey: qk.ideas(params),
    queryFn: async () => (await api.get<IdeaListItem[]>("/ideas/", { params })).data,
    staleTime: 30_000,
  });
}

export function useMyIdeas() {
  return useQuery({
    queryKey: qk.myIdeas,
    queryFn: async () => (await api.get<IdeaListItem[]>("/ideas/mine")).data,
    enabled: !!tokenStore.access(),
  });
}

export function useIdea(id: number) {
  return useQuery({
    queryKey: qk.idea(id),
    queryFn: async () => (await api.get<Idea>(`/ideas/${id}`)).data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IdeaCreatePayload) =>
      (await api.post<Idea>("/ideas/", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myIdeas }),
  });
}

export function useUpdateIdea(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IdeaUpdatePayload) =>
      (await api.patch<Idea>(`/ideas/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.idea(id) });
      qc.invalidateQueries({ queryKey: qk.myIdeas });
    },
  });
}

export function usePublishIdea(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<Idea>(`/ideas/${id}/publish`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.idea(id) });
      qc.invalidateQueries({ queryKey: qk.myIdeas });
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useDeleteIdea(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => api.delete(`/ideas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myIdeas }),
  });
}

export function useToggleInterest(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ interested: boolean }>(`/ideas/${id}/interest`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.idea(id) });
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}

export function useConvertIdea(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ campaign_id: number }>(`/ideas/${id}/convert`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.idea(id) });
      qc.invalidateQueries({ queryKey: qk.myIdeas });
    },
  });
}

// ── Notifications ─────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: async () => (await api.get<Notification[]>("/notifications/me")).data,
    enabled: !!tokenStore.access(),
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notifUnread,
    queryFn: async () =>
      (await api.get<{ count: number }>("/notifications/me/unread-count")).data.count,
    enabled: !!tokenStore.access(),
    refetchInterval: 30_000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post("/notifications/me/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.notifUnread });
    },
  });
}

// ── Collabs ───────────────────────────────────────────────────────

export function useCollabs(params: { skill?: string; post_type?: CollabPostType; idea_id?: number; campaign_id?: number } = {}) {
  return useQuery({
    queryKey: qk.collabs(params),
    queryFn: async () => (await api.get<CollabPost[]>("/collabs/", { params })).data,
    staleTime: 30_000,
  });
}

export function useMyCollabs() {
  return useQuery({
    queryKey: qk.myCollabs,
    queryFn: async () => (await api.get<CollabPost[]>("/collabs/mine")).data,
    enabled: !!tokenStore.access(),
  });
}

export function useCollab(id: number) {
  return useQuery({
    queryKey: qk.collab(id),
    queryFn: async () => (await api.get<CollabPost>(`/collabs/${id}`)).data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateCollab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CollabPostCreatePayload) =>
      (await api.post<CollabPost>("/collabs/", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myCollabs });
      qc.invalidateQueries({ queryKey: ["collabs"] });
    },
  });
}

export function useUpdateCollab(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CollabPostUpdatePayload) =>
      (await api.patch<CollabPost>(`/collabs/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.collab(id) });
      qc.invalidateQueries({ queryKey: qk.myCollabs });
    },
  });
}

export function useCloseCollab(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filled: boolean = false) => {
      await api.post(`/collabs/${id}/close`, null, { params: { filled } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.collab(id) });
      qc.invalidateQueries({ queryKey: qk.myCollabs });
      qc.invalidateQueries({ queryKey: ["collabs"] });
    },
  });
}

export function useRespondToCollab(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CollabResponseCreatePayload) =>
      (await api.post<CollabResponseInfo>(`/collabs/${id}/respond`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.collab(id) }),
  });
}

export function useCollabResponses(id: number, enabled: boolean) {
  return useQuery({
    queryKey: qk.collabResponses(id),
    queryFn: async () => (await api.get<CollabResponseInfo[]>(`/collabs/${id}/responses`)).data,
    enabled: enabled && !!tokenStore.access(),
  });
}

// ── Messages ──────────────────────────────────────────────────────

export function useMsgUnreadCount() {
  return useQuery({
    queryKey: qk.msgUnread,
    queryFn: async () =>
      (await api.get<{ count: number }>("/messages/unread-count")).data.count,
    enabled: !!tokenStore.access(),
    refetchInterval: 30_000,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: qk.conversations,
    queryFn: async () => (await api.get<Conversation[]>("/messages/conversations")).data,
    enabled: !!tokenStore.access(),
    refetchInterval: 15_000,
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: qk.conversation(id),
    queryFn: async () => (await api.get<Conversation>(`/messages/conversations/${id}`)).data,
    enabled: Number.isFinite(id) && id > 0 && !!tokenStore.access(),
  });
}

export function useMessages(convId: number) {
  return useQuery({
    queryKey: qk.messages(convId),
    queryFn: async () =>
      (await api.get<DirectMessage[]>(`/messages/conversations/${convId}/messages`)).data,
    enabled: Number.isFinite(convId) && convId > 0 && !!tokenStore.access(),
    refetchInterval: 5_000,
  });
}

export function useSendMessage(convId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) =>
      (await api.post<DirectMessage>(`/messages/conversations/${convId}/messages`, { body })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(convId) });
      qc.invalidateQueries({ queryKey: qk.conversations });
      qc.invalidateQueries({ queryKey: qk.msgUnread });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (other_user_id: number) =>
      (await api.post<Conversation>("/messages/conversations", { other_user_id })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.conversations }),
  });
}

// ── Portfolio ─────────────────────────────────────────────────────

export function useMyPortfolio() {
  return useQuery({
    queryKey: qk.myPortfolio,
    queryFn: async () => (await api.get<UserPortfolioItem[]>("/portfolio/me")).data,
    enabled: !!tokenStore.access(),
  });
}

export function useUserPortfolio(userId: number) {
  return useQuery({
    queryKey: qk.userPortfolio(userId),
    queryFn: async () => (await api.get<UserPortfolioItem[]>(`/users/${userId}/portfolio`)).data,
    enabled: Number.isFinite(userId) && userId > 0,
  });
}

export function useCreatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserPortfolioItemCreatePayload) =>
      (await api.post<UserPortfolioItem>("/portfolio/", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myPortfolio }),
  });
}

export function useUpdatePortfolioItem(itemId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserPortfolioItemUpdatePayload) =>
      (await api.patch<UserPortfolioItem>(`/portfolio/${itemId}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myPortfolio }),
  });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => api.delete(`/portfolio/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myPortfolio }),
  });
}

export async function uploadPortfolioMedia(itemId: number, files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await api.post<{ uploaded: string[]; all_media: string[] }>(
    `/uploads/portfolio/${itemId}/media`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.all_media;
}

export async function deletePortfolioMedia(itemId: number, fileUrl: string): Promise<void> {
  await api.delete(`/uploads/portfolio/${itemId}/media`, { params: { file_url: fileUrl } });
}
