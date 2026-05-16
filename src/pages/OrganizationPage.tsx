import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  ShieldCheck,
  Plus,
  X,
  ExternalLink,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrganization,
  useMe,
  useAddOrgMember,
  useRemoveOrgMember,
  useAddPortfolioItem,
  useDeleteOrgPortfolioItem,
  uploadOrgAvatar,
  uploadOrgIdentityProof,
  qk,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { OrgRole, OrgPortfolioItemCreatePayload } from "@/lib/types";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  member: "Member",
  collaborator: "Collaborator",
};

const ORG_TYPE_LABELS: Record<string, string> = {
  personal: "Personal",
  studio: "Studio",
  agency: "Agency",
  brand: "Brand",
  ngo: "NGO",
  other: "Other",
};

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const orgId = Number(id);
  const org = useOrganization(orgId);
  const me = useMe();
  const qc = useQueryClient();

  const isOwner = org.data?.owner_id === me.data?.user_id;

  if (org.isLoading) {
    return (
      <div className="container-edge py-16 md:py-20 space-y-6">
        <Skeleton className="h-24 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!org.data) {
    return (
      <div className="container-edge py-16 md:py-20 text-center">
        <div className="italic-display text-2xl">Organization not found.</div>
      </div>
    );
  }

  const o = org.data;

  return (
    <div className="container-edge py-16 md:py-20">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <OrgAvatar orgId={orgId} avatarUrl={o.avatar_url} name={o.name} isOwner={isOwner} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl md:text-4xl font-semibold">{o.name}</h1>
              {o.status === "verified" && (
                <ShieldCheck className="h-5 w-5 text-green-600" aria-label="Verified organization" />
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
              <span>{ORG_TYPE_LABELS[o.org_type] ?? o.org_type}</span>
              {o.website && (
                <a
                  href={o.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-ink transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {o.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            {o.status !== "verified" && (
              <Badge
                variant={o.status === "pending" ? "default" : "outline"}
                className="mt-2"
              >
                {o.status === "pending" ? "Pending verification" : "Not verified"}
              </Badge>
            )}
          </div>
        </div>

        {isOwner && (
          <IdentityProofUpload orgId={orgId} hasProof={false} />
        )}
      </div>

      {o.description && (
        <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">{o.description}</p>
      )}

      {o.rejection_note && (
        <div className="border border-destructive/40 px-5 py-4 text-sm mb-10 max-w-2xl">
          <span className="font-semibold text-destructive">Rejected:</span>{" "}
          {o.rejection_note}
        </div>
      )}

      {/* ── Members ── */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">Team</h2>
          {isOwner && <AddMemberForm orgId={orgId} />}
        </div>

        <div className="border border-line divide-y divide-line">
          {o.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{m.name ?? m.email}</span>
                  {!m.claimed && (
                    <Badge variant="outline" className="text-xs">Invite pending</Badge>
                  )}
                </div>
                {m.name && (
                  <div className="text-xs text-muted-foreground mt-0.5">{m.email}</div>
                )}
                {m.title && (
                  <div className="text-xs text-muted-foreground">{m.title}</div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</span>
                {isOwner && m.role !== "owner" && (
                  <RemoveMemberButton orgId={orgId} memberId={m.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portfolio ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">Portfolio</h2>
          {isOwner && <AddPortfolioForm orgId={orgId} />}
        </div>

        {o.portfolio.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center text-muted-foreground text-sm">
            No portfolio items yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {o.portfolio.map((item) => (
              <PortfolioCard key={item.id} orgId={orgId} itemId={item.id} isOwner={isOwner}
                title={item.title} description={item.description}
                link={item.link} tags={item.tags}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function OrgAvatar({
  orgId, avatarUrl, name, isOwner,
}: { orgId: number; avatarUrl: string | null; name: string; isOwner: boolean }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadOrgAvatar(orgId, file);
      qc.invalidateQueries({ queryKey: qk.organization(orgId) });
      toast.success("Avatar updated.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      {isOwner && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-ink text-paper flex items-center justify-center hover:opacity-80 transition-opacity"
            title="Change avatar"
          >
            <Upload className="h-3 w-3" />
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}

function IdentityProofUpload({ orgId, hasProof }: { orgId: number; hasProof: boolean }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadOrgIdentityProof(orgId, file);
      qc.invalidateQueries({ queryKey: qk.organization(orgId) });
      toast.success("Identity document uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-1.5"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Uploading..." : hasProof ? "Replace identity proof" : "Upload identity proof"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        className="hidden"
        onChange={handleFile}
      />
      <p className="text-xs text-muted-foreground mt-1">Required for verification</p>
    </div>
  );
}

function AddMemberForm({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const add = useAddOrgMember(orgId);

  async function handleAdd() {
    if (!email.trim()) return;
    try {
      await add.mutateAsync({ email: email.trim(), name: name || undefined, title: title || undefined, role });
      toast.success("Member added.");
      setEmail(""); setName(""); setTitle(""); setOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add member
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-line p-4 w-72">
      <input
        className="border border-line px-3 py-2 text-sm bg-transparent w-full"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border border-line px-3 py-2 text-sm bg-transparent w-full"
        placeholder="Display name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border border-line px-3 py-2 text-sm bg-transparent w-full"
        placeholder="Title / role description"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        className="border border-line px-3 py-2 text-sm bg-transparent w-full"
        value={role}
        onChange={(e) => setRole(e.target.value as OrgRole)}
      >
        <option value="member">Member</option>
        <option value="collaborator">Collaborator</option>
      </select>
      <div className="flex gap-2 mt-1">
        <Button size="sm" onClick={handleAdd} disabled={add.isPending || !email.trim()}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function RemoveMemberButton({ orgId, memberId }: { orgId: number; memberId: number }) {
  const remove = useRemoveOrgMember(orgId);
  async function handleRemove() {
    try {
      await remove.mutateAsync(memberId);
      toast.success("Member removed.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }
  return (
    <button
      onClick={handleRemove}
      disabled={remove.isPending}
      className="text-muted-foreground hover:text-destructive transition-colors"
      title="Remove member"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function AddPortfolioForm({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OrgPortfolioItemCreatePayload>({ title: "" });
  const add = useAddPortfolioItem(orgId);

  async function handleAdd() {
    if (!form.title.trim()) return;
    try {
      await add.mutateAsync(form);
      toast.success("Portfolio item added.");
      setForm({ title: "" });
      setOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add item
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-line p-4 w-80">
      <input
        className="border border-line px-3 py-2 text-sm bg-transparent w-full"
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <textarea
        className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-20"
        placeholder="Description (optional)"
        value={form.description ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />
      <input
        className="border border-line px-3 py-2 text-sm bg-transparent w-full"
        placeholder="Link (optional)"
        value={form.link ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
      />
      <div className="flex gap-2 mt-1">
        <Button size="sm" onClick={handleAdd} disabled={add.isPending || !form.title.trim()}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function PortfolioCard({
  orgId, itemId, isOwner, title, description, link, tags,
}: {
  orgId: number; itemId: number; isOwner: boolean;
  title: string; description: string | null; link: string | null; tags: string[] | null;
}) {
  const del = useDeleteOrgPortfolioItem(orgId);

  async function handleDelete() {
    try {
      await del.mutateAsync(itemId);
      toast.success("Item removed.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="border border-line p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm">{title}</div>
        <div className="flex items-center gap-1 shrink-0">
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-ink transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={del.isPending}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((t, i) => (
            <span key={i} className="text-xs border border-line px-2 py-0.5 text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
