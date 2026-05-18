import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Search, Check, X, ShieldCheck, Building2,
  Megaphone, User as UserIcon, ChevronRight, ShieldX,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminSearch, useSetUserType } from "@/lib/queries";
import { api } from "@/lib/api";
import { apiError } from "@/lib/api";
import { UserType } from "@/lib/types";

type Section = "verifications" | "campaigns" | "organizations";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: Section) => void;
}

const STATIC_COMMANDS = [
  { label: "Go to User Verifications", section: "verifications" as Section, icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { label: "Go to Campaign Reviews", section: "campaigns" as Section, icon: <Megaphone className="h-3.5 w-3.5" /> },
  { label: "Go to Org Verifications", section: "organizations" as Section, icon: <Building2 className="h-3.5 w-3.5" /> },
];

export function AdminCommandBar({ open, onClose, onNavigate }: Props) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setUserType = useSetUserType();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 280);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useAdminSearch(debouncedQ);

  useEffect(() => {
    if (open) {
      setQ("");
      setDebouncedQ("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  // ── Inline admin actions ──────────────────────────────────────
  async function approveCampaign(id: number, title: string) {
    try {
      await api.post(`/admin/campaigns/${id}/approve`);
      qc.invalidateQueries({ queryKey: ["admin-search"] });
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success(`"${title}" approved and live.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function rejectCampaignToDraft(id: number, title: string) {
    try {
      await api.post(`/admin/campaigns/${id}/reject`, { note: null });
      qc.invalidateQueries({ queryKey: ["admin-search"] });
      qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success(`"${title}" sent back to draft.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function approveVerification(id: number, username: string) {
    try {
      await api.post(`/admin/verifications/${id}/approve`);
      qc.invalidateQueries({ queryKey: ["admin-search"] });
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
      toast.success(`${username} verified.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function rejectVerification(id: number, username: string) {
    try {
      await api.post(`/admin/verifications/${id}/reject`, { note: null });
      qc.invalidateQueries({ queryKey: ["admin-search"] });
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
      toast.success(`${username} rejected.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function verifyOrg(id: number, name: string) {
    try {
      await api.post(`/admin/organizations/${id}/verify`);
      qc.invalidateQueries({ queryKey: ["admin-search"] });
      qc.invalidateQueries({ queryKey: ["admin", "organizations"] });
      toast.success(`"${name}" verified.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function rejectOrg(id: number, name: string) {
    try {
      await api.post(`/admin/organizations/${id}/reject`, { note: null });
      qc.invalidateQueries({ queryKey: ["admin-search"] });
      qc.invalidateQueries({ queryKey: ["admin", "organizations"] });
      toast.success(`"${name}" rejected.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function makeAdmin(userId: number, username: string) {
    try {
      await setUserType.mutateAsync({ userId, userType: UserType.admin });
      toast.success(`${username} is now an admin.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  async function removeAdmin(userId: number, username: string) {
    try {
      await setUserType.mutateAsync({ userId, userType: UserType.both });
      toast.success(`${username} admin access removed.`);
    } catch (err) { toast.error(apiError(err)); }
  }

  const hasResults = data && (
    data.campaigns.length + data.users.length +
    data.organizations.length + data.pending_verifications.length > 0
  );

  const filteredStatic = STATIC_COMMANDS.filter(
    (c) => !q || c.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-paper border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-ink text-paper">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold tracking-widest uppercase">God Mode</span>
          <span className="ml-auto text-[10px] text-paper/50">cmd+g to toggle</span>
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find user, campaign, org — or type a command..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              onClick={() => { setQ(""); setDebouncedQ(""); }}
              className="text-muted-foreground hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Static commands */}
          {filteredStatic.length > 0 && (
            <div>
              <GroupLabel label="Quick Actions" />
              {filteredStatic.map((cmd) => (
                <button
                  key={cmd.section}
                  onClick={() => { onNavigate(cmd.section); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                >
                  <span className="text-muted-foreground">{cmd.icon}</span>
                  <span className="text-sm font-medium">{cmd.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {q && isFetching && !data && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Searching...</div>
          )}

          {/* No results */}
          {q.trim().length >= 2 && !isFetching && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing found for <span className="font-medium text-ink">"{q}"</span>
            </div>
          )}

          {/* Dynamic results */}
          {hasResults && (
            <>
              {/* Pending verifications */}
              {data!.pending_verifications.length > 0 && (
                <div>
                  <GroupLabel label="Pending Verifications" />
                  {data!.pending_verifications.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{v.username}</span>
                        <span className="text-xs text-muted-foreground ml-2">{v.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ActionBtn
                          icon={<Check className="h-3 w-3" />}
                          label="Approve"
                          onClick={() => approveVerification(v.id, v.username)}
                          variant="approve"
                        />
                        <ActionBtn
                          icon={<X className="h-3 w-3" />}
                          label="Reject"
                          onClick={() => rejectVerification(v.id, v.username)}
                          variant="reject"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campaigns */}
              {data!.campaigns.length > 0 && (
                <div>
                  <GroupLabel label="Campaigns" />
                  {data!.campaigns.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                      <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{c.title}</span>
                        <StatusPill status={c.status} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.status === "pending_review" && (
                          <>
                            <ActionBtn icon={<Check className="h-3 w-3" />} label="Approve" onClick={() => approveCampaign(c.id, c.title)} variant="approve" />
                            <ActionBtn icon={<X className="h-3 w-3" />} label="Reject" onClick={() => rejectCampaignToDraft(c.id, c.title)} variant="reject" />
                          </>
                        )}
                        <ActionBtn icon={<ChevronRight className="h-3 w-3" />} label="View" onClick={() => { navigate(`/campaigns/${c.slug ?? c.id}`); onClose(); }} variant="nav" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Organizations */}
              {data!.organizations.length > 0 && (
                <div>
                  <GroupLabel label="Organizations" />
                  {data!.organizations.map((o) => (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{o.name}</span>
                        <StatusPill status={o.status} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {o.status === "pending" && (
                          <>
                            <ActionBtn icon={<Check className="h-3 w-3" />} label="Verify" onClick={() => verifyOrg(o.id, o.name)} variant="approve" />
                            <ActionBtn icon={<X className="h-3 w-3" />} label="Reject" onClick={() => rejectOrg(o.id, o.name)} variant="reject" />
                          </>
                        )}
                        <ActionBtn icon={<ChevronRight className="h-3 w-3" />} label="View" onClick={() => { navigate(`/organizations/${o.slug ?? o.id}`); onClose(); }} variant="nav" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Users */}
              {data!.users.length > 0 && (
                <div>
                  <GroupLabel label="Users" />
                  {data!.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{u.username}</span>
                        <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                        <div className="flex gap-1.5 mt-0.5">
                          {u.isverified && <span className="text-[10px] text-green-600 font-medium">verified</span>}
                          {u.user_type === UserType.admin && <span className="text-[10px] text-accent font-medium">admin</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {u.user_type !== UserType.admin ? (
                          <ActionBtn icon={<ShieldCheck className="h-3 w-3" />} label="Make admin" onClick={() => makeAdmin(u.id, u.username)} variant="approve" />
                        ) : (
                          <ActionBtn icon={<ShieldX className="h-3 w-3" />} label="Remove admin" onClick={() => removeAdmin(u.id, u.username)} variant="reject" />
                        )}
                        <ActionBtn icon={<ChevronRight className="h-3 w-3" />} label="Profile" onClick={() => { navigate(`/users/${u.username}`); onClose(); }} variant="nav" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!q && (
            <div className="px-4 py-3 text-xs text-muted-foreground border-t border-line mt-1">
              Type to search users, campaigns, orgs, or pending verifications
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-4 py-2 flex items-center gap-5 text-[11px] text-muted-foreground bg-muted/20">
          <span>↵ navigate</span>
          <span className="text-green-600">✓ approve</span>
          <span className="text-destructive">✗ reject</span>
          <span className="ml-auto">esc to close</span>
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
  );
}

function ActionBtn({
  icon, label, onClick, variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "approve" | "reject" | "nav";
}) {
  const cls = {
    approve: "border-green-600/40 text-green-600 hover:bg-green-600/10",
    reject: "border-destructive/40 text-destructive hover:bg-destructive/10",
    nav: "border-line text-muted-foreground hover:text-ink hover:border-ink",
  }[variant];

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${cls}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pending_review: "text-yellow-600",
    pending: "text-yellow-600",
    active: "text-green-600",
    verified: "text-green-600",
    draft: "text-muted-foreground",
    rejected: "text-destructive",
    funded: "text-blue-600",
    cancelled: "text-muted-foreground",
  };
  return (
    <span className={`ml-2 text-[10px] font-medium ${colorMap[status] ?? "text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
