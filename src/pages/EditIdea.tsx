import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useIdea,
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
import type { FaqItem } from "@/lib/types";
import { StoryEditor } from "@/components/idea/StoryEditor";
import { SortableMedia } from "@/components/idea/SortableMedia";

type Step = "basics" | "story" | "media" | "risks" | "extras";

const STEPS: { key: Step; label: string; caption: string }[] = [
  { key: "basics",  label: "Basics",      caption: "Title, category & audience" },
  { key: "story",   label: "Your story",  caption: "Tell it how you want" },
  { key: "media",   label: "Media",       caption: "Visuals & demos" },
  { key: "risks",   label: "Risks",       caption: "Challenges you foresee" },
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

export default function EditIdea() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const me = useMe();
  const idea = useIdea(slug ?? "");
  const ideaId = idea.data?.id ?? 0;
  const qc = useQueryClient();
  const update = useUpdateIdea(ideaId);

  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState<Step>("basics");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const [story, setStory] = useState("");

  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [risks, setRisks] = useState("");

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  if (idea.isLoading) {
    return (
      <div className="container-edge py-16 md:py-20 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32" />
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

  if (me.data && me.data.user_id !== idea.data.owner_id) {
    return (
      <div className="container-edge py-16 md:py-20 text-center">
        <div className="italic-display text-2xl">Not your idea.</div>
      </div>
    );
  }

  if (!initialized && idea.data) {
    setTitle(idea.data.title ?? "");
    setSubtitle(idea.data.subtitle ?? "");
    setCategory(idea.data.category ?? "");
    setTargetAudience(idea.data.target_audience ?? "");
    setStory(idea.data.story ?? "");
    setMedia(idea.data.media_urls ?? []);
    setRisks(idea.data.risks ?? "");
    setFaqs(idea.data.faqs ?? []);
    setTags(idea.data.tags ?? []);
    setInitialized(true);
  }

  const stepInfo = STEPS.find((s) => s.key === step)!;
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  async function handleBasicsContinue() {
    if (!title.trim()) return;
    try {
      await update.mutateAsync({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        category: category || undefined,
        target_audience: targetAudience.trim() || undefined,
      });
      setStep("story");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleStoryContinue() {
    try {
      await update.mutateAsync({ story: story || undefined });
      setStep("media");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  function handleMediaContinue() {
    setStep("risks");
  }

  async function handleRisksContinue() {
    try {
      await update.mutateAsync({ risks: risks.trim() || undefined });
      setStep("extras");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleFinish() {
    try {
      await update.mutateAsync({
        faqs: faqs.length > 0 ? faqs : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      qc.invalidateQueries({ queryKey: qk.idea(slug ?? ideaId) });
      localStorage.removeItem(`edit-idea-story-${ideaId}`);
      toast.success("Idea updated.");
      navigate(`/ideas/${idea.data?.slug ?? ideaId}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      const updated = await uploadIdeaMedia(ideaId, Array.from(files));
      setMedia(updated);
      qc.invalidateQueries({ queryKey: qk.idea(slug ?? ideaId) });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveMedia(url: string) {
    try {
      await deleteIdeaMedia(ideaId, url);
      setMedia((prev) => prev.filter((u) => u !== url));
      qc.invalidateQueries({ queryKey: qk.idea(slug ?? ideaId) });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function handleReorder(newOrder: string[]) {
    setMedia(newOrder);
    try {
      await reorderIdeaMedia(ideaId, newOrder);
      qc.invalidateQueries({ queryKey: qk.idea(slug ?? ideaId) });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }

  function updateFaq(i: number, field: keyof FaqItem, val: string) {
    setFaqs((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  }

  function removeFaq(i: number) {
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

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
              onClick={() => navigate(`/ideas/${idea.data?.slug ?? ideaId}`)}
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
            >
              Back to idea
            </button>
          </div>
          <div className="mt-3 h-0.5 bg-line w-full">
            <div
              className="h-full bg-ink transition-all"
              style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container-edge py-12 md:py-16 max-w-4xl">
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
                placeholder="Who is this for?"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleBasicsContinue}
                disabled={!title.trim() || update.isPending}
                className="gap-2"
              >
                {update.isPending ? "Saving…" : "Continue to story"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Story ── */}
        {step === "story" && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Write freely. Use headings, quotes, and lists to structure your narrative.
              </p>
              <StoryEditor
                value={story}
                onChange={setStory}
                onUploadImage={(file) => uploadStoryImage(ideaId, file)}
                storageKey={`edit-idea-story-${ideaId}`}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("basics")}>Back</Button>
              <Button onClick={handleStoryContinue} disabled={update.isPending} className="gap-2">
                {update.isPending ? "Saving…" : "Continue to media"}
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
                Upload mockups, sketches, renders, or demo videos. Drag to reorder — the first image becomes the cover.
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
                  {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
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
                Be honest about what could go wrong. Transparency builds trust.
              </p>
              <textarea
                className="w-full border border-line px-4 py-4 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-48 leading-relaxed placeholder:text-muted-foreground"
                placeholder="e.g. We're dependent on a third-party API…"
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("media")}>Back</Button>
              <Button onClick={handleRisksContinue} disabled={update.isPending} className="gap-2">
                {update.isPending ? "Saving…" : "Continue to FAQs & tags"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: FAQs & Tags ── */}
        {step === "extras" && (
          <div className="space-y-10">
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
                Anticipate what potential backers or collaborators will ask.
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

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Tags <span className="text-muted-foreground font-normal normal-case tracking-normal">(max 5, searchable)</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Add keywords that help people find this idea.
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

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("risks")}>Back</Button>
              <Button onClick={handleFinish} disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
