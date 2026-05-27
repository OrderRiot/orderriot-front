import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  Globe,
  Search,
  ShieldCheck,
  Users,
  Lightbulb,
  Megaphone,
  Handshake,
  BookOpen,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useSearch,
  useOrganizations,
  useIdeas,
  useCampaigns,
  useCollabs,
} from "@/lib/queries";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import type { IdeaListItem, OrgListItem, CampaignListItem, CollabPost } from "@/lib/types";

// ── Tab config ───────────────────────────────────────────────────

type Tab = "all" | "orgs" | "people" | "ideas" | "campaigns" | "collabs" | "articles";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "all",       label: "All",        icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "orgs",      label: "Organizations", icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: "people",    label: "People",     icon: <Users className="h-3.5 w-3.5" /> },
  { id: "ideas",     label: "Ideas",      icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { id: "campaigns", label: "Campaigns",  icon: <Megaphone className="h-3.5 w-3.5" /> },
  { id: "collabs",   label: "Collabs",    icon: <Handshake className="h-3.5 w-3.5" /> },
  { id: "articles",  label: "Articles",   icon: <BookOpen className="h-3.5 w-3.5" /> },
];

const ORG_TYPE_LABELS: Record<string, string> = {
  marketing: "Marketing", investors: "Investors", incubators: "Incubators",
  manufacturers: "Manufacturers", av_production: "A/V Production",
  consultancy: "Consultancy", software: "Software", other: "Other",
};

// ── Page ─────────────────────────────────────────────────────────

