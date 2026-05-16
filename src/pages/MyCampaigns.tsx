import { Link } from "react-router-dom";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/campaign/ProgressBar";
import { useMyCampaigns } from "@/lib/queries";
import { formatMoney, pct } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const statusColor: Record<string, "default" | "solid" | "muted" | "outline"> = {
  draft: "muted",
  pending_review: "default",
  active: "solid",
  funded: "default",
  failed: "outline",
  cancelled: "outline",
};

export default function MyCampaigns() {
  const list = useMyCampaigns();

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-y-4 mb-12">
        <div>
          <div className="editorial-index">— Yours</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            My <span className="italic-display">campaigns</span>.
          </h1>
        </div>
        <Button asChild>
          <Link to="/create">Start a new one</Link>
        </Button>
      </div>

      {list.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {list.data && list.data.length === 0 && (
        <div className="border border-line p-16 text-center">
          <div className="italic-display text-3xl">No campaigns yet.</div>
          <p className="text-muted-foreground mt-2">
            Start something. We'll be here when you're ready.
          </p>
          <Button asChild className="mt-6">
            <Link to="/create">Create campaign</Link>
          </Button>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <ul className="border-y border-line divide-y divide-line">
          {list.data.map((c, i) => {
            const isRejected = c.status === "draft" && !!c.rejection_note;
            const target = c.status === "draft"
              ? `/create/${c.camp_id}`
              : `/campaigns/${c.camp_id}`;
            const percent = pct(c.current_amount, c.goal_amount);
            return (
              <li key={c.camp_id} className="border-b border-line last:border-b-0">
                <Link
                  to={target}
                  className="grid grid-cols-12 items-center gap-4 py-6 group"
                >
                  <span className="col-span-1 editorial-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="col-span-11 md:col-span-6">
                    <div className="font-display text-2xl leading-tight">{c.title}</div>
                    {c.subtitle && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {c.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="col-span-6 md:col-span-2 tnum">
                    <ProgressBar value={percent} />
                    <div className="text-xs mt-2 flex justify-between">
                      <span>{percent}%</span>
                      <span className="text-muted-foreground">
                        {formatMoney(c.current_amount, { compact: true })} /{" "}
                        {formatMoney(c.goal_amount, { compact: true })}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-2 flex flex-col gap-1">
                    {isRejected
                      ? <Badge variant="outline" className="text-destructive border-destructive/40">Revision needed</Badge>
                      : <Badge variant={statusColor[c.status] ?? "outline"}>{c.status.replace("_", " ")}</Badge>
                    }
                  </div>
                  <div className="col-span-2 md:col-span-1 text-right">
                    <ArrowUpRight className="inline h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </Link>
                {isRejected && c.rejection_note && (
                  <div className="ml-[calc(1/12*100%+1rem)] pb-4 flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive/70" />
                    <span>{c.rejection_note}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
