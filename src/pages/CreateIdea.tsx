import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateIdea, useMe, useUpdateIdea, uploadIdeaMedia, deleteIdeaMedia, qk } from "@/lib/queries";
import { apiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Idea } from "@/lib/types";

type Step = "core" | "context" | "media" | "review";
const STEPS: Step[] = ["core", "context", "media", "review"];
const STEP_LABELS: Record<Step, string> = {
  core: "Core",
  context: "Context",
  media: "Media",
  review: "Review",
};

const CATEGORIES = [
  "Technology", "Design", "Film", "Music", "Food", "Fashion",
  "Games", "Education", "Social Impact", "Health", "Environment", "Other",
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 flex items-center justify-center text-xs font-semibold border transition-colors ${
              i < idx ? "bg-ink text-paper border-ink" : i === idx ? "border-ink text-ink" : "border-line text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs ${i === idx ? "text-ink font-medium" : "text-muted-foreground"}`}>
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-8 mx-2 ${i < idx ? "bg-ink" : "bg-line"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function CreateIdea() {
  const navigate = useNavigate();
  const me = useMe();
  const createIdea = useCreateIdea();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("core");
  const [draft, setDraft] = useState<Idea | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateIdea = useUpdateIdea(draft?.id ?? 0);

  if (me.data && !me.data.isverified) {
    return (
      <div className="container-edge py-20 max-w-xl text-center">
        <div className="italic-display text-2xl mb-4">Verification required.</div>
        <p className="text-muted-foreground text-sm mb-6">
          Complete identity verification on your profile before posting ideas.
        </p>
        <Button variant="outline" onClick={() => navigate("/profile")}>Go to profile</Button>
      </div>
    );
  }

  // ── Step 1 → 2: create draft idea ───────────────────────────────
  async function advanceToContext() {
    if (!title.trim()) return;
    try {
      const idea = await createIdea.mutateAsync({
        title: title.trim(),
        description: description || undefined,
        category: category || undefined,
      });
      setDraft(idea);
      setStep("context");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  // ── Step 2 → 3: save context fields ─────────────────────────────
  async function advanceToMedia() {
    if (!draft) return;
    try {
      await updateIdea.mutateAsync({
        target_audience: targetAudience || undefined,
      });
      setStep("media");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  // ── Media upload ─────────────────────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files || !draft) return;
    setUploading(true);
    try {
      const updated = await uploadIdeaMedia(draft.id, Array.from(files));
      setMedia(updated);
      qc.invalidateQueries({ queryKey: qk.idea(draft.id) });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveMedia(url: string) {
    if (!draft) return;
    try {
      await deleteIdeaMedia(draft.id, url);
      setMedia((prev) => prev.filter((u) => u !== url));
      qc.invalidateQueries({ queryKey: qk.idea(draft.id) });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  // ── Final: go to idea detail page ───────────────────────────────
  function finish() {
    if (!draft) return;
    toast.success("Idea saved as draft. Publish it from the idea page.");
    navigate(`/ideas/${draft.id}`);
  }

  return (
    <div className="container-edge py-16 md:py-20 max-w-2xl">
      <div className="mb-10">
        <div className="editorial-index">— New idea</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Share an <span className="italic-display">idea</span>.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm max-w-md">
          Post your concept, gauge interest, and convert to a full campaign when ready.
        </p>
      </div>

      <StepBar current={step} />

      {/* ── Step 1: Core ── */}
      {step === "core" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full border border-line px-4 py-3 text-base bg-transparent focus:outline-none focus:border-ink"
              placeholder="What's the idea in one line?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-36"
              placeholder="Describe the problem you're solving and what you're building…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-3">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(category === c ? "" : c)}
                  className={`px-3 py-1.5 border text-sm transition-colors ${
                    category === c
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-muted-foreground hover:border-ink hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={advanceToContext}
              disabled={!title.trim() || createIdea.isPending}
            >
              {createIdea.isPending ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Context ── */}
      {step === "context" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Target audience
            </label>
            <input
              className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink"
              placeholder="Who is this for? e.g. Independent filmmakers, small business owners in Tier-2 cities"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="border border-line p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Funding goals, reward tiers, and legal documents are set when you convert this idea to a campaign. Keep it lightweight for now.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("core")}>Back</Button>
            <Button onClick={advanceToMedia} disabled={updateIdea.isPending}>
              {updateIdea.isPending ? "Saving..." : "Continue to media"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Media ── */}
      {step === "media" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Designs &amp; media
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              Upload mockups, sketches, renders, demo photos, or any visuals that help explain the idea. Images and videos accepted.
            </p>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-line hover:border-ink transition-colors cursor-pointer p-10 text-center"
              onClick={() => !uploading && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Images and videos, up to 8 files</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Media previews */}
          {media.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.map((url, i) => {
                const isVideo = url.match(/\.(mp4|mov|webm|avi)(\?|$)/i);
                return (
                  <div key={i} className="relative group border border-line">
                    {isVideo ? (
                      <video src={url} className="h-32 w-full object-cover" preload="metadata" />
                    ) : (
                      <img src={url} alt={`Media ${i + 1}`} className="h-32 w-full object-cover" />
                    )}
                    <button
                      onClick={() => handleRemoveMedia(url)}
                      className="absolute top-1 right-1 h-6 w-6 bg-ink/80 text-paper rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {media.length < 8 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="h-32 border border-dashed border-line flex items-center justify-center text-muted-foreground hover:border-ink hover:text-ink transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("context")}>Back</Button>
            <Button onClick={() => setStep("review")}>
              {media.length > 0 ? "Continue to review" : "Skip, continue"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === "review" && draft && (
        <div className="space-y-6">
          <div className="border border-line divide-y divide-line">
            {[
              ["Title", draft.title],
              ["Description", description || "—"],
              ["Category", category || "—"],
              ["Target audience", targetAudience || "—"],
              ["Media", media.length > 0 ? `${media.length} file${media.length !== 1 ? "s" : ""} uploaded` : "None"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-5 py-3">
                <div className="text-xs text-muted-foreground w-36 shrink-0 pt-0.5">{label}</div>
                <div className="text-sm">{value}</div>
              </div>
            ))}
          </div>

          <div className="border border-line bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
            Saved as a draft. You can publish it, edit details, and add more media from the idea page. Funding goals, reward tiers, and documents are collected when you convert to a campaign.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("media")}>Back</Button>
            <Button onClick={finish}>Save idea</Button>
          </div>
        </div>
      )}
    </div>
  );
}
