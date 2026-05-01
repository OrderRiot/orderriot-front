import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { useCampaigns } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  "Design",
  "Technology",
  "Film",
  "Music",
  "Games",
  "Publishing",
  "Food",
  "Fashion",
  "Photography",
  "Theatre",
  "Crafts",
  "Comics",
];

const sortOptions = ["newest", "popular", "ending-soon"] as const;
type Sort = (typeof sortOptions)[number];

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("search") ?? "");
  const category = params.get("category") ?? undefined;
  const location = params.get("location") ?? undefined;
  const sort = (params.get("sort") as Sort) ?? "newest";

  // sync local search box with URL
  useEffect(() => setQuery(params.get("search") ?? ""), [params]);

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const { data, isLoading } = useCampaigns({
    category,
    location,
    search: params.get("search") ?? undefined,
    limit: 60,
  });

  const sorted = useMemo(() => {
    if (!data) return data;
    const arr = [...data];
    if (sort === "popular") {
      arr.sort((a, b) => b.current_amount - a.current_amount);
    } else if (sort === "ending-soon") {
      arr.sort(
        (a, b) =>
          new Date(a.completion_date ?? 0).getTime() -
          new Date(b.completion_date ?? 0).getTime(),
      );
    } else {
      arr.sort(
        (a, b) =>
          new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime(),
      );
    }
    return arr;
  }, [data, sort]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setParam("search", query.trim() || undefined);
  }

  return (
    <div>
      {/* Header */}
      <div className="container-edge pt-12 pb-8">
        <div className="grid grid-cols-12 gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <div className="editorial-index">— Discover · {sorted?.length ?? 0} live</div>
            <h1 className="font-display text-display-lg mt-3 leading-[0.95] text-balance">
              Find your<br />
              <span className="italic-display">next</span> obsession.
            </h1>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-12">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 border-b border-line focus-within:border-ink transition-colors"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, idea, or maker"
                className="flex-1 border-0 px-0 focus-visible:border-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setParam("search", undefined);
                  }}
                  className="text-muted-foreground hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-y border-line bg-paper sticky top-16 z-30">
        <div className="container-edge flex items-center gap-2 overflow-x-auto py-3">
          <FilterChip
            active={!category}
            onClick={() => setParam("category", undefined)}
          >
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c}
              active={category?.toLowerCase() === c.toLowerCase()}
              onClick={() => setParam("category", c)}
            >
              {c}
            </FilterChip>
          ))}

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
            <span>Sort</span>
            <span className="ml-2 flex items-center divide-x divide-line border border-line">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setParam("sort", opt)}
                  className={cn(
                    "px-3 py-1.5 transition-colors",
                    sort === opt
                      ? "bg-ink text-paper"
                      : "hover:bg-ink/5",
                  )}
                >
                  {opt.replace("-", " ")}
                </button>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-edge py-12">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3]" />
                <Skeleton className="h-3 w-1/3 mt-5" />
                <Skeleton className="h-7 w-4/5 mt-3" />
              </div>
            ))}
          </div>
        )}

        {sorted && sorted.length === 0 && (
          <div className="border border-line p-20 text-center">
            <div className="italic-display text-4xl">Nothing matches.</div>
            <p className="text-muted-foreground mt-3">
              Try a different category or clear your search.
            </p>
            <Button
              variant="ghost"
              className="mt-6"
              onClick={() => {
                setParams(new URLSearchParams(), { replace: true });
                setQuery("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {sorted && sorted.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            {sorted.map((c) => (
              <CampaignCard key={c.camp_id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3 py-1.5 text-xs uppercase tracking-[0.16em] border transition-colors",
        active
          ? "bg-ink text-paper border-ink"
          : "bg-transparent border-line hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}
