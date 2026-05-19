import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  ExternalLink,
  ArrowUpRight,
  Globe,
  ShieldCheck,
} from "lucide-react";
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

const SOCIAL_ICONS: Record<string, string> = {
  twitter: "𝕏",
  instagram: "IG",
  github: "GH",
  linkedin: "in",
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const me = useMe();
  const user = useUser(username ?? "");
  const portfolio = useUserPortfolio(username ?? "");
  const collabs = useCollabs({});
  const ideas = useIdeas();
  const startConv = useStartConversation();
  const navigate = useNavigate();

  const isOwnProfile = me.data?.username === username;
  const userId = user.data?.user_id;

  const userCollabs = collabs.data?.filter((c) => c.owner_id === userId) ?? [];
  const userIdeas = ideas.data?.filter((i) => i.owner_id === userId) ?? [];

  async function handleMessage() {
    if (!userId) return;
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
        <h2 className="font-display text-4xl">Profile not found.</h2>
        <p className="text-muted-foreground mt-3">This profile doesn't exist or was removed.</p>
      </div>
    );
  }

  const u = user.data;
  const displayName = u.name || u.username;
  const socialEntries = u.social_links
    ? Object.entries(u.social_links).filter(([, v]) => v)
    : [];

  const pageDesc = u.bio || `${displayName} on OrderRiot`;

  return (
    <>
      <Helmet>
        <title>{displayName} (@{u.username}) — OrderRiot</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={`${displayName} on OrderRiot`} />
        <meta property="og:description" content={pageDesc} />
        {u.avatar_url && <meta property="og:image" content={u.avatar_url} />}
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="container-edge py-16 md:py-20 max-w-4xl">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-12">
          <Avatar className="h-24 w-24 shrink-0">
            <AvatarImage src={u.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">{initials(displayName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="editorial-index">— Profile</div>
            <h1 className="font-display text-display-md mt-2 leading-[1.02]">
              {u.name ? (
                <>{u.name}<span className="italic-display">.</span></>
              ) : (
                u.username
              )}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>@{u.username}</span>
              {u.isverified && (
                <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>

            {u.bio && (
              <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">{u.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3">
              {u.location && (
                <Badge variant="outline" className="text-xs">{u.location}</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Joined{" "}
                {new Date(u.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </Badge>
              {u.website && (
                <a
                  href={u.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ink transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {u.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {socialEntries.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold border border-line px-2 py-0.5 text-muted-foreground hover:border-ink hover:text-ink transition-colors"
                >
                  {SOCIAL_ICONS[platform] ?? platform}
                </a>
              ))}
            </div>

            <div className="flex gap-3 mt-5 flex-wrap">
              {!isOwnProfile && me.data && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleMessage}
                  disabled={startConv.isPending}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </Button>
              )}
              {isOwnProfile && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/profile/edit">Edit profile</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Portfolio ── */}
        <section className="mb-14">
          <SectionHeader index="Showcase" title="Portfolio" />

          {portfolio.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          )}

          {!portfolio.isLoading && (!portfolio.data || portfolio.data.length === 0) && (
            <p className="text-sm text-muted-foreground italic">
              {isOwnProfile ? (
                <>Nothing here yet. <Link to="/profile/edit" className="text-accent hover:underline">Add portfolio items</Link> from your profile.</>
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

        {/* ── Collabs ── */}
        {userCollabs.length > 0 && (
          <section className="mb-14">
            <SectionHeader index="Activity" title="Collaborations" />
            <div className="space-y-3">
              {userCollabs.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to={`/collabs/${c.slug ?? c.id}`}
                  className="flex items-center justify-between gap-3 border border-line px-4 py-3 hover:border-ink hover:bg-muted/20 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium group-hover:underline underline-offset-4 truncate">{c.title}</div>
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

        {/* ── Ideas ── */}
        {userIdeas.length > 0 && (
          <section>
            <SectionHeader index="Ideas" title="Public ideas" />
            <div className="space-y-3">
              {userIdeas.slice(0, 5).map((idea) => (
                <Link
                  key={idea.id}
                  to={`/ideas/${idea.slug ?? idea.id}`}
                  className="flex items-center justify-between gap-3 border border-line px-4 py-3 hover:border-ink hover:bg-muted/20 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium group-hover:underline underline-offset-4 truncate">{idea.title}</div>
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
    </>
  );
}

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="border-b border-line pb-3 mb-6">
      <div className="editorial-index">— {index}</div>
      <h2 className="font-display text-2xl mt-1">{title}</h2>
    </div>
  );
}

function PortfolioCard({ item }: { item: UserPortfolioItem }) {
  const hasMedia = item.media_urls && item.media_urls.length > 0;
  return (
    <div className="border border-line flex flex-col">
      {hasMedia && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img src={item.media_urls![0]} alt={item.title} className="w-full h-full object-cover" />
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
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {item.tags.map((tag, i) => (
              <span key={i} className="text-[10px] border border-line px-1.5 py-0.5 text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
      </div>
      {item.media_urls && item.media_urls.length > 1 && (
        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto">
          {item.media_urls.slice(1).map((url, i) => (
            <img key={i} src={url} alt="" className="h-12 w-12 object-cover shrink-0 border border-line" />
          ))}
        </div>
      )}
    </div>
  );
}
