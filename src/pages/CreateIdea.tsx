import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCreateIdea,
  useMe,
  useUpdateIdea,
  uploadIdeaMedia,
  uploadStoryImage,
  deleteIdeaMedia,
  reorderIdeaMedia,
  qk,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { VisibilityPicker } from "@/components/ui/VisibilityPicker";
import type { Idea, FaqItem, Visibility } from "@/lib/types";
import { StoryEditor } from "@/components/idea/StoryEditor";
import { SortableMedia } from "@/components/idea/SortableMedia";

type Step = "basics" | "story" | "media" | "risks" | "extras";

const STEPS: { key: Step; label: string; caption: string }[] = [
  { key: "basics",  label: "Basics",     caption: "Title, category & audience" },
  { key: "story",   label: "Your story", caption: "Tell it how you want" },
  { key: "media",   label: "Media",      caption: "Visuals & demos" },
  { key: "risks",   label: "Risks",      caption: "Challenges you foresee" },
  { key: "extras",  label: "FAQs & tags", caption: "Help people find & understand you" },
];

const CATEGORIES = [
  "Technology", "Design", "Film", "Music", "Food", "Fashion",
  "Games", "Education", "Social Impact", "Health", "Environment", "Other",
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0 mb-12 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 flex items-center justify-center text-xs font-semibold border transition-colors ${
              i < idx ? "bg-ink text-paper border-ink" : i === idx ? "border-ink text-ink" : "border-line text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i === idx ? "text-ink font-medium" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-6 mx-2 ${i < idx ? "bg-ink" : "bg-line"}`} />}
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

  const [step, setStep] = useState<Step>("basics");
  const [draft, setDraft] = useState<Idea | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Step 2
  const [story, setStory] = useState("");

  // Step 3
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 4
  const [risks, setRisks] = useState("");

  // Step 5
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");

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

  const stepInfo = STEPS.find((s) => s.key === step)!;
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  // ── Step navigation helpers ──────────────────────────────────────

  async function handleBasicsContinue() {
    if (!title.trim()) return;
    try {
      if (!draft) {
        const idea = await createIdea.mutateAsync({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          category: category || undefined,
          target_audience: targetAudience.trim() || undefined,
        });
        setDraft(idea);
      } else {
        await updateIdea.mutateAsync({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          category: category || undefined,
          target_audience: targetAudience.trim() || undefined,
        });
      }
      setStep("story");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleStoryContinue() {
    if (!draft) return;
    try {
      await updateIdea.mutateAsync({ story: story || undefined });
      setStep("media");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleMediaContinue() {
    setStep("risks");
  }

  async function handleRisksContinue() {
    if (!draft) return;
    try {
      await updateIdea.mutateAsync({ risks: risks.trim() || undefined });
      setStep("extras");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleFinish() {
    if (!draft) return;
    try {
      await updateIdea.mutateAsync({
        faqs: faqs.length > 0 ? faqs : undefined,
        tags: tags.length > 0 ? tags : undefined,
        visibility,
      });
      localStorage.removeItem("create-idea-story");
      toast.success("Idea saved as draft. Publish it from the idea page.");
      navigate(`/ideas/${draft.slug ?? draft.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  // ── Media helpers ────────────────────────────────────────────────

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

  async function handleReorder(newOrder: string[]) {
    if (!draft) return;
    setMedia(newOrder);
    try {
      await reorderIdeaMedia(draft.id, newOrder);
      qc.invalidateQueries({ queryKey: qk.idea(draft.id) });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  // ── FAQ helpers ──────────────────────────────────────────────────

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }

  function updateFaq(i: number, field: keyof FaqItem, val: string) {
    setFaqs((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  }

  function removeFaq(i: number) {
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Tag helpers ──────────────────────────────────────────────────

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="bg-paper min-h-screen">
      {/* Sticky top bar */}
      <div className="border-b border-line bg-paper sticky top-16 z-30">
        <div className="container-edge py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="editorial-index">— Step {stepIdx + 1} of {STEPS.length}</span>
              <span className="font-display text-xl">
                {stepInfo.label}
                <span className="text-muted-foreground font-sans text-sm"> · {stepInfo.caption}</span>
              </span>
            </div>
            <button
              onClick={() => draft && navigate(`/ideas/${draft.slug ?? draft.id}`)}
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
            >
              {draft ? "Save & exit" : "Cancel"}
            </button>
          </div>
          {/* Progress */}
          <div className="mt-3 h-0.5 bg-line w-full">
            <div
              className="h-full bg-ink transition-all"
              style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container-edge py-12 md:py-16 max-w-4xl">
        {/* Step bar */}
        <StepBar current={step} />

        {/* ── Step 1: Basics ── */}
        {step === "basics" && (
          <div className="space-y-10">
            <div>
              <input
                className="w-full border-b border-line bg-transparent text-3xl md:text-4xl font-display font-bold outline-none pb-3 placeholder:text-muted-foreground/60 focus:border-ink transition-colors"
                placeholder="Give your idea a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                autoFocus
              />
              {title && (
                <input
                  className="w-full border-b border-line/50 bg-transparent text-lg text-muted-foreground outline-none pb-2 mt-4 placeholder:text-muted-foreground/40 focus:border-ink transition-colors"
                  placeholder="A short subtitle or tagline (optional)"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  maxLength={255}
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
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

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Target audience
              </label>
              <input
                className="w-full border-b border-line bg-transparent text-sm outline-none pb-2 placeholder:text-muted-foreground focus:border-ink transition-colors"
                placeholder="Who is this for? e.g. Independent filmmakers, small business owners in Tier-2 cities"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleBasicsContinue}
                disabled={!title.trim() || createIdea.isPending || updateIdea.isPending}
                className="gap-2"
              >
                {createIdea.isPending || updateIdea.isPending ? "Saving…" : "Continue to story"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Story ── */}
        {step === "story" && (
          <div className="space-y-6">
            <div>
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  Write freely. Use headings to structure your narrative, quotes to emphasize key points, and bullet lists to highlight features or benefits.
                </p>
              </div>
              <StoryEditor
                value={story}
                onChange={setStory}
                onUploadImage={draft ? (file) => uploadStoryImage(draft.id, file) : undefined}
                storageKey="create-idea-story"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("basics")}>Back</Button>
              <Button
                onClick={handleStoryContinue}
                disabled={updateIdea.isPending}
                className="gap-2"
              >
                {updateIdea.isPending ? "Saving…" : "Continue to media"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Media ── */}
        {step === "media" && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Upload mockups, sketches, renders, prototypes, or demo videos. Drag to reorder — the first image becomes the cover.
              </p>

              {media.length === 0 ? (
                <div
                  className="border-2 border-dashed border-line hover:border-ink transition-colors cursor-pointer p-12 text-center"
                  onClick={() => !uploading && fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "Uploading…" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Images and videos · up to 8 files</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <SortableMedia
                    urls={media}
                    onReorder={handleReorder}
                    onRemove={handleRemoveMedia}
                    onAddClick={() => fileRef.current?.click()}
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground">Uploading…</p>
                  )}
                </div>
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

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("story")}>Back</Button>
              <Button onClick={handleMediaContinue} className="gap-2">
                {media.length > 0 ? "Continue to risks" : "Skip, continue"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Risks & Challenges ── */}
        {step === "risks" && (
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Risks & challenges
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                Be honest about what could go wrong — known risks, unknowns you can identify, regulatory hurdles, technical challenges, or timeline uncertainties. Transparency builds trust.
              </p>
              <textarea
                className="w-full border border-line px-4 py-4 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-48 leading-relaxed placeholder:text-muted-foreground"
                placeholder="e.g. We're dependent on a third-party API that may change pricing. Manufacturing lead times are unpredictable. We haven't yet secured a distribution partner in Southeast Asia…"
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("media")}>Back</Button>
              <Button
                onClick={handleRisksContinue}
                disabled={updateIdea.isPending}
                className="gap-2"
              >
                {updateIdea.isPending ? "Saving…" : "Continue to FAQs & tags"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: FAQs & Tags ── */}
        {step === "extras" && (
          <div className="space-y-10">
            {/* FAQs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Frequently asked questions
                </label>
                <button
                  type="button"
                  onClick={addFaq}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ink transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add question
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Anticipate what potential backers or collaborators will ask. You can always add more after publishing.
              </p>

              {faqs.length === 0 && (
                <button
                  type="button"
                  onClick={addFaq}
                  className="w-full border border-dashed border-line py-6 text-sm text-muted-foreground hover:border-ink hover:text-ink transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add your first FAQ
                </button>
              )}

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-line p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground pt-2.5 shrink-0 w-4 text-right">{i + 1}</span>
                      <div className="flex-1 space-y-2">
                        <input
                          className="w-full border-b border-line bg-transparent text-sm font-medium outline-none pb-1.5 placeholder:text-muted-foreground focus:border-ink transition-colors"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => updateFaq(i, "question", e.target.value)}
                        />
                        <textarea
                          className="w-full bg-transparent text-sm text-muted-foreground outline-none resize-none h-20 leading-relaxed placeholder:text-muted-foreground/70"
                          placeholder="Answer"
                          value={faq.answer}
                          onChange={(e) => updateFaq(i, "answer", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Tags <span className="text-muted-foreground font-normal normal-case tracking-normal">(max 5, searchable)</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Add keywords that help people find this idea. e.g. "sustainability", "d2c", "hardware", "open-source"
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 border border-ink px-2.5 py-1 text-xs font-medium"
                  >
                    #{tag}
                    <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <div className="flex items-center gap-0 border border-line">
                    <input
                      className="w-28 bg-transparent px-3 py-1 text-xs outline-none placeholder:text-muted-foreground"
                      placeholder="Add a tag…"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-2 py-1 border-l border-line text-muted-foreground hover:text-ink transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{tags.length}/5 tags</p>
            </div>

            <div className="pt-4 border-t border-line">
              <div className="text-xs font-medium mb-2">Visibility</div>
              <VisibilityPicker value={visibility} onChange={setVisibility} className="mb-4" />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("risks")}>Back</Button>
                <Button onClick={handleFinish} disabled={updateIdea.isPending}>
                  {updateIdea.isPending ? "Saving…" : "Save idea"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
