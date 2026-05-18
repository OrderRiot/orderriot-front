import { Link } from "react-router-dom";
import { Plus, Lightbulb, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyIdeas } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import type { IdeaListItem, IdeaStatus } from "@/lib/types";

const statusVariant: Record<IdeaStatus, "default" | "outline" | "solid" | "muted"> = {
  draft: "muted",
  published: "default",
  converted: "solid",
};

const statusLabel: Record<IdeaStatus, string> = {
  draft: "Draft",
  published: "Live",
  converted: "Converted",
};

function IdeaRow({ idea }: { idea: IdeaListItem }) {
  return (
    <Link
      to={`/ideas/${idea.slug ?? idea.id}`}
      className="flex items-start justify-between gap-4 py-5 group border-b border-line last:border-0"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-lg font-semibold group-hover:underline underline-offset-4">
            {idea.title}
          </span>
          <Badge variant={statusVariant[idea.status]}>{statusLabel[idea.status]}</Badge>
        </div>
        {idea.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{idea.description}</p>
        )}
        <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs text-muted-foreground">
          {idea.category && <span>{idea.category}</span>}
          {idea.rough_goal != null && <span>~{formatMoney(idea.rough_goal)}</span>}
          <span>{idea.interest_count} interested</span>
          <span>{new Date(idea.created_at).toLocaleDateString("en-IN")}</span>
        </div>
        {idea.status === "converted" && idea.campaign_id && (
          <Link
            to={`/campaigns/${idea.campaign_slug ?? idea.campaign_id}`}
            className="text-xs text-accent hover:underline mt-1 inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            View campaign
          </Link>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink transition-colors shrink-0 mt-1" />
    </Link>
  );
}

export default function MyIdeas() {
  const list = useMyIdeas();

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-y-4 mb-12">
        <div>
          <div className="editorial-index">— Yours</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            My <span className="italic-display">ideas</span>.
          </h1>
        </div>
        <Button asChild>
          <Link to="/ideas/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New idea
          </Link>
        </Button>
      </div>

      {list.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      )}

      {list.data?.length === 0 && (
        <div className="border border-dashed border-line p-20 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <div className="italic-display text-2xl mb-2">No ideas yet.</div>
          <p className="text-sm text-muted-foreground mb-6">
            Post a concept, gauge interest, convert to campaign when ready.
          </p>
          <Button asChild variant="outline">
            <Link to="/ideas/new">Share your first idea</Link>
          </Button>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <div className="border-t border-line">
          {list.data.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
