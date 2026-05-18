import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, MessageSquare, Users, CheckCircle, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCollab,
  useMe,
  useRespondToCollab,
  useCloseCollab,
  useCollabResponses,
  useStartConversation,
  useAcceptCollabResponse,
  useRejectCollabResponse,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import type { CollabCallType, CollabStatus } from "@/lib/types";

const CALL_TYPE_LABEL: Record<CollabCallType, string> = {
  open: "Open call",
  outreach: "Will reach out",
  both: "Open + reaching out",
};

const STATUS_LABEL: Record<CollabStatus, string> = {
  open: "Open",
  closed: "Closed",
  filled: "Filled",
};

const STATUS_VARIANT: Record<CollabStatus, "default" | "outline" | "solid"> = {
  open: "default",
  closed: "outline",
  filled: "solid",
};

export default function CollabDetail() {
  const { slug } = useParams<{ slug: string }>();
  const collab = useCollab(slug ?? "");
  const me = useMe();
  const navigate = useNavigate();

  if (collab.isLoading) {
    return (
      <div className="container-edge py-16 md:py-20 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!collab.data) {
    return (
      <div className="container-edge py-16 md:py-20 text-center">
        <div className="italic-display text-2xl">Post not found.</div>
      </div>
    );
  }

  const o = collab.data;
  const isOwner = me.data?.user_id === o.owner_id;
  const collabId = o.id;
  const pageDesc = o.description || `Collaboration: ${o.title} on OrderRiot`;

  return (
    <>
    <Helmet>
      <title>{o.title} — OrderRiot Collabs</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={o.title} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={o.title} />
      <meta name="twitter:description" content={pageDesc} />
    </Helmet>
    <div className="container-edge py-16 md:py-20 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
          <Badge variant="outline">{CALL_TYPE_LABEL[o.call_type]}</Badge>
          {o.support_type && (
            <span className="text-xs border border-line px-2 py-0.5 text-muted-foreground">
              {o.support_type}
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-4">
          {o.title}
        </h1>

        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {o.owner.avatar_url ? (
              <img src={o.owner.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                {o.owner.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <Link to={`/users/${o.owner.username}`} className="hover:text-ink transition-colors font-medium">
              {o.owner.username}
            </Link>
          </div>
          {(o.idea_title || o.campaign_title) && (
            <span className="flex items-center gap-1">
              for
              {o.idea_id && (
                <Link to={`/ideas/${o.idea_slug ?? o.idea_id}`} className="hover:text-ink transition-colors flex items-center gap-0.5">
                  {o.idea_title}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {o.campaign_id && (
                <Link to={`/campaigns/${o.campaign_slug ?? o.campaign_id}`} className="hover:text-ink transition-colors flex items-center gap-0.5">
                  {o.campaign_title}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </span>
          )}
          <span>{new Date(o.created_at).toLocaleDateString("en-IN")}</span>
          {o.response_count > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {o.response_count} response{o.response_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {o.description && (
        <p className="text-muted-foreground leading-relaxed mb-8">{o.description}</p>
      )}

      {/* Skills */}
      {o.skills && o.skills.length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Looking for</div>
          <div className="flex flex-wrap gap-2">
            {o.skills.map((s, i) => (
              <span key={i} className="border border-line px-3 py-1 text-sm text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Owner actions */}
      {isOwner && o.status === "open" && (
        <OwnerActions collabId={collabId} />
      )}

      {/* Response form */}
      {!isOwner && o.status === "open" && o.call_type !== "outreach" && (
        <ResponseForm collabId={collabId} />
      )}

      {!isOwner && o.status === "open" && o.call_type === "outreach" && (
        <div className="border border-line p-5 text-sm text-muted-foreground">
          This is a direct-outreach post. {o.owner.username} will reach out to collaborators themselves.
        </div>
      )}

      {o.status !== "open" && !isOwner && (
        <div className="border border-line p-5 text-sm text-muted-foreground">
          This collaboration is {o.status === "filled" ? "filled" : "closed"}.
        </div>
      )}

      {!me.data && o.status === "open" && o.call_type !== "outreach" && (
        <div className="border border-line p-5 flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Sign in to reach out to {o.owner.username}.</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {/* Responses (owner only) */}
      {isOwner && <ResponsesList collabId={collabId} />}
    </div>
    </>
  );
}

// ── Owner actions ────────────────────────────────────────────────

function OwnerActions({ collabId }: { collabId: number }) {
  const close = useCloseCollab(collabId);
  const [confirm, setConfirm] = useState<"close" | "fill" | null>(null);

  async function handle(filled: boolean) {
    try {
      await close.mutateAsync(filled);
      toast.success(filled ? "Marked as filled." : "Post closed.");
      setConfirm(null);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (confirm) {
    return (
      <div className="border border-line p-5 mb-8 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {confirm === "fill" ? "Mark this as filled?" : "Close this post?"}
        </span>
        <Button size="sm" onClick={() => handle(confirm === "fill")} disabled={close.isPending}>
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-8">
      <Button size="sm" variant="outline" onClick={() => setConfirm("fill")} className="gap-1.5">
        <CheckCircle className="h-3.5 w-3.5" />
        Mark as filled
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirm("close")} className="text-muted-foreground gap-1.5">
        <X className="h-3.5 w-3.5" />
        Close post
      </Button>
    </div>
  );
}

// ── Response form ─────────────────────────────────────────────────

function ResponseForm({ collabId }: { collabId: number }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const respond = useRespondToCollab(collabId);

  async function handleSubmit() {
    if (!message.trim()) return;
    try {
      await respond.mutateAsync({
        message: message.trim(),
        portfolio_link: portfolioLink.trim() || undefined,
      });
      toast.success("Message sent to the poster.");
      setOpen(false);
      setMessage("");
      setPortfolioLink("");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (!open) {
    return (
      <div className="mb-8">
        <Button onClick={() => setOpen(true)}>Reach out</Button>
        <p className="text-xs text-muted-foreground mt-2">
          Your message will be visible only to the poster.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line p-6 mb-8 space-y-4">
      <div className="text-sm font-semibold">Your message</div>
      <textarea
        className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-32"
        placeholder="Introduce yourself, describe your skills, and explain why you'd be a good fit…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Portfolio / work link
          <span className="ml-1">(optional)</span>
        </label>
        <input
          className="w-full border border-line px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-ink"
          placeholder="https://yourwork.com"
          value={portfolioLink}
          onChange={(e) => setPortfolioLink(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={respond.isPending || !message.trim()}>
          {respond.isPending ? "Sending..." : "Send message"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Responses list (owner) ────────────────────────────────────────

function ResponsesList({ collabId }: { collabId: number }) {
  const responses = useCollabResponses(collabId, true);
  const startConv = useStartConversation();
  const accept = useAcceptCollabResponse(collabId);
  const reject = useRejectCollabResponse(collabId);
  const navigate = useNavigate();

  async function handleMessage(userId: number) {
    try {
      const conv = await startConv.mutateAsync(userId);
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (responses.isLoading) return <Skeleton className="h-32 mt-8" />;
  if (!responses.data?.length) {
    return (
      <div className="mt-8 border-t border-line pt-8 text-sm text-muted-foreground">
        No responses yet.
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-line pt-8">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
        Responses ({responses.data.length})
      </div>
      <div className="space-y-5">
        {responses.data.map((r) => (
          <div
            key={r.id}
            className={`border p-5 ${
              r.status === "accepted"
                ? "border-green-600/40 bg-green-50/30"
                : r.status === "rejected"
                ? "border-line opacity-60"
                : "border-line"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {r.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Link to={`/users/${r.username}`} className="font-medium text-sm hover:underline">
                      {r.username}
                    </Link>
                    {r.status === "accepted" && (
                      <span className="text-[10px] font-semibold text-green-600 uppercase tracking-widest">Accepted</span>
                    )}
                    {r.status === "rejected" && (
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Not selected</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-green-600/40 text-green-700 hover:bg-green-50"
                      onClick={async () => {
                        try { await accept.mutateAsync(r.id); }
                        catch (err) { toast.error(apiError(err)); }
                      }}
                      disabled={accept.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/5"
                      onClick={async () => {
                        try { await reject.mutateAsync(r.id); }
                        catch (err) { toast.error(apiError(err)); }
                      }}
                      disabled={reject.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleMessage(r.user_id)}
                  disabled={startConv.isPending}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </Button>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{r.message}</p>
            {r.portfolio_link && (
              <a
                href={r.portfolio_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ArrowUpRight className="h-3 w-3" />
                {r.portfolio_link}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
