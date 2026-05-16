import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Megaphone, Lightbulb, Handshake, Building2, User as UserIcon } from "lucide-react";
import { useSearch } from "@/lib/queries";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 280);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useSearch(debouncedQ);

  useEffect(() => {
    if (open) {
      setQ("");
      setDebouncedQ("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  function go(path: string) {
    navigate(path);
    onClose();
  }

  const hasResults = data && (
    data.campaigns.length + data.ideas.length + data.collabs.length +
    data.organizations.length + data.users.length > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-paper border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search campaigns, ideas, people, orgs..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q ? (
            <button
              onClick={() => { setQ(""); setDebouncedQ(""); }}
              className="text-muted-foreground hover:text-ink transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:flex h-5 items-center gap-0.5 border border-line px-1.5 text-[10px] text-muted-foreground">
              esc
            </kbd>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto">
          {!q && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Search across campaigns, ideas, collabs, orgs, and people
            </div>
          )}

          {q && isFetching && !data && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {q && !isFetching && !hasResults && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for <span className="font-medium text-ink">"{q}"</span>
            </div>
          )}

          {hasResults && (
            <div className="py-1.5">
              {data!.campaigns.length > 0 && (
                <Group label="Campaigns" icon={<Megaphone className="h-3 w-3" />}>
                  {data!.campaigns.map((c) => (
                    <Row key={c.id} title={c.title} sub={c.category ?? undefined} onClick={() => go(`/campaigns/${c.id}`)} />
                  ))}
                </Group>
              )}
              {data!.ideas.length > 0 && (
                <Group label="Ideas" icon={<Lightbulb className="h-3 w-3" />}>
                  {data!.ideas.map((i) => (
                    <Row key={i.id} title={i.title} sub={i.category ?? undefined} onClick={() => go(`/ideas/${i.id}`)} />
                  ))}
                </Group>
              )}
              {data!.collabs.length > 0 && (
                <Group label="Collaborations" icon={<Handshake className="h-3 w-3" />}>
                  {data!.collabs.map((c) => (
                    <Row key={c.id} title={c.title} sub={c.post_type} onClick={() => go(`/collabs/${c.id}`)} />
                  ))}
                </Group>
              )}
              {data!.organizations.length > 0 && (
                <Group label="Organizations" icon={<Building2 className="h-3 w-3" />}>
                  {data!.organizations.map((o) => (
                    <Row key={o.id} title={o.name} sub={o.org_type} onClick={() => go(`/organizations/${o.id}`)} />
                  ))}
                </Group>
              )}
              {data!.users.length > 0 && (
                <Group label="People" icon={<UserIcon className="h-3 w-3" />}>
                  {data!.users.map((u) => (
                    <Row
                      key={u.id}
                      title={u.username}
                      sub={u.isverified ? "Verified" : undefined}
                      onClick={() => go(`/users/${u.id}`)}
                    />
                  ))}
                </Group>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-4 py-2 flex items-center gap-5 text-[11px] text-muted-foreground">
          <span>click or ↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}

function Group({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ title, sub, onClick }: { title: string; sub?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink truncate group-hover:text-ink">{title}</div>
        {sub && <div className="text-xs text-muted-foreground capitalize">{sub}</div>}
      </div>
    </button>
  );
}
