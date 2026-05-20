/**
 * GA4 integration via gtag.js.
 * All exports are no-ops when VITE_GA_MEASUREMENT_ID is not set,
 * so dev builds never pollute production data.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

// ── Window augmentation ───────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void;
  }
}

// ── Internal gtag shim ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gtag(...args: any[]) {
  window.gtag?.(...args);
}

// ── Initialisation ────────────────────────────────────────────────────────────

export function initGA() {
  if (!GA_ID) return;

  // Dynamically inject the gtag.js library
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function () { window.dataLayer.push(arguments); };

  gtag("js", new Date());
  gtag("config", GA_ID, {
    send_page_view: false, // fired manually via ga.pageView() for SPA correctness
    anonymize_ip: true,
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export const ga = {
  /** Fire a page_view hit. Call on every route change. */
  pageView(path: string) {
    if (!GA_ID) return;
    gtag("event", "page_view", {
      page_location: window.location.origin + path,
      page_path: path,
      page_title: document.title,
    });
  },

  /** Associate subsequent events with a user. Pass null on logout. */
  setUser(userId: number | string | null) {
    if (!GA_ID) return;
    gtag("config", GA_ID, { user_id: userId ?? undefined });
  },

  /** Fire a login event (GA4 recommended event). */
  login(method: "email" | "google") {
    if (!GA_ID) return;
    gtag("event", "login", { method });
  },

  /** Fire a sign_up event (GA4 recommended event). */
  signUp(method: "email" | "google") {
    if (!GA_ID) return;
    gtag("event", "sign_up", { method });
  },

  /** Fire a view_item event — used for campaigns and ideas. */
  viewItem(params: {
    id: string;
    name: string;
    category?: string | null;
    contentType: "campaign" | "idea";
    value?: number;
  }) {
    if (!GA_ID) return;
    gtag("event", "view_item", {
      items: [
        {
          item_id: params.id,
          item_name: params.name,
          item_category: params.contentType,
          item_variant: params.category ?? undefined,
          price: params.value,
          quantity: 1,
        },
      ],
    });
  },

  /** Fire begin_checkout when a user opens the pledge dialog. */
  beginCheckout(params: { campaignId: number; campaignTitle: string; rewardTitle?: string }) {
    if (!GA_ID) return;
    gtag("event", "begin_checkout", {
      campaign_id: params.campaignId,
      campaign_title: params.campaignTitle,
      reward_title: params.rewardTitle,
    });
  },

  /** Fire purchase on successful pledge. GA4 e-commerce standard. */
  purchase(params: { campaignId: number; campaignTitle: string; amount: number }) {
    if (!GA_ID) return;
    gtag("event", "purchase", {
      transaction_id: `pledge_${params.campaignId}_${Date.now()}`,
      value: params.amount,
      currency: "INR",
      items: [
        {
          item_id: String(params.campaignId),
          item_name: params.campaignTitle,
          item_category: "campaign",
          price: params.amount,
          quantity: 1,
        },
      ],
    });
  },

  /** Custom: fired when a campaign draft is submitted for review. */
  campaignSubmitted(params: { campaignId: number }) {
    if (!GA_ID) return;
    gtag("event", "campaign_submitted", { campaign_id: params.campaignId });
  },

  /** Custom: fired when a user toggles interest on an idea. */
  ideaInterest(params: { ideaId: number; interested: boolean }) {
    if (!GA_ID) return;
    gtag("event", "idea_interest", {
      idea_id: params.ideaId,
      interested: params.interested,
    });
  },
};
