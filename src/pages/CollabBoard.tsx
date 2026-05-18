import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollabs } from "@/lib/queries";
import type { CollabPost, CollabCallType, CollabPostType } from "@/lib/types";

export const PRESET_SKILLS = [
  "Design", "Illustration", "Photography", "Videography", "Editing",
  "Music", "Writing", "Marketing", "Development", "UI/UX", "Branding",
  "Animation", "Voice Over", "3D", "Finance", "Legal", "Manufacturing",
  "Distribution", "Community", "Other",
];

const CALL_TYPE_LABEL: Record<CollabCallType, string> = {
  open: "Open call",
  outreach: "Will reach out",
  both: "Open + reaching out",
};

const CALL_TYPE_VARIANT: Record<CollabCallType, "default" | "outline" | "solid"> = {
  open: "default",
  outreach: "outline",
  both: "solid",
};

function CollabCard({ post }: { post: CollabPost }) {
  const isOffer = post.post_type === "offer";

  return (
    <Link
      to={`/collabs/${post.slug ?? post.id}`}
      className={`border p-6 flex flex-col gap-4 hover:bg-muted/30 transition-colors group ${
        isOffer ? "border-ink/20 bg-muted/10" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isOffer && (
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {post.org?.name ?? "Organization"} &middot; Offering services
            </div>
          )}
          <div className="font-display text-lg font-semibold group-hover:underline underline-offset-4 leading-snug">
            {post.title}
          </div>
          {post.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          )}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink transition-colors shrink-0 mt-1" />
      </div>

      {post.skills && post.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.skills.map((s, i) => (
            <span key={i} className="text-xs border border-line px-2 py-0.5 text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {!isOffer && (
            <div className="flex items-center gap-1.5">
              {post.owner.avatar_url ? (
                <img src={post.owner.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                  {post.owner.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span>{post.owner.username}</span>
            </div>
          )}
          {!isOffer && (post.idea_title || post.campaign_title) && (
            <span className="text-muted-foreground/60">
              for {post.idea_title ?? post.campaign_title}
            </span>
          )}
          {post.support_type && (
            <span className="border border-line px-2 py-0.5">{post.support_type}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isOffer && (
            <Badge variant={CALL_TYPE_VARIANT[post.call_type]}>
              {CALL_TYPE_LABEL[post.call_type]}
            </Badge>
          )}
          {post.response_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {post.response_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CollabBoard() {
  const [skill, setSkill] = useState<string | undefined>(undefined);
  const [postType, setPostType] = useState<CollabPostType | undefined>(undefined);
  const collabs = useCollabs({ ...(skill ? { skill } : {}), ...(postType ? { post_type: postType } : {}) });

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-y-4 mb-12">
        <div>
          <div className="editorial-index">— Community</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            Collaborate &amp; <span className="italic-display">build together</span>.
          </h1>
          <p className="text-muted-foreground mt-3 text-sm max-w-lg">
            Creators and makers looking for collaborators, contributors, and support. On each other's own terms.
          </p>
        </div>
        <Link
          to="/collabs/new"
          className="text-sm font-medium border border-line px-5 py-2.5 hover:border-ink hover:text-ink transition-colors flex items-center gap-2"
        >
          Post a collab
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2 mb-6">
        {([undefined, "request", "offer"] as const).map((t) => (
          <button
            key={t ?? "all"}
            onClick={() => setPostType(t)}
            className={`px-4 py-1.5 text-sm border transition-colors ${
              postType === t ? "border-ink bg-ink text-paper" : "border-line text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {t === undefined ? "All" : t === "request" ? "Looking for" : "Offering services"}
          </button>
        ))}
      </div>

      {/* Skill filter */}
      <div className="flex gap-2 flex-wrap mb-10 pb-6 border-b border-line">
        <button
          onClick={() => setSkill(undefined)}
          className={`px-3 py-1 text-xs border transition-colors ${
            !skill ? "border-ink bg-ink text-paper" : "border-line text-muted-foreground hover:border-ink hover:text-ink"
          }`}
        >
          All
        </button>
        {PRESET_SKILLS.map((s) => (
          <button
            key={s}
            onClick={() => setSkill(skill === s ? undefined : s)}
            className={`px-3 py-1 text-xs border transition-colors ${
              skill === s ? "border-ink bg-ink text-paper" : "border-line text-muted-foreground hover:border-ink hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {collabs.isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      )}

      {collabs.data?.length === 0 && (
        <div className="border border-dashed border-line p-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <div className="italic-display text-2xl mb-2">Nothing here yet.</div>
          <p className="text-sm text-muted-foreground">Be the first to post a collaboration.</p>
        </div>
      )}

      {collabs.data && collabs.data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collabs.data.map((c) => <CollabCard key={c.id} post={c} />)}
        </div>
      )}
    </div>
  );
}
