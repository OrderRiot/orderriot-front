# OrderRiot Frontend — Design System Documentation

This document is the single source of truth for the OrderRiot frontend design language. Any human or AI agent working on this codebase **must** read this before making UI changes. The goal is to ensure every new feature, screen, or component feels like it was designed by the same hand.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Tech Stack](#2-tech-stack)
3. [File Structure](#3-file-structure)
4. [Design Tokens — CSS Variables](#4-design-tokens--css-variables)
5. [Typography System](#5-typography-system)
6. [Color System](#6-color-system)
7. [Spacing & Layout](#7-spacing--layout)
8. [Border Radius](#8-border-radius)
9. [Motion & Animation](#9-motion--animation)
10. [UI Component Library](#10-ui-component-library)
11. [Campaign Components](#11-campaign-components)
12. [Layout Components](#12-layout-components)
13. [Page Patterns](#13-page-patterns)
14. [Utility Classes](#14-utility-classes)
15. [Helper Functions](#15-helper-functions)
16. [Do's and Don'ts](#16-dos-and-donts)
17. [New Feature Checklist](#17-new-feature-checklist)

---

## 1. Design Philosophy

OrderRiot is a crowdfunding platform where creators launch real projects with real consequences. The design reflects this: **clean, confident, and modern** — not playful, not corporate, not editorial.

### Core Principles

**1. Clarity over cleverness.** Every element exists to communicate. If something doesn't help the user understand what to do or what they're looking at, remove it.

**2. Brand green is the signal color.** The accent green (`--accent`) is reserved for things that matter most: funded amounts, progress fills, primary CTAs, active states, category badges. Don't dilute it by using it decoratively.

**3. Hierarchy through weight, not style mixing.** We use two sans-serif fonts (Space Grotesk for headings, Plus Jakarta Sans for body). We do NOT mix in serif fonts or decorative typefaces. Hierarchy is expressed through font weight (400 → 700) and size, not font switching.

**4. Rounded but not bubbly.** Cards use `rounded-xl` (14px). Buttons use `rounded-lg` (10px) or `rounded-xl` (14px). Pills use `rounded-full`. Nothing is perfectly square anymore, but nothing is balloon-shaped either.

**5. White space is content.** Generous padding and margin is intentional. Resist the urge to fill empty space. Empty space creates visual breathing room and makes important content stand out.

**6. One primary action per view.** Each page or section has one dominant CTA. Supporting actions are ghost/outline/secondary. Never two green buttons side by side.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript | Strict TypeScript throughout |
| Build | Vite 6 | Dev server on port 5173 |
| Routing | React Router 6 | Client-side, see `src/main.tsx` |
| Styling | Tailwind CSS 3 + PostCSS | All styling via utility classes |
| Component base | Radix UI + Shadcn/ui | Headless, accessible primitives |
| State — server | TanStack React Query 5 | All API data |
| State — auth | Zustand + localStorage | Tokens keyed as `orderriot.access` / `orderriot.refresh` |
| Forms | React Hook Form + Zod | Validation at boundary only |
| HTTP | Axios | Interceptors auto-inject bearer tokens and handle 401 refresh |
| Icons | Lucide React | Use `h-4 w-4` (16px) as default size |
| Toasts | Sonner | Imported via `import { toast } from "sonner"` |
| Fonts | Google Fonts | Space Grotesk + Plus Jakarta Sans |

---

## 3. File Structure

```
orderriot-front/
├── index.html                    # Entry HTML, font link tags here
├── tailwind.config.ts            # Tailwind theme — EDIT THIS for tokens
├── src/
│   ├── index.css                 # Global CSS, :root variables, custom utilities
│   ├── main.tsx                  # App entry: Router, QueryClient, layout
│   ├── components/
│   │   ├── campaign/
│   │   │   ├── BackDialog.tsx    # Pledge/contribution modal
│   │   │   ├── CampaignCard.tsx  # Card with 3 variants: default / wide / compact
│   │   │   ├── Comments.tsx      # Comment thread
│   │   │   ├── MediaGallery.tsx  # Image/media gallery
│   │   │   ├── ProgressBar.tsx   # Green fill, h-1.5, rounded-full
│   │   │   └── RewardTier.tsx    # Reward tier card
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Wraps all pages: <Navbar /> + <Outlet /> + <Footer />
│   │   │   ├── Footer.tsx        # Site footer
│   │   │   ├── Navbar.tsx        # Sticky top nav
│   │   │   └── ProtectedRoute.tsx # Redirects unauthenticated users to /login
│   │   └── ui/                   # Shadcn/Radix primitives (ONLY edit when tokens change)
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── sonner.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       └── tooltip.tsx
│   ├── lib/
│   │   ├── api.ts                # Axios instance with token interceptors
│   │   ├── auth-store.ts         # Zustand auth store
│   │   ├── queries.ts            # All React Query hooks
│   │   ├── types.ts              # TypeScript interfaces (User, Campaign, Reward, etc.)
│   │   └── utils.ts              # cn(), formatMoney(), pct(), daysLeft(), timeAgo(), initials()
│   └── pages/
│       ├── About.tsx
│       ├── CampaignDetail.tsx
│       ├── CreateCampaign.tsx    # 6-step wizard
│       ├── Discover.tsx
│       ├── Landing.tsx
│       ├── Login.tsx
│       ├── MyCampaigns.tsx
│       ├── MyContributions.tsx
│       ├── NotFound.tsx
│       ├── Profile.tsx
│       ├── PublicProfile.tsx
│       └── Register.tsx
```

---

## 4. Design Tokens — CSS Variables

All tokens are defined in `src/index.css` as HSL values. Tailwind maps these via `tailwind.config.ts`.

```css
/* src/index.css :root */
--paper: 220 20% 99%;            /* #FAFBFF — main background, slightly cool white */
--ink: 222 20% 9%;               /* #0D0F17 — primary text, near-black with cool tint */
--muted: 220 14% 95%;            /* Light surface — used for card backgrounds, hover states */
--muted-foreground: 220 8% 46%;  /* Secondary text — labels, captions, placeholders */
--line: 220 10% 89%;             /* Borders and hairlines */
--accent: 152 60% 36%;           /* Brand green — Kickstarter-adjacent, used sparingly */
--accent-foreground: 0 0% 100%;  /* White — text on top of accent green */
--destructive: 0 72% 52%;        /* Red — errors, delete actions */
--destructive-foreground: 0 0% 100%; /* White on destructive red */
```

### Tailwind color classes

| Class | Maps to | Hex (approx) | Use for |
|---|---|---|---|
| `bg-paper` / `text-paper` | `--paper` | #FAFBFF | Page backgrounds, inverse text |
| `bg-ink` / `text-ink` | `--ink` | #0D0F17 | Primary text, dark surfaces |
| `bg-muted` | `--muted` | #F3F4F8 | Card surfaces, input tracks, hover fills |
| `text-muted-foreground` | `--muted-foreground` | #6B7280 | Labels, captions, secondary copy |
| `border-line` / `border` | `--line` | #DCDFE8 | All borders |
| `bg-accent` / `text-accent` | `--accent` | #1A9450 | Green CTA fills, funded amounts, badges |
| `text-accent-foreground` | `--accent-foreground` | #FFFFFF | White text on green |
| `bg-destructive` / `text-destructive` | `--destructive` | #E03131 | Error states, delete buttons |

### Modifying tokens

To change a color across the entire app: **edit the HSL value in `src/index.css`** — Tailwind picks it up automatically. Do not hardcode hex values inline.

---

## 5. Typography System

### Font Stack

| Role | Font | Fallback | Load |
|---|---|---|---|
| **Headings (h1–h4, `.font-display`)** | Space Grotesk | `ui-sans-serif, system-ui, sans-serif` | Google Fonts |
| **Body / UI (default)** | Plus Jakarta Sans | `ui-sans-serif, system-ui, sans-serif` | Google Fonts |
| **Monospace** | Space Grotesk | `ui-monospace, SFMono-Regular, monospace` | Reuses display |

Fonts are loaded in `index.html`. To add or swap a font, update the `<link>` tag there AND the `fontFamily` in `tailwind.config.ts`.

### Display Scale

Fluid sizes using `clamp()` — they scale between the min and max based on viewport width.

| Class | Min size | Max size | Line height | Letter spacing | Use for |
|---|---|---|---|---|---|
| `text-display-xl` | 3.25rem (52px) | 7.5rem (120px) | 0.96 | -0.03em | Hero headlines only |
| `text-display-lg` | 2.5rem (40px) | 5.5rem (88px) | 1.0 | -0.025em | Page-level section headings |
| `text-display-md` | 1.875rem (30px) | 3.5rem (56px) | 1.06 | -0.02em | Section titles, large cards |
| `text-display-sm` | 1.375rem (22px) | 2.125rem (34px) | 1.15 | -0.015em | Sub-section headings |

Always pair display sizes with `font-display font-semibold` (or `font-bold` for the hero). Never use display sizes with body font weight (400).

### Standard Text Sizes

These are Tailwind defaults. Use them for UI copy and content.

| Class | Size | Use for |
|---|---|---|
| `text-xl` or `text-lg` | 20px / 18px | Lead paragraphs, hero subtext |
| `text-base` | 16px | Default body copy |
| `text-sm` | 14px | Card descriptions, secondary content |
| `text-xs` | 12px | Labels, captions, metadata |

### Font Weight

| Class | Weight | Use for |
|---|---|---|
| `font-normal` | 400 | Body copy, descriptions |
| `font-medium` | 500 | Navigation links, secondary labels |
| `font-semibold` | 600 | Headings (paired with `font-display`), button text, amounts |
| `font-bold` | 700 | Wordmark, critical emphasis |

### Typography Rules

1. **Headings always use `font-display font-semibold`** (or `font-bold` for hero). Never use the body font for a heading.
2. **Display sizes always include `text-balance` or `text-pretty`** to prevent awkward line breaks.
3. **Monetary amounts use `tnum`** (tabular nums) so digits align properly in lists.
4. **Line height for display text is tight** (`leading-none` or Tailwind's built-in clamp values). Body text uses `leading-relaxed` (1.625).
5. **Do not use `italic` or `font-display italic`** for decorative purposes — the old editorial design used `italic-display` with a serif font. In this system italic is only used for genuine emphasis (e.g., error messages in forms).
6. **Do not use `font-mono` for decorative labels.** Old code used monospace for editorial indices. New code uses `text-xs font-semibold uppercase tracking-widest text-accent` for section labels.

### Section Label Pattern

For labeling a section (e.g. "How it works", "Trending now"), use:

```tsx
<div className="text-xs font-bold uppercase tracking-widest text-accent mb-3">
  Section label
</div>
```

---

## 6. Color System

### Semantic Usage

**`text-ink` / `bg-ink`** — Use for primary text and the dark inverse band background. The default button **outline** variant uses `border-ink`. This is not used as a fill color for interactive elements (except the outline hover state).

**`text-muted-foreground`** — Use for all secondary text: descriptions, captions, labels, placeholders. If text is not the primary point of attention, it should be `text-muted-foreground`.

**`bg-muted`** — Subtle surface fills: hover states, filter chip backgrounds, inactive tabs, skeleton loaders, image placeholders. Not for cards (cards use `bg-paper`).

**`border-line` / `border`** — Every visible border in the app. 1px. Never use `border-2` or thicker unless it's a specific interactive focus ring.

**`text-accent` / `bg-accent`** — The brand green. Reserved for:
- Primary CTA buttons (`Button` default variant)
- ProgressBar fill
- Funded/pledged amounts in campaign cards and detail
- Category badge text and background (`text-accent bg-accent/10`)
- Active/selected indicator dots
- Section label text (`text-xs font-bold uppercase tracking-widest text-accent`)
- Hover state on scrolling category pills
- Avatar fallback background

**Never use `bg-accent` for decorative fills, background sections, or non-interactive elements.**

**`bg-destructive`** — Only for delete/remove actions and error states. Never use for warnings — there is no warning color in this system; use `text-muted-foreground` with a neutral tone instead.

### The Inverse Band

The dark full-bleed section (testimonial/quote band on Landing) uses:
```tsx
<section className="inverse">
  {/* bg-ink, text-paper automatically */}
</section>
```
The `.inverse` class sets `background: hsl(var(--ink))` and `color: hsl(var(--paper))`. Text inside it should be `text-paper` variants. Do not nest additional color fills inside `.inverse` — it should be clean dark with white text only.

### Opacity Modifiers

Tailwind opacity modifiers work on all tokens:
- `bg-accent/10` — 10% opacity green (used in category badges, CTA section background)
- `bg-accent/20` — 20% opacity green (used in CTA section border)
- `bg-ink/5` — very subtle dark hover fill
- `text-paper/50` — 50% white (used for secondary text inside `.inverse` band)

---

## 7. Spacing & Layout

### Container

The main content wrapper. Use `.container-edge` for all page sections:

```tsx
<section className="container-edge pt-16 pb-12">
  {/* content */}
</section>
```

`.container-edge` is defined in `src/index.css`:
- Max width: 1440px
- Centered horizontally
- Horizontal padding: `clamp(1.25rem, 3vw, 3rem)` (scales from 20px at mobile to 48px on large screens)

**Never** hardcode `max-w-*` or `px-*` directly on page-level sections — always use `.container-edge`.

### Breakpoints

Standard Tailwind breakpoints. The app is mobile-first.

| Prefix | Width |
|---|---|
| (none) | 0px+ (mobile) |
| `sm:` | 640px+ |
| `md:` | 768px+ |
| `lg:` | 1024px+ |
| `xl:` | 1280px+ |

The navbar switches from hamburger to desktop layout at `md:`. The main content grid typically uses `grid-cols-12` with `md:` column spans.

### Grid

Page-level layouts use a 12-column grid:

```tsx
<div className="grid grid-cols-12 gap-x-6 gap-y-8">
  <div className="col-span-12 md:col-span-8"> {/* main content */} </div>
  <div className="col-span-12 md:col-span-4"> {/* sidebar */} </div>
</div>
```

Campaign card grids use:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

Use `gap-6` (24px) for card grids. Use `gap-x-8 gap-y-10` for content grids with sidebars.

### Vertical Spacing (section rhythm)

Be consistent with vertical spacing between page sections. Reference values:

| Context | Class | Value |
|---|---|---|
| Page top padding | `pt-16 md:pt-24` | 64px / 96px |
| Section to section gap | `mt-20 md:mt-28` or `mt-24 md:mt-32` | 80–96px / 112–128px |
| Within a section (title to content) | `mt-8` | 32px |
| Subsection gap | `mt-12` | 48px |
| Footer top margin | `mt-24` | 96px |

### Sticky Elements

The navbar is `sticky top-0 z-40`. Any sticky sub-element (like the filter bar on Discover) should use `sticky top-16 z-30` — 16 accounts for the 64px navbar height. Never use `z-50` or higher for page-level sticky elements.

---

## 8. Border Radius

Defined in `tailwind.config.ts`. Match the radius to the element's visual weight.

| Token | Value | Use for |
|---|---|---|
| `rounded-none` | 0 | Never use unless overriding |
| `rounded-sm` | 4px | Small chips, tags within dense UI |
| `rounded` (default) | 6px | Dropdown items, popover, minor elements |
| `rounded-md` | 8px | Small buttons (`size="sm"`), input focus rings |
| `rounded-lg` | 10px | Medium buttons (`size="default"`), compact card thumbnails |
| `rounded-xl` | 14px | Campaign card images, large buttons (`size="lg"`), pills/badges |
| `rounded-2xl` | 20px | Stats grid panel, large containers |
| `rounded-3xl` | 28px | CTA section card (full page-width block) |
| `rounded-full` | 9999px | Avatar, category pill tags, progress bar track/fill |

**Key rule:** Card images get `rounded-xl`. The card container itself has no border radius — the content inside the card provides visual structure. The pledge sidebar on CampaignDetail uses `border border-ink` (square) intentionally — it is a structured form, not a soft card.

---

## 9. Motion & Animation

### Global Keyframes

Defined in `tailwind.config.ts`:

**`animate-marquee`** — Continuous horizontal scroll, 50s duration, linear. Used for the category strip on Landing. The element must have `.marquee-row` class and content duplicated 3x for seamless looping.

**`animate-rise-up`** — Fade + slide up, 0.6s, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-expo feel). Use for page entry animations on hero text or important blocks. Not currently applied globally but available.

### Interaction Transitions

Use `transition-colors duration-200` for color changes (hover on links, active filters).
Use `transition-transform duration-700 ease-out` for image scale on hover in campaign cards.
Use `transition-[width] duration-700 ease-out` for the progress bar fill width.

**Rules:**
- Animate `transform` and `opacity` only — never `width`, `height`, `padding`, or `margin` directly (they cause layout reflow).
- Exception: the progress bar uses `transition-[width]` which is acceptable since it's an intentional fill animation.
- Hover scale on card images: `group-hover:scale-[1.03]` — maximum. Never go above 1.05.
- Button press feedback: `active:translate-y-[1px]` — subtle 1px down press. Only on the default button variant.

### Easing

Use `ease-out` or `cubic-bezier(0.22, 1, 0.36, 1)` for enter/reveal animations — fast start, decelerate into place.
Never use `ease-in` for anything the user triggers (hover, click) — it feels sluggish.
Never use `ease-in-out` for short durations (<300ms) — use `ease-out` instead.

---

## 10. UI Component Library

These are the Shadcn/Radix primitives in `src/components/ui/`. Modify sparingly — only when a design system token changes.

### Button

File: `src/components/ui/button.tsx`

**Variants:**

| Variant | Appearance | Use for |
|---|---|---|
| `default` | Solid green (`bg-accent text-white`) | Primary action — one per view |
| `outline` | Dark border + ink text, inverts on hover | Secondary destructive-adjacent or paired action |
| `ghost` | No background, ink text, subtle hover | Tertiary actions, nav links, "Cancel" |
| `link` | Underline only | Inline text links within copy |
| `secondary` | Muted background + border | Low-emphasis actions |
| `destructive` | Red background | Delete / irreversible actions |

**Sizes:**

| Size | Height | Padding | Font | Radius | Use for |
|---|---|---|---|---|---|
| `sm` | 32px | 14px | 12px | `rounded-md` | Compact contexts (table actions, filter chips) |
| `default` | 40px | 20px | 14px | `rounded-lg` | Most UI buttons |
| `lg` | 48px | 28px | 16px | `rounded-xl` | Hero CTAs, form submits |
| `icon` | 40×40px | — | — | `rounded-lg` | Icon-only buttons |

**Usage rules:**
- Only one `default` (green) button should be dominant in any given view.
- When a page has two actions, use `default` + `outline` (NOT `default` + `default`).
- Full-width buttons use `className="w-full"` on top of the `Button` component.
- Never nest a `Button` inside another interactive element.

```tsx
// Correct — primary + secondary pairing
<Button asChild size="lg">
  <Link to="/discover">Browse campaigns</Link>
</Button>
<Button asChild variant="outline" size="lg">
  <Link to="/create">Start a campaign</Link>
</Button>

// Wrong — two primary buttons
<Button>Action one</Button>
<Button>Action two</Button>  // should be variant="outline"
```

### Input

File: `src/components/ui/input.tsx`

Renders as a bottom-border-only text field — no full border box. This is the design-intentional style for OrderRiot forms. Do not override to add `border border-line rounded-md` styling — that would break the form aesthetic.

```tsx
<Input placeholder="you@example.com" type="email" {...register("email")} />
```

Pair every input with a `<Label>` above it. Error messages go below as:
```tsx
{errors.field && (
  <p className="text-destructive text-xs mt-2 italic">{errors.field.message}</p>
)}
```

### Badge

File: `src/components/ui/badge.tsx`

Used on CampaignDetail for status/category/location chips. Not used on Campaign Cards — cards use their own inline pill styling (see CampaignCard section).

| Variant | Appearance | Use for |
|---|---|---|
| `default` | Ink border, ink text, paper background | Status chip |
| `solid` | Ink background, paper text | Active/funded status |
| `muted` | Muted border, muted-foreground text | Tertiary info |
| `outline` | Light border, ink text | Category, location on detail page |

```tsx
<Badge variant={c.status === "active" ? "solid" : "outline"}>{c.status}</Badge>
<Badge variant="outline"><Tag className="h-3 w-3 mr-1.5" />{c.category}</Badge>
```

**Note on category display:** On Campaign Cards, do NOT use the `Badge` component. Use the inline pill:
```tsx
<span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
  {category}
</span>
```
Badge is for the detail page header where multiple status chips live side-by-side.

### Avatar

File: `src/components/ui/avatar.tsx`

Always uses the brand green fallback:
```tsx
<Avatar className="h-8 w-8">
  <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
  <AvatarFallback className="bg-accent text-white text-xs font-bold">
    {initials(user.username)}
  </AvatarFallback>
</Avatar>
```

Standard sizes: `h-8 w-8` (32px) in navbar, `h-10 w-10` (40px) in cards and profiles. Always `rounded-full` (built into the component).

### Skeleton

File: `src/components/ui/skeleton.tsx`

Use to show loading states instead of spinners. Match the skeleton shape to the element it's replacing:

```tsx
// Replacing a campaign card
<Skeleton className="aspect-[4/3] rounded-xl" />     // image
<Skeleton className="h-3 w-1/3 mt-4 rounded-full" /> // category pill
<Skeleton className="h-6 w-4/5 mt-2" />              // title
<Skeleton className="h-3 w-full mt-2" />              // subtitle
```

Always use the same grid structure for skeletons as the real content:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i}> {/* skeleton shapes */} </div>
  ))}
</div>
```

### Tabs

File: `src/components/ui/tabs.tsx`

Used on CampaignDetail for Story / Rewards / Updates / Comments:

```tsx
<Tabs defaultValue="story">
  <TabsList>
    <TabsTrigger value="story">Story</TabsTrigger>
    <TabsTrigger value="rewards">Rewards · {count}</TabsTrigger>
  </TabsList>
  <TabsContent value="story">
    {/* content */}
  </TabsContent>
</Tabs>
```

Tabs are horizontally scrollable on mobile. Do not add more than 5 tabs to any set.

### Dropdown Menu

File: `src/components/ui/dropdown-menu.tsx`

Used for the user avatar menu in the Navbar. Structure:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar /> {/* trigger element */}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>
      <div className="text-xs text-muted-foreground font-normal">Signed in as</div>
      <div className="text-ink text-sm font-semibold mt-0.5">{username}</div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => navigate("/profile")}>Your profile</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Standard width is `w-56` (224px). Align to end for right-side triggers.

### Separator

File: `src/components/ui/separator.tsx`

A `1px` horizontal or vertical line using `--line` color. Use the `.rule` CSS class for full-width horizontal dividers inside containers:

```tsx
<div className="rule mt-8" />
```

Use `<Separator />` for shorter in-component dividers (e.g., inside DropdownMenu).

### Toast (Sonner)

Imported from Sonner directly — not a custom component:

```tsx
import { toast } from "sonner";

toast("Neutral message.");            // info/neutral
toast.success("Campaign launched.");  // success
toast.error(apiError(err));           // error (always use apiError() helper)
```

`apiError` is in `src/lib/api.ts` and extracts the human-readable message from Axios error responses.

---

## 11. Campaign Components

### CampaignCard

File: `src/components/campaign/CampaignCard.tsx`

The single most reused component in the app. Three display variants:

#### Default variant (grid cards)
Used in: Landing (trending grid), Discover (main grid).
```tsx
<CampaignCard campaign={campaign} />
```
- `aspect-[4/3] rounded-xl` image at the top
- Category as green pill badge below image
- Title in `font-display font-semibold text-xl`
- Subtitle in `text-sm text-muted-foreground`
- ProgressBar (green, h-1.5, rounded-full)
- Amount in `text-accent font-semibold` / days left in `text-muted-foreground`

#### Wide variant (featured / list rows)
Used in: anywhere a horizontal card is needed (profile pages, featured section).
```tsx
<CampaignCard campaign={campaign} variant="wide" index={1} />
```
- Left: `aspect-[4/3] rounded-xl` image
- Right: category badge, title, subtitle, progress stats
- Includes an optional `index` prop (shows 01, 02, etc.) for numbered lists

#### Compact variant (sidebar lists)
```tsx
<CampaignCard campaign={campaign} variant="compact" />
```
- 56×56px `rounded-lg` thumbnail
- Category in `text-accent`
- Title truncated to one line
- Percent + amount on one line

### ProgressBar

File: `src/components/campaign/ProgressBar.tsx`

```tsx
<ProgressBar value={percent} />          // percent = 0-100
<ProgressBar value={percent} className="mt-5" />  // with spacing
```

Specs:
- Track: `h-1.5` (6px), `bg-muted`, `rounded-full`
- Fill: `bg-accent`, `rounded-full`, animated width
- Transition: `duration-700 ease-out`
- Clamps value to [0, 100] internally

Never change the track color to anything other than `bg-muted`. Never change the fill color — it must be `bg-accent` (brand green).

### RewardTier

File: `src/components/campaign/RewardTier.tsx`

Card-style container (`border border-line p-6 hover:border-ink`) with:
- Tier label (`editorial-index`)
- Minimum pledge amount (large `font-display` text)
- Title and description
- Backers count and estimated delivery date
- `Button variant="outline"` CTA at the bottom, disabled when sold out

### MediaGallery

File: `src/components/campaign/MediaGallery.tsx`

Handles array of image URLs. Shows first image large, rest as thumbnails. Clicking thumbnails swaps the main image.

### BackDialog / Comments

Files: `src/components/campaign/BackDialog.tsx`, `Comments.tsx`

Modal dialog for pledging. Standard `<Dialog>` from Radix. Comments section with React Query-backed submission.

---

## 12. Layout Components

### Navbar

File: `src/components/layout/Navbar.tsx`

- **Sticky** (`sticky top-0 z-40`)
- **Backdrop blur** with semi-transparent background (`bg-paper/90 backdrop-blur`)
- **Wordmark**: `Order` (ink) + `Riot` (accent green), `font-display font-bold text-[1.35rem] tracking-tight`
- **Nav links**: `text-sm font-medium`, active = `text-ink`, inactive = `text-muted-foreground hover:text-ink`
- **Right side**: search icon → avatar/dropdown (logged in) or Sign in + Get started (logged out)
- **Mobile**: hamburger → full-height dropdown with large `font-display font-semibold` links

To add a nav link, add an entry to the `links` array at the top of Navbar.tsx.

### Footer

File: `src/components/layout/Footer.tsx`

- **Background**: `bg-muted/30` (subtle differentiation from page background)
- **Top border**: `border-t border-line`
- **Top margin**: Always `mt-24` on the `<footer>` element
- **Wordmark**: Same as Navbar — `Order` (ink) + `Riot` (accent), `text-2xl`
- **Column headings**: `text-xs font-bold uppercase tracking-widest text-ink`
- **Links**: `text-sm text-muted-foreground link-quiet hover:text-ink`
- **Bottom bar**: `text-xs text-muted-foreground` with copyright + legal links

To add a footer column, add an entry to the `cols` array in Footer.tsx.

### AppLayout

File: `src/components/layout/AppLayout.tsx`

All pages are wrapped automatically. Structure:
```tsx
<>
  <Navbar />
  <main>
    <Outlet /> {/* page content */}
  </main>
  <Footer />
</>
```

Do not re-render Navbar or Footer in individual page components.

---

## 13. Page Patterns

### Landing Page Pattern

See `src/pages/Landing.tsx`. Key structure:

1. **Hero section** (`container-edge pt-16 md:pt-24 pb-16`) — max-width `max-w-3xl` for text block, then full-width stats grid
2. **Category marquee** — `border-y bg-muted/30`, `.marquee-row animate-marquee`
3. **Trending section** — `container-edge mt-20 md:mt-28`, flex header (title + "See all" link), 3-col grid
4. **How it works** — side-by-side `flex-col md:flex-row` with sticky left sidebar and right step list
5. **Quote band** — `.inverse` full-bleed section
6. **CTA card** — `rounded-3xl bg-accent/10 border border-accent/20`

The section label pattern used throughout:
```tsx
<div className="text-xs font-bold uppercase tracking-widest text-accent mb-3">
  Section name
</div>
<h2 className="font-display text-display-md font-semibold">Heading</h2>
```

### Discover Page Pattern

See `src/pages/Discover.tsx`. Key elements:

- **Filter bar**: `border-y bg-paper sticky top-16 z-30` — must stick below the navbar
- **Filter chips**: `FilterChip` function — active state uses `bg-ink text-paper border-ink`, inactive uses `border-line hover:border-ink`
- **Sort controls**: `bg-ink text-paper` for active sort option
- **Results grid**: Same `grid-cols-1 md:grid-cols-3 gap-6` as Landing trending section

### Detail Page Pattern

See `src/pages/CampaignDetail.tsx`. Key structure:

- **Top bar**: back link + share action — `container-edge py-6 flex items-center justify-between text-sm`
- **Header**: 12-col grid — title occupies `md:col-span-9`, status badges above title
- **Main content**: 12-col grid — media gallery `lg:col-span-8`, pledge sidebar `lg:col-span-4 lg:sticky lg:top-24`
- **Pledge sidebar**: `border border-ink p-6 md:p-8` (intentionally square/structured — no border radius)
- **Body tabs**: `<Tabs>` with Story / Rewards / Updates / Comments

### Form Page Pattern

See `src/pages/Login.tsx` and `src/pages/Register.tsx`. Key structure:

- 12-col grid: left side (5 cols) = marketing copy, right side (6 cols, offset by 1) = form
- Left side headline: `font-display text-display-md`
- Form inputs: stacked with `space-y-8`, each with `<Label>` above `<Input>`
- Error messages: `text-destructive text-xs mt-2 italic`
- Submit button: `Button size="lg" className="w-full"`
- Mobile: left side hidden at mobile, form goes full width

### Profile Page Pattern

User-facing management pages (Profile, MyCampaigns, MyContributions). Key elements:

- Page header uses same `font-display text-display-sm font-semibold` heading
- Content in tabs or sections with `border-t border-line` dividers
- Campaign lists in `wide` CampaignCard variant

---

## 14. Utility Classes

Defined in `src/index.css`.

| Class | Effect | Use for |
|---|---|---|
| `.container-edge` | Max-width 1440px, centered, fluid padding | Every page section wrapper |
| `.rule` | `border-top: 1px solid hsl(var(--line))` | Horizontal dividers |
| `.marquee-row` | `display: flex; width: max-content; will-change: transform` | Animate-able horizontal scroll rows |
| `.link-quiet` | Underline that grows left→right on hover | Inline text links (not buttons) |
| `.italic-display` | `font-style: italic; font-weight: 400` | Inline emphasis within headings (use sparingly) |
| `.editorial-index` | `text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground` | Legacy section labels (prefer the green label pattern for new UI) |
| `.tnum` | `font-variant-numeric: tabular-nums` | All monetary amounts and counts that align vertically |
| `.inverse` | `background: hsl(var(--ink)); color: hsl(var(--paper))` | Full-bleed dark sections |
| `.text-balance` | `text-wrap: balance` | Headings to prevent awkward single-word last lines |
| `.text-pretty` | `text-wrap: pretty` | Body paragraphs |

### When to use `.link-quiet` vs `<Button variant="link">`

- `.link-quiet`: For navigation links and inline text hyperlinks. Animates an underline on hover. Use on `<Link>` or `<a>` elements inside prose or navigation.
- `Button variant="link"`: For interactive elements that trigger actions (not navigation). Renders as a button element for accessibility, underlines on hover.

---

## 15. Helper Functions

All in `src/lib/utils.ts`.

| Function | Signature | Returns | Use for |
|---|---|---|---|
| `cn()` | `cn(...inputs: ClassValue[])` | merged className string | Merge Tailwind classes without conflicts |
| `formatMoney()` | `formatMoney(amount, { compact? })` | `"$1,234"` or `"$1.2K"` | All monetary display |
| `pct()` | `pct(current, goal)` | `0–100` integer | Progress percent, clamps to 100 |
| `daysLeft()` | `daysLeft(completion_date)` | number or `null` | Countdown to campaign end |
| `timeAgo()` | `timeAgo(date)` | `"3d ago"` | Comment/update timestamps |
| `initials()` | `initials(name)` | `"JD"` | Avatar fallback text (1–2 chars) |
| `pad2()` | `pad2(n)` | `"01"` | Zero-padded display numbers |

**Always use `formatMoney()` for any currency display.** Do not use `$${n}` string interpolation.

**Always use `pct()` for progress percentages.** It handles division-by-zero (returns 0 when goal is 0) and clamps to 100.

**Always combine monetary display with `.tnum` class** to keep digits aligned.

---

## 16. Do's and Don'ts

### Typography

✅ **DO** use `font-display font-semibold` for all headings (h1–h4 level)  
✅ **DO** use `text-balance` on headings to prevent orphaned words  
✅ **DO** use `leading-relaxed` for body paragraphs  
✅ **DO** use `text-xs font-bold uppercase tracking-widest text-accent` for section labels  

❌ **DON'T** use Instrument Serif or any serif font — it's been removed  
❌ **DON'T** mix `font-mono` into new UI for decorative purposes  
❌ **DON'T** put headings in normal font weight (400/500) — always 600 or 700  
❌ **DON'T** use `uppercase tracking-[0.18em]` on anything new — it's an old editorial pattern. Use the new `tracking-widest` variant only for section labels  

### Color

✅ **DO** use `text-accent` for funded amounts, progress amounts, category labels  
✅ **DO** use `bg-accent/10` for subtle green fills (badges, CTA card backgrounds)  
✅ **DO** use `text-muted-foreground` for any secondary text that's not the primary focus  

❌ **DON'T** use `bg-accent` as a background color for sections — it's only for buttons, pills, and fills  
❌ **DON'T** add new color variables without updating both `index.css` and `tailwind.config.ts`  
❌ **DON'T** use hardcoded hex colors anywhere — always use CSS variable tokens  
❌ **DON'T** use gradients — they're not part of the design language  
❌ **DON'T** use dark mode — the app is light mode only  

### Layout

✅ **DO** use `container-edge` for every page-level section  
✅ **DO** use `mt-20 md:mt-28` or `mt-24 md:mt-32` to space sections  
✅ **DO** leave empty space — resist filling every pixel  

❌ **DON'T** use `container` (Tailwind's default) — always use `.container-edge`  
❌ **DON'T** use fixed pixel widths on content areas — use percentages or grid spans  
❌ **DON'T** use `p-4` / `p-2` inside page sections — those are too tight; use `px-6 py-5` minimum for content blocks  

### Components

✅ **DO** use one primary (green) button per page section  
✅ **DO** pair a primary button with an `outline` or `ghost` secondary button  
✅ **DO** add `w-full` to buttons inside forms  

❌ **DON'T** create new component files without checking if a Shadcn primitive already covers it  
❌ **DON'T** use the `Badge` component for category display on cards — use the inline `text-accent bg-accent/10 px-2.5 py-0.5 rounded-full` span  
❌ **DON'T** add shadows (`shadow-md`, `shadow-lg`) to cards — we use border + radius, not shadow depth  
❌ **DON'T** use `glassmorphism` effects (backdrop-blur on cards, `bg-white/50`) — only the navbar uses backdrop-blur  

### Motion

✅ **DO** animate `transform` and `opacity`  
✅ **DO** use `ease-out` or cubic-bezier for natural deceleration  

❌ **DON'T** animate `width`, `height`, `padding`, or `margin` (except the ProgressBar fill, which is intentional)  
❌ **DON'T** use `bounce` or elastic easing  
❌ **DON'T** add hover animations to non-interactive elements  

### Forms

✅ **DO** use `react-hook-form` + `zod` for all forms  
✅ **DO** validate only at system boundaries (user inputs, API responses)  
✅ **DO** use `<Label>` above every `<Input>`  
✅ **DO** put error messages below the input as `text-destructive text-xs mt-2 italic`  

❌ **DON'T** use `<input>` directly — always use the `<Input>` component from `@/components/ui/input`  
❌ **DON'T** add more than one error message per field  

---

## 17. New Feature Checklist

When building any new page, feature, or component, go through this checklist:

### Before writing code

- [ ] Do I need a new page, or can this be a new section/tab on an existing page?
- [ ] Which data does this page need? Do the React Query hooks in `queries.ts` already support it?
- [ ] What is the primary action on this page? (One green button.)
- [ ] What is the secondary action, if any? (One outline button.)

### Typography

- [ ] All headings use `font-display font-semibold` (or `font-bold` for hero)
- [ ] Display sizes have `text-balance` or `text-pretty`
- [ ] Body text is `text-base` or `text-sm` with `leading-relaxed`
- [ ] Monetary amounts have `tnum` class
- [ ] Section labels use `text-xs font-bold uppercase tracking-widest text-accent`

### Color

- [ ] No hardcoded hex or rgb values
- [ ] All colors reference CSS variable tokens (`text-ink`, `bg-muted`, `text-accent`, etc.)
- [ ] `bg-accent` is only used for the primary button and the ProgressBar fill
- [ ] Secondary text is `text-muted-foreground`
- [ ] Borders use `border-line` or just `border` (same value)

### Layout

- [ ] Page sections use `.container-edge`
- [ ] Sections have consistent vertical spacing (`mt-20 md:mt-28`)
- [ ] Mobile layout tested (collapses to `grid-cols-1` or `flex-col`)
- [ ] No fixed pixel widths on content areas

### Components

- [ ] Cards use `rounded-xl` on images, no border radius on the card container itself
- [ ] Loading states use `<Skeleton>` with matching shapes
- [ ] Empty states have a heading + description + one CTA button
- [ ] Buttons have correct variant (`default` = green primary, `outline` = secondary, `ghost` = tertiary)

### New component

- [ ] Check `src/components/ui/` — does a Radix/Shadcn primitive already cover this?
- [ ] If creating a new component, does it accept a `className` prop for composition?
- [ ] Does it use the `cn()` utility for merging class names?
- [ ] If it has variants, does it use `cva()` from `class-variance-authority`?

### Interactions

- [ ] Hover states use `transition-colors duration-200`
- [ ] Only `transform` and `opacity` are animated
- [ ] Loading/pending states are handled (button `disabled`, or skeleton, or spinner)
- [ ] Error states display a toast via `toast.error(apiError(err))`
- [ ] Success states display a toast via `toast.success("...")`

### Code quality

- [ ] No inline style attributes (use Tailwind utilities or CSS variables)
- [ ] API calls go through the Axios instance in `src/lib/api.ts`, not `fetch()`
- [ ] Data fetching uses the React Query hooks in `src/lib/queries.ts`
- [ ] All new TypeScript interfaces go in `src/lib/types.ts`
- [ ] Protected pages are wrapped with `<ProtectedRoute>` in `src/main.tsx`

---

*Last updated: May 2026. Maintained alongside the codebase — update this doc when design decisions change.*
