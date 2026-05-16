import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ExternalLink, ArrowUpRight } from "lucide-react";
import {
  useUser,
  useUserPortfolio,
  useCollabs,
  useIdeas,
  useMe,
  useStartConversation,
} from "@/lib/queries";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import type { UserPortfolioItem } from "@/lib/types";

export default function PublicProfile() {
  const { id } = useParams();
  const userId = Number(id);
  const me = useMe();
  const user = useUser(userId);
  const portfolio = useUserPortfolio(userId);
  const collabs = useCollabs({ post_type: undefined });
  const ideas = useIdeas();
  const startConv = useStartConversation();
  const navigate = useNavigate();

  const isOwnProfile = me.data?.user_id === userId;

  // Filter to this user's public collabs and published ideas
  const userCollabs = collabs.data?.filter((c) => c.owner_id === userId) ?? [];
  const userIdeas = ideas.data?.filter((i) => i.owner_id === userId) ?? [];

  async function handleMessage() {
    try {
      const conv = await startConv.mutateAsync(userId);
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (user.isLoading) {
    return (
      <div className="container-edge py-20 max-w-4xl space-y-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (user.isError || !user.data) {
    return (
      <div className="container-edge py-32 text-center">
        <h2 className="font-display text-4xl">Person not found.</h2>
        <p className="text-muted-foreground mt-3">This profile doesn't exist or was removed.</p>
      </div>
    );
  }

  const u = user.data;

  return (
    <div className="container-edge py-16 md:py-20 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-12">
        <Avatar className="h-24 w-24 shrink-0">
          <AvatarImage src={u.avatar_url ?? undefined} />
          <AvatarFallback className="text-2xl">{initials(u.username)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="editorial-index">— Profile</div>
          <h1 className="font-display text-display-md mt-2 leading-[1.02]">
            {u.username}
            {u.isverified && <span className="italic-display"> ✓</span>}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {u.location && <Badge variant="outline">{u.location}</Badge>}
            <Badge variant="outline">
              Joined{" "}
              {new Date(u.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })}
            </Badge>
          </div>

          {!isOwnProfile && me.data && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 gap-1.5"
              onClick={handleMessage}
              disabled={startConv.isPending}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Message {u.username}
            </Button>
          )}
          {isOwnProfile && (
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link to="/profile">Edit your profile</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Portfolio */}
      <section className="mb-14">
        <div className="flex items-end justify-between gap-4 mb-6 border-b border-line pb-3">
          <div>
            <div className="editorial-index">— Showcase</div>
            <h2 className="font-display text-2xl mt-1">Portfolio</h2>
          </div>
        </div>

        {portfolio.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        )}

        {!portfolio.isLoading && (!portfolio.data || portfolio.data.length === 0) && (
          <p className="text-sm text-muted-foreground italic">
            {isOwnProfile ? (
              <>Nothing added yet. <Link to="/profile" className="text-accent hover:underline">Add portfolio items</Link> from your profile.</>
            ) : (
              "No portfolio items yet."
            )}
          </p>
        )}

        {portfolio.data && portfolio.data.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {portfolio.data.map((item) => (
              <PortfolioCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Collab posts */}
      {userCollabs.length > 0 && (
        <section className="mb-14">
          <div className="border-b border-line pb-3 mb-6">
            <div className="editorial-index">— Activity</div>
            <h2 className="font-display text-2xl mt-1">Collaborations</h2>
          </div>
          <div className="space-y-3">
            {userCollabs.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/collabs/${c.id}`}
                className="flex items-center justify-between gap-3 border border-line px-4 py-3 hover:border-ink hover:bg-muted/20 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium group-hover:underline underline-offset-4 truncate">
                    {c.title}
                  </div>
                  {c.skills && c.skills.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {c.skills.slice(0, 4).join(" · ")}
                    </div>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Published ideas */}
      {userIdeas.length > 0 && (
        <section>
          <div className="border-b border-line pb-3 mb-6">
            <div className="editorial-index">— Ideas</div>
            <h2 className="font-display text-2xl mt-1">Public ideas</h2>
          </div>
          <div className="space-y-3">
            {userIdeas.slice(0, 5).map((idea) => (
              <Link
                key={idea.id}
                to={`/ideas/${idea.id}`}
                className="flex items-center justify-between gap-3 border border-line px-4 py-3 hover:border-ink hover:bg-muted/20 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium group-hover:underline underline-offset-4 truncate">
                    {idea.title}
                  </div>
                  {idea.category && (
                    <div className="text-xs text-muted-foreground mt-0.5">{idea.category}</div>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PortfolioCard({ item }: { item: UserPortfolioItem }) {
  const hasMedia = item.media_urls && item.media_urls.length > 0;

  return (
    <div className="border border-line flex flex-col">
      {hasMedia && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={item.media_urls![0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-sm leading-snug">{item.title}</div>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-ink transition-colors shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {item.tags.map((tag, i) => (
              <span key={i} className="text-[10px] border border-line px-1.5 py-0.5 text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {item.media_urls && item.media_urls.length > 1 && (
        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto">
          {item.media_urls.slice(1).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="h-12 w-12 object-cover shrink-0 border border-line"
            />
          ))}
        </div>
      )}
    </div>
  );
}
