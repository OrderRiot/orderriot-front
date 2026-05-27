import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Award,
  Building2,
  ExternalLink,
  Globe,
  Linkedin,
  MapPin,
  Plus,
  ShieldCheck,
  ShieldX,
  Clock,
  Upload,
  X,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  FileText,
  Pencil,
  Wrench,
  Users,
  Tag,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  useOrganization,
  useMe,
  useAddOrgMember,
  useRemoveOrgMember,
  useUpdateOrgMember,
  useAddPortfolioItem,
  useDeleteOrgPortfolioItem,
  useAddOrgCertification,
  useDeleteOrgCertification,
  useAddOrgOffice,
  useDeleteOrgOffice,
  useAddOrgEquipment,
  useDeleteOrgEquipment,
  useAddOrgClient,
  useDeleteOrgClient,
  useUserSearch,
  uploadOrgAvatar,
  uploadOrgIdentityProof,
  uploadOrgCertFile,
  uploadEquipmentImages,
  uploadClientLogo,
  qk,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type {
  CertificationType,
  MemberType,
  OrgCertificationCreatePayload,
  OrgClient,
  OrgClientCreatePayload,
  OrgEquipment,
  OrgEquipmentCreatePayload,
  OrgMember,
  OrgOfficeCreatePayload,
  OrgPortfolioItemCreatePayload,
  OrgRole,
  UserSearchResult,
} from "@/lib/types";

// ── Constants ────────────────────────────────────────────────────

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  member: "Member",
  collaborator: "Collaborator",
};

const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  permanent: "Permanent",
  freelancer: "Freelancer",
  contract: "Contract",
};

const MEMBER_TYPE_COLOR: Record<MemberType, string> = {
  permanent: "bg-green-50 text-green-700 border-green-200",
  freelancer: "bg-blue-50 text-blue-700 border-blue-200",
  contract: "bg-amber-50 text-amber-700 border-amber-200",
};

const ORG_TYPE_LABELS: Record<string, string> = {
  marketing:     "Marketing",
  investors:     "Investors",
  incubators:    "Incubators",
  manufacturers: "Manufacturers",
  av_production: "A/V Production",
  consultancy:   "Consultancy",
  software:      "Software Support",
  other:         "Other",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  solo:        "Solo",
  pvt_ltd:     "Pvt. Ltd.",
  llc:         "LLC",
  partnership: "Partnership",
  ngo:         "NGO",
  trust:       "Trust",
  other:       "Other",
};

const CERT_TYPE_LABELS: Record<CertificationType, string> = {
  ZED: "ZED",
  ISO9001: "ISO 9001",
  ISO14001: "ISO 14001",
  ISO45001: "ISO 45001",
  ISO27001: "ISO 27001",
  MSME: "MSME",
  FSSAI: "FSSAI",
  BIS: "BIS",
  other: "Other",
};

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  facebook: Facebook,
};

