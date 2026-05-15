// Centralized React Query keys + fetchers, all typed against /lib/types.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { tokenStore } from "./auth-store";
import type {
  AuthTokens,
  Campaign,
  CampaignCreatePayload,
  CampaignListItem,
  CampaignStatus,
  CampaignUpdatePayload,
  Comment,
  Contribution,
  ContributionCreatePayload,
  LoginPayload,
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
    mutationFn: async () =>
      (await api.post<Campaign>(`/admin/campaigns/${id}/reject`)).data,
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