export default function Community() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const tab = (params.get("tab") as Tab) ?? "all";
  const activeQuery = params.get("q") ?? "";

  useEffect(() => setQuery(params.get("q") ?? ""), [params]);

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setParam("q", query.trim() || undefined);
  }

  const searching = activeQuery.length > 0;

  // Search results (when query present)
  const searchResults = useSearch(activeQuery);

  // Browse queries (when no query)
  const orgs      = useOrganizations({ search: searching ? undefined : undefined });
  const ideas     = useIdeas();
  const campaigns = useCampaigns({ limit: 30 });
  const collabs   = useCollabs();

  // Derived counts for "All" summary
  const totalOrgs  = searching ? (searchResults.data?.organizations.length ?? 0) : (orgs.data?.length ?? 0);
  const totalIdeas = searching ? (searchResults.data?.ideas.length ?? 0) : (ideas.data?.length ?? 0);

  return (
    <div>
      {/* ── Header ── */}
      <div className="container-edge pt-12 pb-8">
        <div className="grid grid-cols-12 gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <div className="editorial-index">— Community</div>
            <h1 className="font-display text-display-lg mt-3 leading-[0.95] text-balance">
              Explore the<br />
              <span className="italic-display">ecosystem</span>.
            </h1>
            <p className="text-muted-foreground mt-4 text-sm max-w-md">
              Browse organizations, makers, ideas, and opportunities across the OrderRiot platform.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-12">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-3 border-b border-line focus-within:border-ink transition-colors"
            >
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people, orgs, ideas..."
                className="flex-1 border-0 px-0 focus-visible:border-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setParam("q", undefined); }}
                  className="text-muted-foreground hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
            {searching && !searchResults.isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                Results for "{activeQuery}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="border-y border-line bg-paper sticky top-16 z-30">
        <div className="container-edge flex items-center gap-1 overflow-x-auto py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setParam("tab", t.id === "all" ? undefined : t.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.14em] border transition-colors",
                tab === t.id
                  ? "bg-ink text-paper border-ink"
                  : "bg-transparent border-line hover:border-ink",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container-edge py-12 space-y-16">

        {/* Articles placeholder */}
        {tab === "articles" && (
          <div className="border border-dashed border-line p-20 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <div className="font-display text-2xl mb-2">Coming soon</div>
            <p className="text-muted-foreground text-sm">
              Articles, case studies, and tutorials will appear here.
            </p>
          </div>
        )}

        {/* Search mode — all results */}
        {searching && tab === "all" && (
          <SearchAllResults results={searchResults.data} loading={searchResults.isLoading} />
        )}

        {/* Search mode — specific tab */}
        {searching && tab === "orgs" && (
          <Section title="Organizations" icon={<Building2 className="h-4 w-4" />}>
            {searchResults.isLoading
              ? <OrgSkeleton />
              : searchResults.data?.organizations.length === 0
              ? <EmptyState label="No organizations match." />
              : <OrgGrid items={searchResults.data!.organizations.map((o) => ({
                  id: o.id, slug: null, owner_id: 0, owner_username: "", owner_avatar_url: null,
                  name: o.name, description: null, avatar_url: o.avatar_url,
                  org_type: o.org_type as any, entity_type: "other" as any, status: "verified" as any, created_at: "",
                }))} />
            }
          </Section>
        )}

        {searching && tab === "people" && (
          <Section title="People" icon={<Users className="h-4 w-4" />}>
            {searchResults.isLoading
              ? <PeopleSkeleton />
              : searchResults.data?.users.length === 0
              ? <EmptyState label="No people match." />
              : <PeopleGrid items={searchResults.data!.users} />
            }
          </Section>
        )}

        {searching && tab === "ideas" && (
          <Section title="Ideas" icon={<Lightbulb className="h-4 w-4" />}>
            {searchResults.isLoading
              ? <IdeaSkeleton />
              : searchResults.data?.ideas.length === 0
              ? <EmptyState label="No ideas match." />
              : <IdeaGrid items={searchResults.data!.ideas} />
            }
          </Section>
        )}

        {searching && tab === "campaigns" && (
          <Section title="Campaigns" icon={<Megaphone className="h-4 w-4" />}>
            {searchResults.isLoading
              ? <CampaignSkeleton />
              : searchResults.data?.campaigns.length === 0
              ? <EmptyState label="No campaigns match." />
              : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {searchResults.data!.campaigns.map((c) => (
                    <Link key={c.id} to={`/campaigns/${c.id}`} className="group space-y-2">
                      <div className="font-semibold group-hover:underline">{c.title}</div>
                      {c.subtitle && <div className="text-sm text-muted-foreground">{c.subtitle}</div>}
                    </Link>
                  ))}
                </div>
            }
          </Section>
        )}

        {searching && tab === "collabs" && (
          <Section title="Collabs" icon={<Handshake className="h-4 w-4" />}>
            {searchResults.isLoading
              ? <CollabSkeleton />
              : searchResults.data?.collabs.length === 0
              ? <EmptyState label="No collabs match." />
              : <CollabGrid items={searchResults.data!.collabs} />
            }
          </Section>
        )}

        {/* Browse mode (no search) */}
        {!searching && (tab === "all" || tab === "orgs") && (
          <Section
            title="Organizations"
            icon={<Building2 className="h-4 w-4" />}
            viewAll={tab === "all" ? () => setParam("tab", "orgs") : undefined}
          >
            {orgs.isLoading
              ? <OrgSkeleton />
              : orgs.data?.length === 0
              ? <EmptyState label="No organizations yet." />
              : <OrgGrid items={tab === "all" ? orgs.data!.slice(0, 6) : orgs.data!} />
            }
          </Section>
        )}

        {!searching && (tab === "all" || tab === "people") && (
          <Section title="People" icon={<Users className="h-4 w-4" />}>
            <div className="border border-dashed border-line p-10 text-center text-sm text-muted-foreground">
              Search above to discover people on OrderRiot.
            </div>
          </Section>
        )}

        {!searching && (tab === "all" || tab === "ideas") && (
          <Section
            title="Ideas"
            icon={<Lightbulb className="h-4 w-4" />}
            viewAll={tab === "all" ? () => setParam("tab", "ideas") : undefined}
          >
            {ideas.isLoading
              ? <IdeaSkeleton />
              : ideas.data?.length === 0
              ? <EmptyState label="No published ideas yet." />
              : <IdeaGrid items={(tab === "all" ? ideas.data!.slice(0, 6) : ideas.data!).map((i) => ({
                  id: i.id, title: i.title, category: i.category, slug: i.slug,
                  subtitle: i.subtitle, interest_count: i.interest_count,
                }))} />
            }
          </Section>
        )}

        {!searching && (tab === "all" || tab === "campaigns") && (
          <Section
            title="Campaigns"
            icon={<Megaphone className="h-4 w-4" />}
            viewAll={tab === "all" ? () => setParam("tab", "campaigns") : undefined}
          >
            {campaigns.isLoading
              ? <CampaignSkeleton />
              : campaigns.data?.length === 0
              ? <EmptyState label="No active campaigns." />
              : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                  {(tab === "all" ? campaigns.data!.slice(0, 3) : campaigns.data!).map((c) => (
                    <CampaignCard key={c.camp_id} campaign={c} />
                  ))}
                </div>
            }
          </Section>
        )}

        {!searching && (tab === "all" || tab === "collabs") && (
          <Section
            title="Open Collabs"
            icon={<Handshake className="h-4 w-4" />}
            viewAll={tab === "all" ? () => setParam("tab", "collabs") : undefined}
          >
            {collabs.isLoading
              ? <CollabSkeleton />
              : collabs.data?.length === 0
              ? <EmptyState label="No open collabs." />
              : <CollabGrid items={(tab === "all" ? collabs.data!.slice(0, 6) : collabs.data!) as any} />
            }
          </Section>
        )}

      </div>
    </div>
  );
}

// ── Search all results ────────────────────────────────────────────

