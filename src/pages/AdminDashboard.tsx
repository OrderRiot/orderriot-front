import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, FileText, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCampaigns,
  useApproveCampaign,
  useRejectCampaign,
  useAdminVerifications,
  useApproveVerification,
  useRejectVerification,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import type { Campaign, CampaignStatus, VerificationWithUser, VerificationStatus } from "@/lib/types";

type AdminSection = "verifications" | "campaigns";

const CAMPAIGN_FILTERS: { label: string; value: CampaignStatus | undefined }[] = [
  { label: "Pending review", value: "pending_review" },
  { label: "All", value: undefined },
  { label: "Active", value: "active" },
  { label: "Funded", value: "funded" },
  { label: "Draft", value: "draft" },
];

const VERIFICATION_FILTERS: { label: string; value: VerificationStatus | undefined }[] = [
  { label: "Pending", value: "pending" },
  { label: "All", value: undefined },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("verifications");

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="mb-12">
        <div className="editorial-index">— Admin</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Trust &amp; <span className="italic-display">review.</span>
        </h1>
      </div>

      {/* Section toggle */}
      <div className="flex gap-3 mb-10 border-b border-line pb-6">
        {(["verifications", "campaigns"] as AdminSection[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-5 py-2 text-sm font-medium border transition-colors capitalize ${
              section === s
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {s === "verifications" ? "User Verifications" : "Campaign Reviews"}
          </button>
        ))}
      </div>

      {section === "verifications" && <VerificationsSection />}
      {section === "campaigns" && <CampaignsSection />}
    </div>
  );
}

// ── Verifications ────────────────────────────────────────────────

function VerificationsSection() {
  const [filter, setFilter] = useState<VerificationStatus | undefined>("pending");
  const verifications = useAdminVerifications(filter);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {VERIFICATION_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 text-xs border transition-colors ${
              filter === f.value
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {verifications.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      )}

      {verifications.data?.length === 0 && (
        <div className="border border-dashed border-line p-16 text-center">
          <div className="italic-display text-2xl">Nothing here.</div>
        </div>
      )}

      {verifications.data && verifications.data.length > 0 && (
        <div className="space-y-4">
          {verifications.data.map((v) => (
            <VerificationRow key={v.id} req={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationRow({ req: v }: { req: VerificationWithUser }) {
  const approve = useApproveVerification(v.id);
  const reject = useRejectVerification(v.id);
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const busy = approve.isPending || reject.isPending;

  async function handleApprove() {
    try {
      await approve.mutateAsync();
      toast.success(`${v.username} verified.`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync(rejectNote || undefined);
      toast.success(`${v.username} rejected.`);
      setShowReject(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const statusColor: Record<string, string> = {
    pending: "default",
    approved: "outline",
    rejected: "outline",
  };

  return (
    <div className="border border-line p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {v.avatar_url ? (
            <img src={v.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-display font-semibold text-sm">
              {v.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold">{v.username}</div>
            <div className="text-sm text-muted-foreground">{v.email}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Submitted {new Date(v.created_at).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>
        <Badge variant={statusColor[v.status] as "default" | "outline"}>
          {v.status}
        </Badge>
      </div>

      {/* ID proof images */}
      <div className="mt-4 flex gap-3 flex-wrap">
        {v.id_proof_urls.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt={`ID proof ${i + 1}`}
              className="h-32 w-48 object-cover border border-line hover:opacity-80 transition-opacity"
            />
          </a>
        ))}
      </div>

      {v.admin_note && (
        <div className="mt-3 text-sm text-muted-foreground bg-muted/40 px-3 py-2 border-l-2 border-line">
          Note: {v.admin_note}
        </div>
      )}

      {v.status === "pending" && (
        <div className="mt-4 flex flex-col gap-3">
          {showReject ? (
            <div className="flex flex-col gap-2">
              <input
                className="border border-line px-3 py-2 text-sm w-full max-w-sm bg-transparent"
                placeholder="Rejection reason (optional)"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleReject} disabled={busy} className="gap-1.5">
                  <ShieldX className="h-3.5 w-3.5" />
                  Confirm reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApprove} disabled={busy} className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowReject(true)} disabled={busy} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Campaign reviews ─────────────────────────────────────────────

function CampaignsSection() {
  const [filter, setFilter] = useState<CampaignStatus | undefined>("pending_review");
  const campaigns = useAdminCampaigns(filter);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {CAMPAIGN_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 text-xs border transition-colors ${
              filter === f.value
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {campaigns.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      )}

      {campaigns.data?.length === 0 && (
        <div className="border border-dashed border-line p-16 text-center">
          <div className="italic-display text-2xl">Nothing here.</div>
        </div>
      )}

      {campaigns.data && campaigns.data.length > 0 && (
        <ul className="border-y border-line divide-y divide-line">
          {campaigns.data.map((c, i) => (
            <CampaignRow key={c.camp_id} campaign={c} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CampaignRow({ campaign: c, index }: { campaign: Campaign; index: number }) {
  const approve = useApproveCampaign(c.camp_id);
  const reject = useRejectCampaign(c.camp_id);
  const [showDocs, setShowDocs] = useState(false);
  const busy = approve.isPending || reject.isPending;
  const docs = c.documents ?? [];

  async function handleApprove() {
    try {
      await approve.mutateAsync();
      toast.success(`"${c.title}" approved and live.`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync();
      toast.success(`"${c.title}" sent back to draft.`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <li className="py-6">
      <div className="grid grid-cols-12 items-start gap-4">
        <span className="col-span-1 editorial-index pt-1">{String(index + 1).padStart(2, "0")}</span>

        <div className="col-span-12 md:col-span-5">
          <Link
            to={`/campaigns/${c.camp_id}`}
            className="font-display text-xl hover:underline underline-offset-4"
          >
            {c.title}
          </Link>
          {c.subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{c.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {c.category && <span>{c.category}</span>}
            {c.location && <span>{c.location}</span>}
            <span>Goal: {formatMoney(c.goal_amount)}</span>
            <span>Submitted: {new Date(c.creation_date).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        <div className="col-span-6 md:col-span-2">
          <Badge variant={c.status === "pending_review" ? "default" : "outline"}>
            {c.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="col-span-6 md:col-span-4 flex gap-2 justify-end flex-wrap">
          {docs.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDocs((p) => !p)}
              className="gap-1.5 text-muted-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              {docs.length} doc{docs.length !== 1 ? "s" : ""}
            </Button>
          )}
          {c.status === "pending_review" && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={busy} className="gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} disabled={busy} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Documents panel */}
      {showDocs && docs.length > 0 && (
        <div className="mt-4 ml-[calc(1/12*100%+1rem)] pl-4 border-l border-line">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Supporting documents
          </div>
          <div className="flex flex-col gap-1">
            {docs.map((url, i) => {
              const name = url.split("/").pop() ?? `Document ${i + 1}`;
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  {decodeURIComponent(name)}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
}
