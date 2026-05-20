import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Lightbulb, ArrowRight, Pencil, Trash2, Globe, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { ga } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  useIdea,
  useMe,
  usePublishIdea,
  useDeleteIdea,
  useToggleInterest,
  useConvertIdea,
  useCollabs,
  uploadIdeaMedia,
  deleteIdeaMedia,
  qk,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import type { IdeaStatus } from "@/lib/types";

const statusVariant: Record<IdeaStatus, "default" | "outline" | "solid" | "muted"> = {
  draft: "muted",
  published: "default",
  converted: "solid",
};

const statusLabel: Record<IdeaStatus, string> = {
  draft: "Draft",
  published: "Live",
  converted: "Converted to campaign",
};

export default function IdeaDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const idea = useIdea(slug ?? "");
  const me = useMe();
  const ideaNumericId = idea.data?.id ?? 0;
  const publish = usePublishIdea(ideaNumericId);
  const del = useDeleteIdea(ideaNumericId);
  const toggleInterest = useToggleInterest(ideaNumericId);
  const convert = useConvertIdea(ideaNumericId);

  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!idea.data) return;
    ga.viewItem({
      id: String(idea.data.id),
      name: idea.data.title,
      category: idea.data.category,
      contentType: "idea",
    });
  }, [idea.data?.id]);

  if (idea.isLoading) {
    return (
      <div className="container-edge py-16 md:py-20 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!idea.data) {
    return (
      <div className="container-edge py-16 md:py-20 text-center">
        <div className="italic-display text-2xl">Idea not found.</div>
      </div>
    );
  }

  const o = idea.data;
  const isOwner = me.data?.user_id === o.owner_id;
  const canInterest = !!me.data && !isOwner && o.status === "published";
  const qc = useQueryClient();

  async function handlePublish() {
    try {
      await publish.mutateAsync();
      toast.success("Idea is now live.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleDelete() {
    try {
      await del.mutateAsync();
      toast.success("Idea deleted.");
      navigate("/profile/ideas");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleInterest() {
    try {
      const res = await toggleInterest.mutateAsync();
      if (idea.data) ga.ideaInterest({ ideaId: idea.data.id, interested: res.interested });
      toast.success(res.interested ? "You're interested!" : "Interest removed.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleConvert() {
    try {
      const res = await convert.mutateAsync();
      toast.success("Campaign draft created. Add goals, tiers, and documents.");
      navigate(`/create/${res.campaign_slug ?? res.campaign_id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const pageDescription = o.subtitle || o.description || "A new idea on OrderRiot";
  const pageImage = o.media_urls?.[0];

  return (
    <>
    <Helmet>
      <title>{o.title} — OrderRiot</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={o.title} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="article" />
      {pageImage && <meta property="og:image" content={pageImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={o.title} />
      <meta name="twitter:description" content={pageDescription} />
      {pageImage && <meta name="twitter:image" content={pageImage} />}
    </Helmet>
    <div className="container-edge py-16 md:py-20 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Badge variant={statusVariant[o.status]}>{statusLabel[o.status]}</Badge>
          {o.category && (
            <span className="text-xs border border-line px-2 py-0.5 text-muted-foreground">
              {o.category}
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight">{o.title}</h1>
        {o.subtitle && (
          <p className="mt-2 text-lg text-muted-foreground">{o.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-muted-foreground">
          {o.rough_goal != null && <span>~{formatMoney(o.rough_goal)} target</span>}
          {o.target_audience && <span>For: {o.target_audience}</span>}
          <span>{new Date(o.created_at).toLocaleDateString("en-IN")}</span>
        </div>
        {o.tags && o.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {o.tags.map((tag: string) => (
              <span key={tag} className="border border-line px-2 py-0.5 text-[11px] text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Story (rich text) */}
      {o.story && (
        <div
          className="story-content mb-10"
          dangerouslySetInnerHTML={{ __html: o.story }}
        />
      )}

      {/* Legacy plain-text description fallback */}
      {!o.story && o.description && (
        <div className="mb-10 text-muted-foreground leading-relaxed text-sm">
          <p>{o.description}</p>
        </div>
      )}

      {/* Media */}
      {((o.media_urls && o.media_urls.length > 0) || isOwner) && o.status !== "converted" && (
        <IdeaMediaSection ideaId={o.id} mediaUrls={o.media_urls ?? []} isOwner={isOwner} />
      )}

      {/* Converted: link to campaign */}
      {o.status === "converted" && o.campaign_id && (
        <div className="border border-line p-5 mb-10 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm">This idea launched as a campaign.</div>
            <div className="text-xs text-muted-foreground mt-0.5">Check out the full campaign page.</div>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/campaigns/${o.campaign_slug ?? o.campaign_id}`}>
              View campaign
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Interest bar */}
      {o.status !== "converted" && (
        <div className="border-y border-line py-6 mb-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-semibold">{o.interest_count} people interested</div>
              <div className="text-xs text-muted-foreground">
                {o.status === "published"
                  ? "Express interest to get notified when this becomes a campaign."
                  : "Publish to start collecting interest."}
              </div>
            </div>
          </div>

          {canInterest && (
            <Button
              size="sm"
              variant={o.user_interested ? "outline" : "default"}
              onClick={handleInterest}
              disabled={toggleInterest.isPending}
            >
              {o.user_interested ? "Remove interest" : "I'm interested"}
            </Button>
          )}

          {!me.data && o.status === "published" && (
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Sign in to express interest</Link>
            </Button>
          )}
        </div>
      )}

      {/* Risks & challenges */}
      {o.risks && (
        <div className="mb-10 border-t border-line pt-8">
          <h2 className="font-display text-xl font-semibold mb-4">Risks &amp; Challenges</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{o.risks}</p>
        </div>
      )}

      {/* FAQs */}
      {o.faqs && o.faqs.length > 0 && (
        <div className="mb-10 border-t border-line pt-8">
          <h2 className="font-display text-xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {(o.faqs as Array<{ question: string; answer: string }>).map((faq, i) => (
              <div key={i} className="border-b border-line pb-5 last:border-0">
                <div className="font-medium text-sm mb-1.5">{faq.question}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owner actions */}
      {isOwner && (
        <div className="flex flex-wrap gap-3">
          {o.status === "draft" && (
            <Button onClick={handlePublish} disabled={publish.isPending} className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Publish idea
            </Button>
          )}

          {o.status === "published" && (
            <Button onClick={handleConvert} disabled={convert.isPending} className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              {convert.isPending ? "Converting..." : "Convert to campaign"}
            </Button>
          )}

          {o.status !== "converted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/ideas/${o.slug ?? o.id}/edit`)}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}

          {o.status !== "converted" && !showDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="text-muted-foreground gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}

          {showDelete && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Delete this idea? This can't be undone.</span>
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={del.isPending}>
                Delete idea
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Collab posts linked to this idea */}
      <IdeaCollabSection ideaId={o.id} isOwner={isOwner} />
    </div>
    </>
  );
}

// ── Collab section ───────────────────────────────────────────────

function IdeaCollabSection({ ideaId, isOwner }: { ideaId: number; isOwner: boolean }) {
  const collabs = useCollabs({ idea_id: ideaId });

  if (collabs.isLoading) return null;

  return (
    <div className="mt-12 border-t border-line pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold">Collaborations</h2>
        {isOwner && (
          <Link
            to={`/collabs/new`}
            className="text-xs border border-line px-3 py-1.5 text-muted-foreground hover:border-ink hover:text-ink transition-colors"
          >
            Post a collab
          </Link>
        )}
      </div>

      {(!collabs.data || collabs.data.length === 0) ? (
        <div className="text-sm text-muted-foreground">
          {isOwner
            ? "No collab posts yet. Post one to invite collaborators."
            : "No open collaborations for this idea."}
        </div>
      ) : (
        <div className="space-y-4">
          {collabs.data.map((post) => (
            <Link
              key={post.id}
              to={`/collabs/${post.slug ?? post.id}`}
              className="flex items-start justify-between gap-4 border border-line p-5 hover:bg-muted/30 transition-colors group"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm group-hover:underline underline-offset-4">
                  {post.title}
                </div>
                {post.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.description}</p>
                )}
                {post.skills && post.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {post.skills.map((s, i) => (
                      <span key={i} className="text-xs border border-line px-2 py-0.5 text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {post.support_type && (
                  <span className="text-xs border border-line px-2 py-0.5 text-muted-foreground">
                    {post.support_type}
                  </span>
                )}
                {post.call_type !== "outreach" && (
                  <span className="text-xs text-muted-foreground">
                    {post.response_count > 0 ? `${post.response_count} response${post.response_count !== 1 ? "s" : ""}` : "Reach out"}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Media section ────────────────────────────────────────────────

function IdeaMediaSection({
  ideaId, mediaUrls, isOwner,
}: { ideaId: number; mediaUrls: string[]; isOwner: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      await uploadIdeaMedia(ideaId, Array.from(files));
      qc.invalidateQueries({ queryKey: qk.idea(ideaId) });
      toast.success("Media uploaded.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(url: string) {
    try {
      await deleteIdeaMedia(ideaId, url);
      qc.invalidateQueries({ queryKey: qk.idea(ideaId) });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold">Designs &amp; media</h2>
        {isOwner && mediaUrls.length < 8 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink transition-colors border border-line px-3 py-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Add media"}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {mediaUrls.length === 0 && isOwner && (
        <div
          className="border-2 border-dashed border-line hover:border-ink transition-colors cursor-pointer p-10 text-center"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Upload mockups, sketches, renders, or demo media</p>
        </div>
      )}

      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mediaUrls.map((url, i) => {
            const isVideo = url.match(/\.(mp4|mov|webm|avi)(\?|$)/i);
            return (
              <div key={i} className="relative group border border-line">
                {isVideo ? (
                  <VideoPlayer src={url} className="h-40 w-full" />
                ) : (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Media ${i + 1}`} className="h-40 w-full object-cover hover:opacity-90 transition-opacity" />
                  </a>
                )}
                {isOwner && (
                  <button
                    onClick={() => handleRemove(url)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 bg-ink/80 text-paper rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