function SearchAllResults({
  results,
  loading,
}: {
  results: import("@/lib/types").SearchResult | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => <Skeleton key={j} className="h-20" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!results) return null;

  const hasAnything =
    results.organizations.length > 0 || results.users.length > 0 ||
    results.ideas.length > 0 || results.campaigns.length > 0 || results.collabs.length > 0;

  if (!hasAnything) {
    return (
      <div className="border border-line p-20 text-center">
        <div className="italic-display text-3xl mb-2">Nothing found.</div>
        <p className="text-muted-foreground text-sm">Try different keywords.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {results.organizations.length > 0 && (
        <Section title="Organizations" icon={<Building2 className="h-4 w-4" />}>
          <OrgGrid items={results.organizations.map((o) => ({
            id: o.id, slug: null, owner_id: 0, owner_username: "", owner_avatar_url: null,
            name: o.name, description: null, avatar_url: o.avatar_url,
            org_type: o.org_type as any, entity_type: "other" as any, status: "verified" as any, created_at: "",
          }))} />
        </Section>
      )}
      {results.users.length > 0 && (
        <Section title="People" icon={<Users className="h-4 w-4" />}>
          <PeopleGrid items={results.users} />
        </Section>
      )}
      {results.ideas.length > 0 && (
        <Section title="Ideas" icon={<Lightbulb className="h-4 w-4" />}>
          <IdeaGrid items={results.ideas} />
        </Section>
      )}
      {results.campaigns.length > 0 && (
        <Section title="Campaigns" icon={<Megaphone className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {results.campaigns.map((c) => (
              <Link key={c.id} to={`/campaigns/${c.id}`}
                className="border border-line p-4 hover:border-ink transition-colors group">
                <div className="font-semibold text-sm group-hover:underline">{c.title}</div>
                {c.subtitle && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.subtitle}</div>}
                {c.category && <Badge variant="outline" className="mt-2 text-xs">{c.category}</Badge>}
              </Link>
            ))}
          </div>
        </Section>
      )}
      {results.collabs.length > 0 && (
        <Section title="Collabs" icon={<Handshake className="h-4 w-4" />}>
          <CollabGrid items={results.collabs} />
        </Section>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────

function Section({
  title, icon, children, viewAll,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  viewAll?: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {viewAll && (
          <button onClick={viewAll} className="text-xs text-muted-foreground hover:text-ink transition-colors uppercase tracking-widest">
            View all
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Org grid ─────────────────────────────────────────────────────

function OrgGrid({ items }: { items: Pick<OrgListItem, "id" | "slug" | "name" | "description" | "avatar_url" | "org_type" | "status">[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((org) => (
        <Link
          key={org.id}
          to={`/organizations/${org.slug ?? org.id}`}
          className="border border-line p-5 flex gap-4 hover:border-ink transition-colors group"
        >
          <div className="shrink-0">
            {org.avatar_url ? (
              <img src={org.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="font-semibold text-sm group-hover:underline truncate">{org.name}</div>
              {org.status === "verified" && (
                <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {ORG_TYPE_LABELS[org.org_type] ?? org.org_type}
            </div>
            {org.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{org.description}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── People grid ──────────────────────────────────────────────────

function PeopleGrid({ items }: { items: { id: number; username: string; avatar_url: string | null; isverified?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((u) => (
        <Link
          key={u.id}
          to={`/users/${u.username}`}
          className="border border-line p-4 flex flex-col items-center text-center gap-2 hover:border-ink transition-colors group"
        >
          {u.avatar_url ? (
            <img src={u.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-sm">
              {u.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium group-hover:underline truncate">{u.username}</span>
            {u.isverified && <ShieldCheck className="h-3 w-3 text-green-600 shrink-0" />}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Idea grid ────────────────────────────────────────────────────

function IdeaGrid({ items }: {
  items: { id: number; title: string; category: string | null; slug?: string | null; subtitle?: string | null; owner_username?: string | null; interest_count?: number }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((idea) => (
        <Link
          key={idea.id}
          to={`/ideas/${idea.slug ?? idea.id}`}
          className="border border-line p-5 hover:border-ink transition-colors group space-y-2"
        >
          {idea.category && (
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{idea.category}</div>
          )}
          <div className="font-semibold text-sm group-hover:underline leading-snug">{idea.title}</div>
          {idea.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-2">{idea.subtitle}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            {idea.owner_username && (
              <span className="text-xs text-muted-foreground">{idea.owner_username}</span>
            )}
            {idea.interest_count !== undefined && (
              <span className="text-xs text-muted-foreground">{idea.interest_count} interested</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Collab grid ──────────────────────────────────────────────────

function CollabGrid({ items }: { items: { id: number; title: string; post_type: string; slug?: string | null }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((c) => (
        <Link
          key={c.id}
          to={`/collabs/${(c as any).slug ?? c.id}`}
          className="border border-line p-5 hover:border-ink transition-colors group space-y-2"
        >
          <Badge variant="outline" className="text-xs">{c.post_type}</Badge>
          <div className="font-semibold text-sm group-hover:underline leading-snug">{c.title}</div>
        </Link>
      ))}
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────

function OrgSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-line p-5 flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PeopleSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border border-line p-4 flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function IdeaSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-line p-5 space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function CampaignSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="h-3 w-1/3 mt-5" />
          <Skeleton className="h-6 w-4/5 mt-2" />
        </div>
      ))}
    </div>
  );
}

function CollabSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-line p-5 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-line p-12 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
