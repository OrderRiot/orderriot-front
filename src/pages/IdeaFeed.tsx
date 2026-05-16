import { useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIdeas } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import type { IdeaListItem } from "@/lib/types";

const CATEGORIES = [
  "All", "Technology", "Design", "Film", "Music", "Food", "Fashion",
  "Games", "Education", "Social Impact", "Health", "Environment", "Other",
];

function IdeaCard({ idea }: { idea: IdeaListItem }) {
  return (
    <Link
      to={`/ideas/${idea.id}`}
      className="border border-line p-6 flex flex-col gap-3 hover:bg-muted/30 transition-colors group"
    >
      <div>
        <div className="font-display text-lg font-semibold group-hover:underline underline-offset-4 leading-snug">
          {idea.title}
        </div>
        {idea.description && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {idea.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {idea.category && (
            <span className="border border-line px-2 py-0.5">{idea.category}</span>
          )}
          {idea.rough_goal != null && (
            <span>~{formatMoney(idea.rough_goal)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-ink transition-colors">
          <Lightbulb className="h-3.5 w-3.5" />
          {idea.interest_count} interested
        </div>
      </div>
    </Link>
  );
}

export default function IdeaFeed() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const ideas = useIdeas(category ? { category } : {});

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-y-4 mb-12">
        <div>
          <div className="editorial-index">— Community</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            Ideas worth <span className="italic-display">backing</span>.
          </h1>
          <p className="text-muted-foreground mt-3 text-sm max-w-md">
            Concepts in early stage. Express interest and get notified when they launch.
          </p>
        </div>
        <Link
          to="/ideas/new"
          className="text-sm font-medium border border-line px-5 py-2.5 hover:border-ink hover:text-ink transition-colors flex items-center gap-2"
        >
          Share an idea
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-10 pb-6 border-b border-line">
        {CATEGORIES.map((c) => {
          const val = c === "All" ? undefined : c;
          return (
            <button
              key={c}
              onClick={() => setCategory(val)}
              className={`px-3 py-1 text-xs border transition-colors ${
                category === val
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-muted-foreground hover:border-ink hover:text-ink"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {ideas.isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      )}

      {ideas.data?.length === 0 && (
        <div className="border border-dashed border-line p-20 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <div className="italic-display text-2xl mb-2">No ideas yet.</div>
          <p className="text-sm text-muted-foreground">
            Be the first to share a concept.
          </p>
        </div>
      )}

      {ideas.data && ideas.data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.data.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
