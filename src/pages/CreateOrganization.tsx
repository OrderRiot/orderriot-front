import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateOrganization, useMe } from "@/lib/queries";
import { apiError } from "@/lib/api";
import type { OrgCreatePayload, OrgType, EntityType } from "@/lib/types";

type Step = "basics" | "details" | "story" | "review";
const STEPS: Step[] = ["basics", "details", "story", "review"];

const ORG_TYPES: { value: OrgType; label: string; hint: string }[] = [
  { value: "marketing",     label: "Marketing",       hint: "Marketing, branding, or growth agencies" },
  { value: "investors",     label: "Investors",        hint: "Angel investors, VCs, or funding bodies" },
  { value: "incubators",    label: "Incubators",       hint: "Startup incubators and accelerators" },
  { value: "manufacturers", label: "Manufacturers",    hint: "Product design, fabrication, factories" },
  { value: "av_production", label: "A/V Production",   hint: "Audio/video production houses" },
  { value: "consultancy",   label: "Consultancy",      hint: "Strategy, management, or domain consulting" },
  { value: "software",      label: "Software Support", hint: "IT, software, or tech service providers" },
  { value: "other",         label: "Other",            hint: "None of the above" },
];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "solo",        label: "Solo / Individual" },
  { value: "pvt_ltd",     label: "Private Limited" },
  { value: "llc",         label: "LLC" },
  { value: "partnership", label: "Partnership" },
  { value: "ngo",         label: "NGO / Non-profit" },
  { value: "trust",       label: "Trust" },
  { value: "other",       label: "Other" },
];

