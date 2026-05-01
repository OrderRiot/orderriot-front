# OrderRiot — frontend

Web app for OrderRiot, a Kickstarter-style platform. Pairs with the FastAPI backend in `../orderriot-back`.

## Stack

- **Vite 6** + **React 18** + **TypeScript**
- **Tailwind CSS 3** + handpicked **shadcn/ui** primitives (sharp corners, hairline borders — not the default rounded-blob look)
- **React Router v6** (data router)
- **TanStack Query v5** for server state
- **React Hook Form + Zod** for validation
- **Axios** with auto-refresh interceptor for JWTs
- **Sonner** for toasts

## Design direction

Editorial / Swiss-typographic. Black on warm off-white (`#0E0E0C` ink on `#FAFAF7` paper — never pure black/white). Display serif **Instrument Serif** (Google Fonts) paired with **Geist Sans** body and **Geist Mono** for figures. Hairline 1px borders. No drop shadows. Asymmetric grids with editorial index numerals (`№ 001`, `01 / 06`).

All design tokens live in `src/index.css` (`--paper`, `--ink`, `--line`, `--muted`) and `tailwind.config.ts`.

## Getting started

```bash
cd orderriot-front
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` — the backend is already CORS-configured for that origin.

Set `VITE_API_URL` in `.env` if your backend runs anywhere other than `http://localhost:8000`.

## Pages implemented

| Route | What it does |
| --- | --- |
| `/` | Landing — hero, manifesto, trending campaigns, inverse band, how-it-works, CTA |
| `/login`, `/register` | Auth — auto-login after register |
| `/discover` | Browse + filter campaigns (category, search, sort) |
| `/campaigns/:id` | Detail page — gallery, sticky pledge column, story, rewards, comments, back-flow dialog |
| `/create`, `/create/:id` | Multi-step campaign creation: basics → story → goal → media → rewards → review/launch |
| `/profile` | Edit your profile, change avatar, switch role |
| `/profile/campaigns` | Your campaigns (with status, progress) |
| `/profile/contributions` | Things you've backed |
| `/users/:id` | Public profile |
| `/about`, `*` | About page, 404 |

## Backend mapping

Every endpoint in `orderriot-back/app/routers/*.py` is wired up in `src/lib/queries.ts`:

- `auth.py` → `useLogin`, `useRegister`, `useLogout`, refresh interceptor in `api.ts`
- `users.py` → `useMe`, `useUpdateMe`, `useUser`
- `campaigns.py` → `useCampaigns`, `useCampaign`, `useMyCampaigns`, `useCreateCampaign`, `useUpdateCampaign`, `useLaunchCampaign`, `useCancelCampaign`, `useRewards`, `useAddReward`
- `contributions.py` → `useBackCampaign`, `useMyContributions`
- `comments.py` → `useComments`, `usePostComment`, `useReactToComment`, `useReactionCounts`
- `uploads.py` → `uploadAvatar`, `uploadCampaignMedia`

## Project layout

```
src/
├── components/
│   ├── campaign/   ← CampaignCard, MediaGallery, RewardTier, BackDialog, Comments, ProgressBar
│   ├── layout/     ← AppLayout, Navbar, Footer, ProtectedRoute
│   └── ui/         ← shadcn primitives, theme-tuned
├── lib/
│   ├── api.ts      ← axios client + 401 refresh
│   ├── auth-store.ts
│   ├── queries.ts  ← all React Query hooks, typed against backend
│   ├── types.ts    ← mirrors backend pydantic schemas
│   └── utils.ts
├── pages/          ← one file per route
├── index.css       ← design tokens, fluid type scale, editorial helpers
└── main.tsx        ← router + providers
```

## What's next (not yet built)

The user explicitly prioritized: landing, auth, profile, discover, campaign detail, and the create flow — those are done. Future work:

- Campaign updates feed (creator-side update posts)
- Reply threads in comments (the API supports it; UI shows top-level only)
- Search-as-you-type with debounce on `/discover`
- Real payment-gateway integration (the back-end currently stubs `transaction_ref`)
- Admin tooling for `payment_status` and campaign moderation
- Campaign-detail "Backers" tab + creator dashboard
- A **shared design-token JSON** that the future React Native / Compose app can consume so the brand stays consistent across web and mobile
