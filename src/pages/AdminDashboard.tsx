import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCampaigns,
  useApproveCampaign,
  useRejectCampaign,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/lib/types";

const FILTERS: { label: string; value: CampaignStatus | undefined }[] = [
  { label: "Pending review", value: "pending_review" },
  { label: "All", value: undefined },
  { label: "Active", value: "active" },
  { label: "Funded", value: "funded" },
  { label: "Draft", value: "draft" },
];

export default function AdminDashboard() {
  const [filter, setFilter] = useState<CampaignStatus | undefined>("pending_review");
  const campaigns = useAdminCampaigns(filter);

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="mb-12">
        <div className="editorial-index">— Admin</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Campaign <span className="italic-display">review.</span>
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-10 border-b border-line pb-6">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 text-sm border transition-colors ${
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {campaigns.data && campaigns.data.length === 0 && (
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

  const busy = approve.isPending || reject.isPending;

  return (
    <li className="py-6 grid grid-cols-12 items-center gap-4">
      <span className="col-span-1 editorial-index">{String(index + 1).padStart(2, "0")}</span>

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

      {c.status === "pending_review" && (
        <div className="col-span-6 md:col-span-4 flex gap-2 justify-end">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={busy}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={busy}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}
    </li>
  );
}