function StepIndicator({ current, steps }: { current: Step; steps: Step[] }) {
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-6 w-6 flex items-center justify-center text-xs font-semibold border transition-colors ${
              i < idx
                ? "bg-ink text-paper border-ink"
                : i === idx
                ? "border-ink text-ink"
                : "border-line text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs capitalize ${
              i === idx ? "text-ink font-medium" : "text-muted-foreground"
            }`}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 ${i < idx ? "bg-ink" : "bg-line"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreateOrganization() {
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();
  const me = useMe();

  const [step, setStep] = useState<Step>("basics");
  const [form, setForm] = useState<Partial<OrgCreatePayload>>({});

  if (me.isSuccess && !me.data?.isverified) {
    return (
      <div className="container-edge py-20 max-w-2xl">
        <div className="border border-line p-10 space-y-4">
          <div className="editorial-index">— Access required</div>
          <h1 className="font-display text-display-sm">Identity verification required</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You must verify your identity before creating an organization. Upload your ID proof from profile settings.
          </p>
          <div className="flex gap-3 pt-2">
            <Button asChild><Link to="/profile/settings">Go to settings</Link></Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>
      </div>
    );
  }

  function set(key: keyof OrgCreatePayload, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canAdvanceBasics() {
    return form.name?.trim() && form.org_type && form.entity_type;
  }

  async function handleSubmit() {
    if (!form.name || !form.org_type || !form.entity_type) return;
    try {
      const org = await createOrg.mutateAsync(form as OrgCreatePayload);
      toast.success("Organization created. Pending admin review.");
      navigate(`/organizations/${org.slug ?? org.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-16 md:py-20 max-w-4xl">
      <div className="mb-10">
        <div className="editorial-index">— New</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Create an <span className="italic-display">organization</span>.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm max-w-md">
          Organizations let you build teams, showcase portfolios, and run campaigns under a verified entity.
        </p>
      </div>

      <StepIndicator current={step} steps={STEPS} />

      {/* ── Step 1: Basics ── */}
      {step === "basics" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Organization name
            </label>
            <input
              className="w-full border border-line px-4 py-3 text-base bg-transparent focus:outline-none focus:border-ink"
              placeholder="e.g. Pixel & Co, Sunrise Films"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-3">
              Organization type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ORG_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set("org_type", t.value)}
                  className={`border p-3 text-left transition-colors ${
                    form.org_type === t.value
                      ? "border-ink bg-ink text-paper"
                      : "border-line hover:border-ink"
                  }`}
                >
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div
                    className={`text-xs mt-0.5 leading-tight ${
                      form.org_type === t.value ? "text-paper/70" : "text-muted-foreground"
                    }`}
                  >
                    {t.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-3">
              Legal entity type
            </label>
            <div className="flex flex-wrap gap-2">
              {ENTITY_TYPES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => set("entity_type", e.value)}
                  className={`px-4 py-2 border text-sm transition-colors ${
                    form.entity_type === e.value
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-muted-foreground hover:border-ink hover:text-ink"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Founded year */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Founded year
              <span className="ml-2 font-normal text-muted-foreground normal-case">optional</span>
            </label>
            <input
              type="number"
              className="w-40 border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink"
              placeholder="e.g. 2018"
              min={1900}
              max={new Date().getFullYear()}
              value={form.founded_year ?? ""}
              onChange={(e) => set("founded_year", e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>

          <div className="pt-2">
            <Button onClick={() => setStep("details")} disabled={!canAdvanceBasics()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {step === "details" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-28"
              placeholder="What does your organization do? Who is it for?"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Website
            </label>
            <input
              className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink"
              placeholder="https://yourwebsite.com"
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              License / registration number
              <span className="ml-2 font-normal text-muted-foreground normal-case">optional</span>
            </label>
            <input
              className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink"
              placeholder="CIN, GSTIN, or any official number"
              value={form.license_number ?? ""}
              onChange={(e) => set("license_number", e.target.value)}
            />
          </div>

          {/* Ecosystem tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Ecosystem / industries
              <span className="ml-2 font-normal text-muted-foreground normal-case">optional — press Enter to add</span>
            </label>
            <EcosystemTagInput
              tags={form.ecosystem_access ?? []}
              onChange={(tags) => set("ecosystem_access", tags)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("basics")}>Back</Button>
            <Button onClick={() => setStep("story")}>Continue</Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Story ── */}
      {step === "story" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Our Story
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Tell visitors about your history, journey, and what makes your organization unique. This appears prominently on your org page.
            </p>
            <textarea
              className="w-full border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink resize-none h-52"
              placeholder="We started in 2019 with a small team in Pune, driven by a belief that Indian manufacturers deserved a direct channel to consumers..."
              value={form.history ?? ""}
              onChange={(e) => set("history", e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {(form.history ?? "").length} chars
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("details")}>Back</Button>
            <Button onClick={() => setStep("review")}>Review</Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="border border-line divide-y divide-line">
            {[
              ["Name", form.name],
              ["Type", ORG_TYPES.find((t) => t.value === form.org_type)?.label],
              ["Entity", ENTITY_TYPES.find((e) => e.value === form.entity_type)?.label],
              ["Founded", form.founded_year ?? "—"],
              ["Description", form.description || "—"],
              ["Website", form.website || "—"],
              ["License no.", form.license_number || "—"],
              ["Ecosystem", (form.ecosystem_access ?? []).join(", ") || "—"],
              ["Story", form.history ? `${form.history.slice(0, 80)}${form.history.length > 80 ? "..." : ""}` : "—"],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex gap-4 px-5 py-3">
                <div className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</div>
                <div className="text-sm">{String(value)}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Your organization will be submitted for admin verification before it becomes publicly visible.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("story")}>Back</Button>
            <Button onClick={handleSubmit} disabled={createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create organization"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ecosystem tag input ───────────────────────────────────────────

function EcosystemTagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  function addTag() {
    const val = input.trim();
    if (!val || tags.includes(val)) { setInput(""); return; }
    onChange([...tags, val]);
    setInput("");
  }

  function removeTag(t: string) {
    onChange(tags.filter((x) => x !== t));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-8">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs border border-line px-2 py-1">
            {t}
            <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-destructive">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border border-line px-3 py-2 text-sm bg-transparent flex-1 focus:outline-none focus:border-ink"
          placeholder="e.g. FMCG, Automotive, Fintech"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        />
        <Button size="sm" variant="outline" onClick={addTag} disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
