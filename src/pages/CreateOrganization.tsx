import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateOrganization } from "@/lib/queries";
import { apiError } from "@/lib/api";
import type { OrgCreatePayload, OrgType, EntityType } from "@/lib/types";

type Step = "basics" | "details" | "review";
const STEPS: Step[] = ["basics", "details", "review"];

const ORG_TYPES: { value: OrgType; label: string; hint: string }[] = [
  { value: "personal", label: "Personal", hint: "Individual creator or freelancer" },
  { value: "studio", label: "Studio", hint: "Small creative team or production house" },
  { value: "agency", label: "Agency", hint: "Service agency or consultancy" },
  { value: "brand", label: "Brand", hint: "Consumer brand or product company" },
  { value: "ngo", label: "NGO", hint: "Non-profit or charitable organization" },
  { value: "other", label: "Other", hint: "None of the above" },
];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "solo", label: "Solo / Individual" },
  { value: "pvt_ltd", label: "Private Limited" },
  { value: "llc", label: "LLC" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
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

  const [step, setStep] = useState<Step>("basics");
  const [form, setForm] = useState<Partial<OrgCreatePayload>>({});

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
      navigate(`/organizations/${org.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="container-edge py-16 md:py-20 max-w-2xl">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ORG_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set("org_type", t.value)}
                  className={`border p-4 text-left transition-colors ${
                    form.org_type === t.value
                      ? "border-ink bg-ink text-paper"
                      : "border-line hover:border-ink"
                  }`}
                >
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div
                    className={`text-xs mt-0.5 ${
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

          <div className="pt-2">
            <Button
              onClick={() => setStep("details")}
              disabled={!canAdvanceBasics()}
            >
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

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("basics")}>Back</Button>
            <Button onClick={() => setStep("review")}>Review</Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="border border-line divide-y divide-line">
            {[
              ["Name", form.name],
              ["Type", ORG_TYPES.find((t) => t.value === form.org_type)?.label],
              ["Entity", ENTITY_TYPES.find((e) => e.value === form.entity_type)?.label],
              ["Description", form.description || "—"],
              ["Website", form.website || "—"],
              ["License no.", form.license_number || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-5 py-3">
                <div className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</div>
                <div className="text-sm">{value}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Your organization will be submitted for admin verification before it becomes publicly visible.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("details")}>Back</Button>
            <Button onClick={handleSubmit} disabled={createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create organization"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