// ── Page ─────────────────────────────────────────────────────────

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const org = useOrganization(slug ?? "");
  const me = useMe();

  const isOwner = org.data?.owner_id === me.data?.user_id;

  if (org.isLoading) {
    return (
      <div className="container-edge py-16 md:py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr_18rem] gap-8">
          <div className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-36 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-20" />
          </div>
        </div>
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

  // Group members by type
  const membersByType = o.members.reduce<Record<MemberType, OrgMember[]>>(
    (acc, m) => {
      const t = m.member_type ?? "permanent";
      acc[t] = [...(acc[t] ?? []), m];
      return acc;
    },
    { permanent: [], freelancer: [], contract: [] },
  );

  return (
    <div className="container-edge py-16 md:py-20 max-w-7xl">
      {isOwner && o.status === "pending" && (
        <StatusBanner
          variant="warning"
          pulse
          icon={<Clock className="h-4 w-4 mt-0.5" />}
          title="Verification pending"
          description="Submitted for admin review. Once verified, you can run campaigns under this entity."
          className="mb-8"
        />
      )}
      {o.rejection_note && (
        <StatusBanner
          variant="error"
          icon={<ShieldX className="h-4 w-4 mt-0.5" />}
          title="Verification rejected"
          description={o.rejection_note}
          action={isOwner ? (
            <Button asChild size="sm" variant="outline">
              <a href="#identity-proof">Resubmit proof</a>
            </Button>
          ) : undefined}
          className="mb-8"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr_18rem] gap-8 lg:gap-10 items-start">

        {/* ── Left sidebar ── */}
        <aside className="space-y-7">
          {/* Avatar + identity */}
          <div className="flex flex-col items-center text-center gap-3">
            <OrgAvatar orgId={o.id} avatarUrl={o.avatar_url} ownerAvatarUrl={o.owner_avatar_url} name={o.name} isOwner={isOwner} />
            <div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <h1 className="font-display text-xl font-semibold">{o.name}</h1>
                {o.status === "verified" && (
                  <ShieldCheck className="h-4 w-4 text-green-600" aria-label="Verified" />
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {ORG_TYPE_LABELS[o.org_type] ?? o.org_type}
                {" · "}
                {ENTITY_TYPE_LABELS[o.entity_type] ?? o.entity_type}
              </div>
              {o.founded_year && (
                <div className="text-xs text-muted-foreground mt-0.5">Est. {o.founded_year}</div>
              )}
              {o.status === "pending" && (
                <Badge variant="default" className="mt-2 text-xs">Pending</Badge>
              )}
            </div>
          </div>

          {/* Website */}
          {o.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <a href={o.website} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors truncate">
                {o.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {/* Social links */}
          {o.social_links && Object.keys(o.social_links).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(o.social_links).map(([platform, url]) => {
                if (!url) return null;
                const Icon = SOCIAL_ICONS[platform.toLowerCase()];
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink transition-colors border border-line px-2 py-1"
                  >
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                    <span className="capitalize">{platform}</span>
                  </a>
                );
              })}
            </div>
          )}

          {/* Ecosystem / industry access */}
          {(o.ecosystem_access && o.ecosystem_access.length > 0) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ecosystem</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {o.ecosystem_access.map((tag, i) => (
                  <span key={i} className="text-xs border border-line px-2 py-0.5 text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Identity proof */}
          {isOwner && (
            <div id="identity-proof">
              <IdentityProofUpload orgId={o.id} hasProof={false} />
            </div>
          )}

          {/* Offices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Locations</span>
              </div>
              {isOwner && <AddOfficeModal orgId={o.id} />}
            </div>
            {o.offices.length === 0 ? (
              <p className="text-xs text-muted-foreground">No offices listed.</p>
            ) : (
              <div className="space-y-3">
                {o.offices.map((office) => (
                  <OfficeCard key={office.id} orgId={o.id} office={office} isOwner={isOwner} />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="space-y-12 min-w-0">

          {/* About / History */}
          {(o.description || o.history) && (
            <section>
              {o.description && (
                <p className="text-muted-foreground leading-relaxed mb-5">{o.description}</p>
              )}
              {o.history && (
                <>
                  <h2 className="font-display text-lg font-semibold mb-3">Our Story</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-l-2 border-line pl-4">
                    {o.history}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Team by category */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team
              </h2>
              {isOwner && <AddMemberForm orgId={o.id} />}
            </div>

            {(["permanent", "freelancer", "contract"] as MemberType[]).map((type) => {
              const group = membersByType[type];
              if (group.length === 0) return null;
              return (
                <div key={type} className="mb-6">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 border mb-3 ${MEMBER_TYPE_COLOR[type]}`}>
                    {MEMBER_TYPE_LABELS[type]}
                    <span className="opacity-60">({group.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.map((m) => (
                      <MemberCard key={m.id} orgId={o.id} member={m} isOwner={isOwner} />
                    ))}
                  </div>
                </div>
              );
            })}

            {o.members.length === 0 && (
              <div className="border border-dashed border-line p-10 text-center text-muted-foreground text-sm">
                No team members added yet.
              </div>
            )}
          </section>

          {/* Equipment */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment &amp; Capabilities
              </h2>
              {isOwner && <AddEquipmentModal orgId={o.id} />}
            </div>
            {o.equipment.length === 0 ? (
              <div className="border border-dashed border-line p-10 text-center text-muted-foreground text-sm">
                No equipment listed.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {o.equipment.map((eq) => (
                  <EquipmentCard key={eq.id} orgId={o.id} eq={eq} isOwner={isOwner} />
                ))}
              </div>
            )}
          </section>

          {/* Portfolio */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Portfolio
              </h2>
              {isOwner && <AddPortfolioForm orgId={o.id} />}
            </div>
            {o.portfolio.length === 0 ? (
              <div className="border border-dashed border-line p-10 text-center text-muted-foreground text-sm">
                No portfolio items yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {o.portfolio.map((item) => (
                  <PortfolioCard
                    key={item.id}
                    orgId={o.id}
                    itemId={item.id}
                    isOwner={isOwner}
                    title={item.title}
                    description={item.description}
                    link={item.link}
                    tags={item.tags}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Existing clients */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold">Clients</h2>
              {isOwner && <AddClientModal orgId={o.id} />}
            </div>
            {o.clients.length === 0 ? (
              <div className="border border-dashed border-line p-10 text-center text-muted-foreground text-sm">
                No clients listed yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {o.clients.map((client) => (
                  <ClientCard key={client.id} orgId={o.id} client={client} isOwner={isOwner} />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* ── Right sidebar ── */}
        <aside className="space-y-8">
          {/* Trust chain */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trust</span>
            </div>
            <div className="border border-line p-3 space-y-2 text-sm">
              <TrustRow label="Verification" value={o.status === "verified" ? "Verified" : o.status === "pending" ? "Pending" : "Not verified"} ok={o.status === "verified"} />
              <TrustRow label="Identity proof" value={o.status !== "pending" ? "Submitted" : "Not uploaded"} ok={o.status !== "pending"} />
              <TrustRow label="Certifications" value={`${o.certifications.length} added`} ok={o.certifications.length > 0} />
              <TrustRow label="Team size" value={`${o.members.length} member${o.members.length !== 1 ? "s" : ""}`} ok={o.members.length > 1} />
              <TrustRow label="Clients listed" value={`${o.clients.length}`} ok={o.clients.length > 0} />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Certifications</span>
              </div>
              {isOwner && <AddCertModal orgId={o.id} />}
            </div>
            {o.certifications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No certifications added.</p>
            ) : (
              <div className="space-y-3">
                {o.certifications.map((cert) => (
                  <CertCard key={cert.id} orgId={o.id} cert={cert} isOwner={isOwner} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Trust row ────────────────────────────────────────────────────

function TrustRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-xs font-medium ${ok ? "text-green-600" : "text-muted-foreground"}`}>{value}</span>
    </div>
  );
}

// ── Org avatar ───────────────────────────────────────────────────

function OrgAvatar({
  orgId, avatarUrl, ownerAvatarUrl, name, isOwner,
}: { orgId: number; avatarUrl: string | null; ownerAvatarUrl: string | null; name: string; isOwner: boolean }) {
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

  const display = avatarUrl ?? ownerAvatarUrl;

  return (
    <div className="relative shrink-0">
      {display ? (
        <img src={display} alt="" className="h-24 w-24 rounded-full object-cover" />
      ) : (
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
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

// ── Identity proof upload ────────────────────────────────────────

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
        className="gap-1.5 w-full text-xs"
      >
        <Upload className="h-3 w-3" />
        {uploading ? "Uploading..." : hasProof ? "Replace identity proof" : "Upload identity proof"}
      </Button>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground mt-1">Required for verification</p>
    </div>
  );
}

// ── Member card ──────────────────────────────────────────────────

function MemberCard({ orgId, member: m, isOwner }: { orgId: number; member: OrgMember; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const remove = useRemoveOrgMember(orgId);
  const update = useUpdateOrgMember(orgId);
  const [form, setForm] = useState({
    name: m.name ?? "",
    title: m.title ?? "",
    bio: m.bio ?? "",
    linkedin_url: m.linkedin_url ?? "",
    member_type: m.member_type as MemberType,
  });

  async function handleSave() {
    try {
      await update.mutateAsync({
        memberId: m.id,
        payload: {
          name: form.name || null,
          title: form.title || null,
          bio: form.bio || null,
          linkedin_url: form.linkedin_url || null,
          member_type: form.member_type,
        },
      });
      toast.success("Member updated.");
      setEditing(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleRemove() {
    try {
      await remove.mutateAsync(m.id);
      toast.success("Member removed.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (editing) {
    return (
      <div className="border border-line p-4 space-y-2">
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Display name"
          value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Title"
          value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-16" placeholder="Short bio"
          value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="LinkedIn URL"
          value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} />
        <select className="border border-line px-3 py-2 text-sm bg-transparent w-full"
          value={form.member_type} onChange={(e) => setForm((f) => ({ ...f, member_type: e.target.value as MemberType }))}>
          <option value="permanent">Permanent</option>
          <option value="freelancer">Freelancer</option>
          <option value="contract">Contract</option>
        </select>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-line p-4 flex gap-3">
      <div className="shrink-0">
        {m.avatar_url ? (
          <img src={m.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
            {(m.name ?? m.email).slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm">{m.name ?? m.email}</span>
              {!m.claimed && (
                <Badge variant="outline" className="text-xs py-0">Invite pending</Badge>
              )}
            </div>
            {m.name && <div className="text-xs text-muted-foreground">{m.email}</div>}
            {m.title && <div className="text-xs text-muted-foreground">{m.title}</div>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</span>
            {isOwner && (
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-ink transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {isOwner && m.role !== "owner" && (
              <button onClick={handleRemove} disabled={remove.isPending} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {m.bio && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{m.bio}</p>}
        {m.linkedin_url && (
          <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink mt-1.5 transition-colors">
            <Linkedin className="h-3 w-3" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

// ── Add member form (with user search autocomplete) ───────────────

type PendingMember = {
  user: UserSearchResult | null;
  email: string;
  name: string;
  title: string;
  role: OrgRole;
  memberType: MemberType;
};

function AddMemberForm({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [memberType, setMemberType] = useState<MemberType>("permanent");
  const search = useUserSearch(query);
  const add = useAddOrgMember(orgId);

  function selectUser(u: UserSearchResult) {
    if (pending.some((p) => p.email === u.email)) return;
    setPending((prev) => [...prev, { user: u, email: u.email, name: u.username, title, role, memberType }]);
    setQuery("");
    setShowDropdown(false);
  }

  function removePending(email: string) {
    setPending((prev) => prev.filter((p) => p.email !== email));
  }

  async function handleAddAll() {
    if (pending.length === 0) return;
    let failed = 0;
    for (const m of pending) {
      try {
        await add.mutateAsync({ email: m.email, name: m.name || undefined, title: m.title || undefined, role: m.role, member_type: m.memberType });
      } catch {
        failed++;
      }
    }
    if (failed === 0) toast.success(`${pending.length} member${pending.length > 1 ? "s" : ""} added.`);
    else toast.error(`${failed} failed to add.`);
    setPending([]);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add members
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="bg-paper border border-line p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-semibold text-lg">Add team members</div>

        {/* Search input */}
        <div className="relative">
          <input
            className="border border-line px-3 py-2 text-sm bg-transparent w-full focus:outline-none focus:border-ink"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
          />
          {showDropdown && query.length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-paper border border-line border-t-0 max-h-52 overflow-y-auto">
              {search.isLoading && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
              )}
              {!search.isLoading && search.data?.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No users found</div>
              )}
              {search.data?.map((u) => {
                const already = pending.some((p) => p.email === u.email);
                return (
                  <button
                    key={u.user_id}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors ${already ? "opacity-40 cursor-not-allowed" : ""}`}
                    onMouseDown={() => !already && selectUser(u)}
                    disabled={already}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">{u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    {already && <span className="ml-auto text-xs text-muted-foreground">Added</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Default role + type for batch */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Role</label>
            <select className="border border-line px-3 py-2 text-sm bg-transparent w-full"
              value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
              <option value="member">Member</option>
              <option value="collaborator">Collaborator</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Type</label>
            <select className="border border-line px-3 py-2 text-sm bg-transparent w-full"
              value={memberType} onChange={(e) => setMemberType(e.target.value as MemberType)}>
              <option value="permanent">Permanent</option>
              <option value="freelancer">Freelancer</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Title (applies to all selected)"
          value={title} onChange={(e) => setTitle(e.target.value)} />

        {/* Selected queue */}
        {pending.length > 0 && (
          <div className="border border-line divide-y divide-line max-h-40 overflow-y-auto">
            {pending.map((m) => (
              <div key={m.email} className="flex items-center justify-between px-3 py-2 gap-3">
                <div>
                  <div className="text-sm font-medium">{m.name || m.email}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
                <button onClick={() => removePending(m.email)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAddAll} disabled={add.isPending || pending.length === 0}>
            {add.isPending ? "Adding..." : `Add ${pending.length || ""} member${pending.length !== 1 ? "s" : ""}`}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Equipment ────────────────────────────────────────────────────

function AddEquipmentModal({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OrgEquipmentCreatePayload>({ name: "" });
  const add = useAddOrgEquipment(orgId);

  async function handleAdd() {
    if (!form.name.trim()) return;
    try {
      await add.mutateAsync(form);
      toast.success("Equipment added.");
      setForm({ name: "" });
      setOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add equipment
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="bg-paper border border-line p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-semibold text-lg">Add Equipment</div>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Equipment name"
          value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Make / brand"
            value={form.make ?? ""} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} />
          <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Model no."
            value={form.model_number ?? ""} onChange={(e) => setForm((f) => ({ ...f, model_number: e.target.value }))} />
        </div>
        <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-16" placeholder="Description"
          value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-16" placeholder="Capabilities (what it can do)"
          value={form.capabilities ?? ""} onChange={(e) => setForm((f) => ({ ...f, capabilities: e.target.value }))} />
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAdd} disabled={add.isPending || !form.name.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function EquipmentCard({ orgId, eq, isOwner }: { orgId: number; eq: OrgEquipment; isOwner: boolean }) {
  const del = useDeleteOrgEquipment(orgId);
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleDelete() {
    try {
      await del.mutateAsync(eq.id);
      toast.success("Equipment removed.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      await uploadEquipmentImages(orgId, eq.id, files);
      qc.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Images uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-line p-4 space-y-3">
      {/* Image gallery */}
      {eq.image_urls && eq.image_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {eq.image_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="h-24 w-24 object-cover shrink-0 border border-line" />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{eq.name}</div>
          {(eq.make || eq.model_number) && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {[eq.make, eq.model_number].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        {isOwner && (
          <button onClick={handleDelete} disabled={del.isPending} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {eq.description && <p className="text-xs text-muted-foreground">{eq.description}</p>}

      {eq.capabilities && (
        <div className="border-t border-line pt-2">
          <div className="text-xs font-medium mb-1">Capabilities</div>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{eq.capabilities}</p>
        </div>
      )}

      {isOwner && (
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-ink transition-colors"
          >
            <Upload className="h-3 w-3" />
            {uploading ? "Uploading..." : "Add photos"}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
        </div>
      )}
    </div>
  );
}

// ── Portfolio ────────────────────────────────────────────────────

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
      <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Title"
        value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-20" placeholder="Description"
        value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Link (optional)"
        value={form.link ?? ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
      <div className="flex gap-2 mt-1">
        <Button size="sm" onClick={handleAdd} disabled={add.isPending || !form.title.trim()}>Add</Button>
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
            <button onClick={() => del.mutateAsync(itemId).then(() => toast.success("Removed.")).catch((e) => toast.error(apiError(e)))}
              disabled={del.isPending} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((t, i) => (
            <span key={i} className="text-xs border border-line px-2 py-0.5 text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Clients ──────────────────────────────────────────────────────

function AddClientModal({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OrgClientCreatePayload>({ name: "" });
  const add = useAddOrgClient(orgId);

  async function handleAdd() {
    if (!form.name.trim()) return;
    try {
      await add.mutateAsync(form);
      toast.success("Client added.");
      setForm({ name: "" });
      setOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add client
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="bg-paper border border-line p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-semibold text-lg">Add Client</div>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Client / company name"
          value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Industry (e.g. FMCG, Automotive)"
          value={form.industry ?? ""} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
        <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-16" placeholder="Brief description of work done"
          value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Website (optional)"
          value={form.website ?? ""} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Years worked (e.g. 2021–2023)"
          value={form.years_worked ?? ""} onChange={(e) => setForm((f) => ({ ...f, years_worked: e.target.value }))} />
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAdd} disabled={add.isPending || !form.name.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function ClientCard({ orgId, client, isOwner }: { orgId: number; client: OrgClient; isOwner: boolean }) {
  const del = useDeleteOrgClient(orgId);
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadClientLogo(orgId, client.id, file);
      qc.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Logo uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-line p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {client.logo_url ? (
            <img src={client.logo_url} alt="" className="h-10 w-10 object-contain border border-line p-1" />
          ) : isOwner ? (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="h-10 w-10 border border-dashed border-line flex items-center justify-center text-muted-foreground hover:text-ink transition-colors"
              title="Upload logo"
            >
              <Upload className="h-4 w-4" />
            </button>
          ) : null}
          <div>
            <div className="font-medium text-sm">{client.name}</div>
            {client.industry && <div className="text-xs text-muted-foreground">{client.industry}</div>}
          </div>
        </div>
        {isOwner && (
          <button onClick={() => del.mutateAsync(client.id).then(() => toast.success("Removed.")).catch((e) => toast.error(apiError(e)))}
            disabled={del.isPending} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {client.description && <p className="text-xs text-muted-foreground line-clamp-2">{client.description}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        {client.years_worked && (
          <span className="text-xs text-muted-foreground">{client.years_worked}</span>
        )}
        {client.website && (
          <a href={client.website} target="_blank" rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-ink transition-colors">
            <Globe className="h-3 w-3" />
            Website
          </a>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
    </div>
  );
}

// ── Certifications ───────────────────────────────────────────────

function AddCertModal({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OrgCertificationCreatePayload>({ name: "", cert_type: "other" });
  const add = useAddOrgCertification(orgId);

  async function handleAdd() {
    if (!form.name.trim()) return;
    try {
      await add.mutateAsync(form);
      toast.success("Certification added.");
      setForm({ name: "", cert_type: "other" });
      setOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-ink transition-colors" title="Add certification">
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="bg-paper border border-line p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-semibold text-lg">Add Certification</div>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Name (e.g. ISO 9001:2015)"
          value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <select className="border border-line px-3 py-2 text-sm bg-transparent w-full"
          value={form.cert_type} onChange={(e) => setForm((f) => ({ ...f, cert_type: e.target.value as CertificationType }))}>
          {Object.entries(CERT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Issuing authority"
          value={form.issuer ?? ""} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Certificate number"
          value={form.cert_number ?? ""} onChange={(e) => setForm((f) => ({ ...f, cert_number: e.target.value }))} />
        <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-14" placeholder="Description"
          value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Issued</label>
            <input type="date" className="border border-line px-3 py-2 text-sm bg-transparent w-full"
              value={form.issued_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, issued_date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Expires</label>
            <input type="date" className="border border-line px-3 py-2 text-sm bg-transparent w-full"
              value={form.expiry_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAdd} disabled={add.isPending || !form.name.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function CertCard({
  orgId, cert, isOwner,
}: {
  orgId: number;
  cert: { id: number; name: string; cert_type: CertificationType; issuer: string | null; cert_number: string | null; description: string | null; file_url: string | null; issued_date: string | null; expiry_date: string | null };
  isOwner: boolean;
}) {
  const del = useDeleteOrgCertification(orgId);
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadOrgCertFile(orgId, cert.id, file);
      qc.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Certificate file uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();

  return (
    <div className="border border-line p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div>
            <div className="text-sm font-medium leading-tight">{cert.name}</div>
            <div className="text-xs text-muted-foreground">{CERT_TYPE_LABELS[cert.cert_type]}</div>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => del.mutateAsync(cert.id).then(() => toast.success("Removed.")).catch((e) => toast.error(apiError(e)))}
            disabled={del.isPending} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {cert.issuer && <div className="text-xs text-muted-foreground">Issued by: {cert.issuer}</div>}
      {cert.cert_number && <div className="text-xs text-muted-foreground">No: {cert.cert_number}</div>}
      {cert.description && <p className="text-xs text-muted-foreground line-clamp-2">{cert.description}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        {cert.issued_date && (
          <span className="text-xs text-muted-foreground">
            {new Date(cert.issued_date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
          </span>
        )}
        {cert.expiry_date && (
          <span className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
            {isExpired ? "Expired" : "Expires"} {new Date(cert.expiry_date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
          </span>
        )}
        {cert.file_url && (
          <a href={cert.file_url} target="_blank" rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-ink transition-colors">
            <FileText className="h-3 w-3" />
            View
          </a>
        )}
        {isOwner && (
          <>
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-ink transition-colors">
              <Upload className="h-3 w-3" />
              {uploading ? "Uploading..." : cert.file_url ? "Replace" : "Upload file"}
            </button>
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={handleFileUpload} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Offices ──────────────────────────────────────────────────────

function AddOfficeModal({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OrgOfficeCreatePayload>({ name: "", country: "India" });
  const add = useAddOrgOffice(orgId);

  async function handleAdd() {
    if (!form.name.trim()) return;
    try {
      await add.mutateAsync(form);
      toast.success("Office added.");
      setForm({ name: "", country: "India" });
      setOpen(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-ink transition-colors" title="Add office">
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="bg-paper border border-line p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-semibold text-lg">Add Office</div>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Office name"
          value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Address"
          value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="City"
            value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="State"
            value={form.state ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
        </div>
        <input className="border border-line px-3 py-2 text-sm bg-transparent w-full" placeholder="Country"
          value={form.country ?? "India"} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
        <textarea className="border border-line px-3 py-2 text-sm bg-transparent w-full resize-none h-14" placeholder="Description"
          value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_headquarters ?? false}
            onChange={(e) => setForm((f) => ({ ...f, is_headquarters: e.target.checked }))} />
          This is the headquarters
        </label>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAdd} disabled={add.isPending || !form.name.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function OfficeCard({
  orgId, office, isOwner,
}: {
  orgId: number;
  office: { id: number; name: string; address: string | null; city: string | null; state: string | null; country: string | null; description: string | null; is_headquarters: boolean };
  isOwner: boolean;
}) {
  const del = useDeleteOrgOffice(orgId);
  const location = [office.city, office.state, office.country].filter(Boolean).join(", ");

  return (
    <div className="border border-line p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium leading-tight">
            {office.name}
            {office.is_headquarters && <span className="ml-1.5 text-xs text-muted-foreground">(HQ)</span>}
          </div>
          {location && <div className="text-xs text-muted-foreground">{location}</div>}
        </div>
        {isOwner && (
          <button onClick={() => del.mutateAsync(office.id).then(() => toast.success("Removed.")).catch((e) => toast.error(apiError(e)))}
            disabled={del.isPending} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {office.address && <p className="text-xs text-muted-foreground">{office.address}</p>}
      {office.description && <p className="text-xs text-muted-foreground line-clamp-2">{office.description}</p>}
    </div>
  );
}
