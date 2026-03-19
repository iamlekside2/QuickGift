# QuickGift - UI/UX User Story Document (v2 - Redesign)

> **Project**: QuickGift Mobile App (React Native / Expo + NativeWind/Tailwind)
> **Platform**: iOS & Android
> **Version**: 2.0.0 (Redesign)
> **Last Updated**: March 2026
> **Styling**: NativeWind (Tailwind CSS for React Native)

---

## Table of Contents

1. [App Overview](#app-overview)
2. [Brand Identity](#brand-identity)
3. [User Roles](#user-roles)
4. [Screen Flow Map](#screen-flow-map)
5. [Splash Screen](#splash-screen)
6. [Onboarding Screens](#onboarding-screens)
7. [Login Screen](#login-screen)
8. [Signup Screen](#signup-screen)
9. [Dashboard - Home](#dashboard---home)
10. [Dashboard - Gifts Tab](#dashboard---gifts-tab)
11. [Dashboard - Beauty Tab](#dashboard---beauty-tab)
12. [Dashboard - Orders Tab](#dashboard---orders-tab)
13. [Dashboard - Profile Tab](#dashboard---profile-tab)
14. [Design System (Tailwind)](#design-system-tailwind)
15. [Component Library](#component-library)
16. [Assets Inventory](#assets-inventory)

---

## App Overview

QuickGift is a gifting and beauty services marketplace that lets users:
- Send same-day gifts (cakes, flowers, chocolates, hampers) with delivery
- Book beauty professionals (nail techs, hairdressers, makeup artists) on-demand
- Combine gifts and beauty services for special occasions

**Target Market**: Nigeria (currency: Naira ₦, default city: Lagos)
**Tech Stack**: React Native + Expo SDK 54, NativeWind (Tailwind CSS), React Navigation v7

---

## Brand Identity

### Logo
- **Mark**: "QG" monogram inside a gift bag shape with a bow on top
- **Icon element**: Orange rocket detail on the bag
- **Text**: "QUICK GIFT" in uppercase, teal, spaced tracking
- **Variants**: Full logo (mark + text), icon only (for app icon, tab bars)
- **Asset**: `logo.png` on Desktop / to be placed in `assets/`

### Brand Colors
| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| **Teal** (Primary) | `#35615D` | `bg-teal` / `text-teal` | Logo, buttons, headings, nav, primary actions |
| **Orange** (Accent) | `#FD8950` | `bg-orange` / `text-orange` | Highlighted keywords, progress bar, CTAs, icons |
| **White** | `#FFFFFF` | `bg-white` | Screen backgrounds, cards |
| **Cream** | `#FBF7F1` | `bg-cream` | Soft backgrounds, dashboard bg |
| **Dark Text** | `#1F2937` | `text-gray-800` | Primary body text |
| **Gray Text** | `#6B7280` | `text-gray-500` | Subtitles, descriptions |
| **Light Gray** | `#9CA3AF` | `text-gray-400` | Placeholders, inactive |

### Typography Style
- **Headings**: Serif-inspired style (bold, large, mixed-weight with highlighted keywords)
- **Highlighted words**: Displayed in orange (`#FD8950`) or teal (`#35615D`) within headings
- **Body text**: Clean sans-serif, gray tones
- **Button text**: Semi-bold, white on teal background

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Customer** | Browse, order gifts, book beauty services | Full shopping + booking |
| **Provider** | Beauty professional offering services | Manage bookings + services |
| **Guest** | Browse without account | View-only, prompted to sign in for checkout |

---

## Screen Flow Map

```
App Launch
  │
  ▼
[Splash Screen] ──(2.5s)──▶ [Onboarding (3 slides)]
                                     │
                          Skip / Get Started
                                     │
                                     ▼
                              [Login Screen]
                              /      |      \
                        Customer  Provider   Guest
                          Login    Login     Mode
                             \      |       /
                              ▼     ▼      ▼
                          [Main Dashboard]
                          ┌─────────────────────────────────┐
                          │ Home │ Gifts │ Beauty │ Orders │ Profile │
                          └─────────────────────────────────┘
                                     │
                              [Sign Up] ◄── from Login
```

---

## Splash Screen

### User Story
> **As a** new or returning user,
> **I want to** see the QuickGift brand on launch,
> **So that** I recognize the app and feel confident I'm in the right place.

### Screen Specs

| Property | Value |
|----------|-------|
| **Background** | White (`#FFFFFF`) |
| **Duration** | 2.5 seconds (auto-advance) |
| **Animation** | Fade-in / scale-up on logo |
| **Next Screen** | Onboarding |

### Layout
```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│                         │
│                         │
│        ┌───────┐        │
│        │  QG   │        │
│        │ (logo │        │
│        │  bag  │        │
│        │ icon) │        │
│        └───────┘        │
│                         │
│       QUICK GIFT        │
│    (teal, uppercase,    │
│     spaced tracking)    │
│                         │
│                         │
│                         │
│                         │
│                         │
└─────────────────────────┘
     White background
```

### Tailwind Classes (NativeWind)
```
Container:  className="flex-1 bg-white items-center justify-center"
Logo:       className="w-32 h-32" (Image component)
Brand text: className="text-teal text-lg font-bold tracking-[4px] uppercase mt-4"
```

### Asset
- **Source**: `Desktop/Splash Screen.png` (reference design)
- **Logo file**: `Desktop/logo.png` → copy to `mobile/assets/logo.png`

### Acceptance Criteria
- [ ] White background (clean, minimal)
- [ ] QG gift bag logo centered on screen
- [ ] "QUICK GIFT" text below logo in teal, uppercase, letter-spaced
- [ ] Logo fades/scales in smoothly
- [ ] Auto-navigates to Onboarding after 2.5 seconds
- [ ] No user interaction required

---

## Onboarding Screens

### User Story
> **As a** first-time user,
> **I want to** understand what QuickGift offers through engaging illustrations,
> **So that** I know how the app can help me before signing up.

### Screen Specs

| Property | Value |
|----------|-------|
| **Type** | Horizontal swipeable carousel |
| **Slides** | 3 |
| **Progress** | Segmented progress bar at top (orange fill) |
| **Navigation** | Swipe, "Continue →" button, "Skip" link |
| **Skip** | Top-right corner text link |
| **Background** | White (`#FFFFFF`) |

### Progress Bar
- Segmented into 3 parts (one per slide)
- Active segments: filled with orange (`#FD8950`)
- Inactive segments: light gray (`#E5E7EB`)
- Position: Top of screen, below status bar
- Height: ~4px, rounded

### Slide Content

#### Slide 1 - Send Gifts
```
┌─────────────────────────┐
│ ████░░░░░░░░    Skip    │
│ (1/3 progress)          │
│                         │
│     ┌───────────────┐   │
│     │               │   │
│     │  Illustration │   │
│     │  Girl in cart │   │
│     │  holding gift │   │
│     │  box (teal &  │   │
│     │  orange tones)│   │
│     │               │   │
│     └───────────────┘   │
│                         │
│   Send same-day         │
│   Gift deliveries       │
│   (serif, 28px, bold)   │
│   "same-day" in orange  │
│   "Gift" in bold teal   │
│                         │
│   Cakes, flowers,       │
│   hampers and more!     │
│   ordered in minutes,   │
│   delivered before the  │
│   moment passes.        │
│   (14px, gray)          │
│                         │
│  ┌───────────────────┐  │
│  │   Continue  →     │  │
│  │  (teal bg, white) │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

**Highlighted words in title**: "same-day" in orange (#FD8950)

**Illustration asset**: `Desktop/Onboarding 1.png`
- Girl sitting in shopping cart, holding gift box
- Color palette: teal clothing, orange accents, light background

---

#### Slide 2 - Book Beauty
```
┌─────────────────────────┐
│ ████████░░░░    Skip    │
│ (2/3 progress)          │
│                         │
│     ┌───────────────┐   │
│     │               │   │
│     │  Illustration │   │
│     │  Girl browsing│   │
│     │  products on  │   │
│     │  screen/app   │   │
│     │  (teal &      │   │
│     │  orange tones)│   │
│     │               │   │
│     └───────────────┘   │
│                         │
│   Get your Beauty       │
│   routine, on your      │
│   own schedule.         │
│   (serif, 28px, bold)   │
│   "Beauty" in orange    │
│   "schedule" in orange  │
│                         │
│   Book a nail tech,     │
│   hairstylist, or       │
│   makeup artist, they   │
│   come to you, you just │
│   show up as yourself.  │
│   (14px, gray)          │
│                         │
│  ┌───────────────────┐  │
│  │   Continue  →     │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

**Highlighted words in title**: "Beauty" and "schedule" in orange (#FD8950)

**Illustration asset**: `Desktop/Onboarding 2.png`
- Girl browsing products/services on app interface
- Shows product cards with items (teddy bear, ball, lamp)

---

#### Slide 3 - Make It Special
```
┌─────────────────────────┐
│ ████████████    Skip    │
│ (3/3 progress - full)   │
│                         │
│     ┌───────────────┐   │
│     │               │   │
│     │  Illustration │   │
│     │  Two people   │   │
│     │  celebrating, │   │
│     │  dancing/     │   │
│     │  high-fiving  │   │
│     │  (teal &      │   │
│     │  orange tones)│   │
│     │               │   │
│     └───────────────┘   │
│                         │
│   Make every Occasion   │
│   feels like it was     │
│   planned Perfectly.    │
│   (serif, 28px, bold)   │
│   "Occasion" in orange  │
│   "Perfectly" in orange │
│                         │
│   Combine gifts and     │
│   beauty services in    │
│   one place, because    │
│   the best surprises    │
│   look effortless.      │
│   (14px, gray)          │
│                         │
│  ┌───────────────────┐  │
│  │  Get Started  →   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

**Highlighted words in title**: "Occasion" and "Perfectly" in orange (#FD8950)

**Illustration asset**: `Desktop/Onboarding 3.png` / `Desktop/Being Happy 1.png`
- Two people celebrating joyfully
- Sparkle/confetti elements in orange

---

### Button Specs
| Element | Style |
|---------|-------|
| **Continue →** (Slides 1-2) | Full-width, teal bg (`#35615D`), white text, rounded-xl, 56px height, arrow icon |
| **Get Started →** (Slide 3) | Same style as Continue, different label |
| **Skip** | Plain text, top-right, teal color, no background |

### Tailwind Classes (NativeWind)
```
Progress bar:     className="flex-row mx-6 mt-2 gap-1"
Active segment:   className="flex-1 h-1 bg-orange rounded-full"
Inactive segment: className="flex-1 h-1 bg-gray-200 rounded-full"
Skip button:      className="text-teal text-base font-medium"
Illustration:     className="w-full h-[45%]" (resizeMode="contain")
Title:            className="text-3xl font-bold text-gray-800 text-center px-8"
Highlighted word: className="text-orange"
Subtitle:         className="text-sm text-gray-500 text-center px-10 mt-3 leading-5"
CTA button:       className="bg-teal mx-6 py-4 rounded-xl flex-row items-center justify-center"
CTA text:         className="text-white text-base font-semibold mr-2"
```

### Acceptance Criteria
- [ ] 3 slides swipeable horizontally
- [ ] Segmented progress bar fills as user advances (orange)
- [ ] Custom illustrations on each slide (not emojis)
- [ ] Titles use mixed styling: black text with orange highlighted keywords
- [ ] "Skip" text link on all slides → goes to Login
- [ ] "Continue →" button on slides 1-2 → advances to next slide
- [ ] "Get Started →" button on slide 3 → goes to Login
- [ ] Buttons are full-width, teal background with white text
- [ ] Smooth swipe animation between slides
- [ ] Progress bar animates on slide change

---

## Login Screen

### User Story
> **As a** user,
> **I want to** quickly choose my role and sign in,
> **So that** I can start using the app immediately.

### Screen Specs

| Property | Value |
|----------|-------|
| **Background** | White (`#FFFFFF`) |
| **Auth Method** | Dummy login (role-based, no credentials needed) |
| **Roles** | Customer, Provider |
| **Guest** | Available |

### Layout
```
┌─────────────────────────┐
│                         │
│        ┌───────┐        │
│        │  QG   │        │
│        │ logo  │        │
│        └───────┘        │
│                         │
│   Welcome to QuickGift  │
│      (24px, bold,       │
│        teal text)       │
│                         │
│  Choose how you'd like  │
│     to get started      │
│    (14px, gray)         │
│                         │
│ ┌─────────────────────┐ │
│ │ 🎁  Customer Login  │ │
│ │ Browse gifts & book │ │
│ │ beauty services     │ │
│ │   (teal border,     │ │
│ │    white card)      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ✂️  Provider Login   │ │
│ │ Manage bookings &   │ │
│ │ offer services      │ │
│ │   (teal border,     │ │
│ │    white card)      │ │
│ └─────────────────────┘ │
│                         │
│  Don't have an account? │
│     Sign Up (orange) ▶  │
│                         │
│  ─── or ───             │
│                         │
│  Continue as Guest ▶    │
│   (teal text link)      │
│                         │
└─────────────────────────┘
```

### Login Card Specs
- White card with 1px teal border (`border-teal`)
- Left: icon in teal-tinted circle background
- Right: title (bold, teal) + description (gray)
- Full-width, 16px padding
- Border radius: 14px (`rounded-xl`)
- Press state: light teal background tint

### Tailwind Classes (NativeWind)
```
Card:       className="flex-row items-center p-4 bg-white border border-teal/20 rounded-xl mx-6 mb-3"
Card title: className="text-teal text-base font-bold"
Card desc:  className="text-gray-500 text-sm mt-1"
Sign Up:    className="text-orange font-semibold"
Guest link: className="text-teal font-medium"
```

### Acceptance Criteria
- [ ] QG logo at top of screen
- [ ] Welcome heading in teal
- [ ] Two role cards with teal-bordered styling
- [ ] Tapping Customer card → logs in as customer → Dashboard
- [ ] Tapping Provider card → logs in as provider → Dashboard
- [ ] "Sign Up" link in orange → navigates to Signup screen
- [ ] "Continue as Guest" in teal → enters app in guest mode
- [ ] Loading indicator shown during login

---

## Signup Screen

### User Story
> **As a** new user,
> **I want to** create an account and choose my role,
> **So that** I get the right experience (shopping or providing services).

### Screen Specs

| Property | Value |
|----------|-------|
| **Background** | White (`#FFFFFF`) |
| **Selection** | Radio-button style role cards |
| **Default** | No role pre-selected |

### Layout
```
┌─────────────────────────┐
│  ◀ Back                 │
│                         │
│       Create Account    │
│      (24px, bold, teal) │
│                         │
│  Choose how you want    │
│  to use QuickGift       │
│    (14px, gray)         │
│                         │
│ ┌─────────────────────┐ │
│ │ ○ 🎁 Customer       │ │
│ │   I want to send    │ │
│ │   gifts & book      │ │
│ │   services          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ○ ✂️ Provider        │ │
│ │   I want to offer   │ │
│ │   beauty services   │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  Continue as [role] │ │
│ │  (teal bg, white)   │ │
│ └─────────────────────┘ │
│                         │
│  Already have an        │
│  account? Log in        │
│  (orange link)          │
│                         │
└─────────────────────────┘
```

### Selection States
| State | Border | Icon BG | Radio |
|-------|--------|---------|-------|
| **Unselected** | Light gray (`border-gray-200`) | Gray (`bg-gray-100`) | Empty circle |
| **Selected** | Teal (`border-teal`) | Light teal (`bg-teal/10`) | Filled teal circle |

### Acceptance Criteria
- [ ] Two role cards with radio-button selection
- [ ] Only one role selectable at a time
- [ ] Selected card: teal border + light teal icon background
- [ ] Button text changes: "Continue as Customer" / "Continue as Provider"
- [ ] Button: teal background, disabled until a role is selected
- [ ] "Log in" link in orange → navigates back to Login
- [ ] Back arrow → navigates back

---

## Dashboard - Home

### User Story
> **As a** logged-in user,
> **I want to** see a personalized home screen with gift and beauty options,
> **So that** I can quickly find what I need or discover new offerings.

### Screen Specs

| Property | Value |
|----------|-------|
| **Background** | Cream (`#FBF7F1`) |
| **Scrollable** | Yes, vertical |

### Layout
```
┌─────────────────────────┐
│ Hello, {Name}!          │
│ 📍 {City}, Nigeria    🔔│
│                    (badge)
│ ┌─────────────────────┐ │
│ │ 🔍 Search gifts,    │ │
│ │    services...      │ │
│ └─────────────────────┘ │
│                         │
│ ┌──────────┬──────────┐ │
│ │ 🎁       │ 💅       │ │
│ │ Send a   │ Book     │ │
│ │ Gift     │ Beauty   │ │
│ │(teal bg) │(orange bg│ │
│ └──────────┴──────────┘ │
│                         │
│ Shop by Occasion ──See All│
│ ┌────┐┌────┐┌────┐┌───┐│
│ │🎂  ││💍  ││💒  ││🎄 ││
│ │Bday││Anni││Wed ││Xmas││
│ └────┘└────┘└────┘└───┘│
│                         │
│ Popular Gifts ───See All│
│ ┌───────┐ ┌───────┐    │
│ │ [img] │ │ [img] │    │
│ │ Choco │ │ Rose  │ ──▶│
│ │ Cake  │ │ Bouq  │    │
│ │₦15,000│ │₦12,000│    │
│ │ ★4.8  │ │ ★4.9  │    │
│ └───────┘ └───────┘    │
│                         │
│ Beauty Services ─See All│
│ ┌────┐┌────┐┌────┐     │
│ │💅  ││💇  ││💄  │     │
│ │Nail││Hair││Make│     │
│ └────┘└────┘└────┘     │
│                         │
│ Top Beauty Pros ─See All│
│ ┌─────────────────────┐ │
│ │ [avatar] Amara Nails│ │
│ │ ★4.9 · 127 reviews │ │
│ │ From ₦5,000         │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
│ Home │ Gifts │Beauty│Orders│Profile│
└─────────────────────────┘
```

### Header
- Greeting: "Hello, {firstName}!" (22px, bold, dark text)
- Location: Pin icon (teal) + "{city}, Nigeria" (14px, gray)
- Notification bell: Top-right, orange dot badge for unread

### Quick Action Cards (2-column grid)
| Card | Icon | Label | Background |
|------|------|-------|------------|
| Send a Gift | Gift icon | "Send a Gift" | Teal gradient |
| Book Beauty | Sparkle icon | "Book Beauty" | Orange gradient |

### Content Sections
Each section has a **SectionHeader** (title + "See All" in teal):

1. **Shop by Occasion** - Horizontal scroll of occasion chips
2. **Popular Gifts** - Horizontal scroll of GiftCards (170px wide)
3. **Beauty Services** - Category grid
4. **Top Beauty Pros** - Vertical list of ProviderCards

### Acceptance Criteria
- [ ] Personalized greeting with user's first name
- [ ] Location shows user's city with teal pin icon
- [ ] Notification bell with orange badge
- [ ] Search bar (teal search icon)
- [ ] Two quick action cards: teal and orange themed
- [ ] All 4 content sections load from API/mock data
- [ ] "See All" links in teal navigate to filtered lists
- [ ] Loading spinner while data fetches
- [ ] Error state with retry button on failure

---

## Dashboard - Gifts Tab

### User Story
> **As a** customer,
> **I want to** browse gifts by category and occasion,
> **So that** I can find the perfect gift for any event.

### Layout
```
┌─────────────────────────┐
│     Send a Gift         │
│  Make someone's day      │
│       special            │
│  (title: teal, bold)     │
│                         │
│ ┌─────────────────────┐ │
│ │ 🔍 Search gifts...  │ │
│ └─────────────────────┘ │
│                         │
│ Categories              │
│ ┌────┐┌────┐┌────┐     │
│ │🎂  ││💐  ││🍫  │     │
│ │Cake││Flow││Choc│     │
│ └────┘└────┘└────┘     │
│ ┌────┐┌────┐┌────┐     │
│ │🧺  ││🎈  ││🎁  │     │
│ │Hamp││Ball││Pers│     │
│ └────┘└────┘└────┘     │
│                         │
│ By Occasion ────See All │
│ [Birthday][Anniversary] │
│ [Wedding][Graduation]──▶│
│                         │
│ Popular Gifts ──See All │
│ ┌───────┐ ┌───────┐    │
│ │ [img] │ │ [img] │    │
│ │ Name  │ │ Name  │ ──▶│
│ │₦Price │ │₦Price │    │
│ └───────┘ └───────┘    │
│                         │
└─────────────────────────┘
```

### Gift Categories (3x2 Grid)
| Category | Icon | BG Tint |
|----------|------|---------|
| Cakes | Cake icon | Light teal |
| Flowers | Flower icon | Light orange |
| Chocolates | Chocolate icon | Light brown |
| Hampers | Basket icon | Light cream |
| Balloons | Balloon icon | Light teal |
| Personalized | Gift icon | Light orange |

### Acceptance Criteria
- [ ] Header with title (teal) and subtitle
- [ ] Search bar with teal icon
- [ ] 6 category cards in 3x2 grid with brand-tinted backgrounds
- [ ] Tapping category → GiftsList filtered by category
- [ ] Occasion chips horizontally scrollable (teal outline, orange active)
- [ ] Popular gifts carousel with product images
- [ ] Tapping gift card → GiftDetail screen

---

## Dashboard - Beauty Tab

### User Story
> **As a** customer,
> **I want to** browse beauty services and providers,
> **So that** I can book a professional for my needs.

### Layout
```
┌─────────────────────────┐
│    Beauty Services       │
│  Book top professionals  │
│       near you           │
│  (title: teal, bold)     │
│                         │
│ ┌─────────────────────┐ │
│ │ 🔍 Search services  │ │
│ │    or providers...  │ │
│ └─────────────────────┘ │
│                         │
│ ┌──────┐┌──────┐┌─────┐│
│ │🏠Home││💈Salon││⚡Exp││
│ │Serv. ││Visit ││ress ││
│ │(teal ││(teal ││(teal││
│ │chips)││chips)││chip)││
│ └──────┘└──────┘└─────┘│
│                         │
│ Services                │
│ ┌────┐┌────┐┌────┐     │
│ │💅  ││💇  ││💄  │     │
│ │Nail││Hair││Make│     │
│ └────┘└────┘└────┘     │
│ ┌────┐┌────┐┌────┐     │
│ │✂️  ││    ││💆  │     │
│ │Barb││Wax ││Mass│     │
│ └────┘└────┘└────┘     │
│                         │
│ Top Rated ──────See All │
│ ┌─────────────────────┐ │
│ │ Provider cards...   │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

### Quick Filters (3 chips)
| Filter | Label | Style |
|--------|-------|-------|
| Home Service | "Home Service" | Teal outline chip, orange when active |
| Salon Visit | "Salon Visit" | Teal outline chip |
| Express | "Express (2hrs)" | Teal outline chip |

### Acceptance Criteria
- [ ] Search bar for services and providers
- [ ] 3 quick filter chips with teal/orange active states
- [ ] 6 service category cards in grid
- [ ] Tapping service → ProvidersList filtered
- [ ] Top rated providers with ratings and availability
- [ ] Teal availability indicator for available providers
- [ ] Tapping provider → ProviderProfile screen

---

## Dashboard - Orders Tab

### User Story
> **As a** customer,
> **I want to** track all my gift orders and beauty bookings,
> **So that** I can monitor delivery status and upcoming appointments.

### Layout
```
┌─────────────────────────┐
│       My Orders         │
│     (teal, bold)        │
│                         │
│ [All] [Gifts] [Beauty]  │
│ (teal active tab,       │
│  orange underline)      │
│                         │
│ ┌─────────────────────┐ │
│ │ 🎁 Order #QG-1234   │ │
│ │ Mar 5, 2026         │ │
│ │ ┌──────────┐        │ │
│ │ │Delivered │ ₦15,000│ │
│ │ └──────────┘        │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 💅 Nail Art Session  │ │
│ │ Mar 3, 2026         │ │
│ │ ┌──────────┐        │ │
│ │ │Completed │ ₦8,000 │ │
│ │ └──────────┘        │ │
│ └─────────────────────┘ │
│                         │
│       (empty state)     │
│      No orders yet      │
│  Start shopping to see  │
│   your orders here      │
│                         │
└─────────────────────────┘
```

### Filter Tabs
| Tab | Shows | Active State |
|-----|-------|-------------|
| All | Both gifts + beauty | Teal text, orange underline |
| Gifts | Gift orders only | Same |
| Beauty | Beauty bookings only | Same |

### Order Status Badges
| Status | Color | Background |
|--------|-------|------------|
| Pending | Orange (`#FD8950`) | Light orange |
| Confirmed | Teal (`#35615D`) | Light teal |
| In Transit | Purple (`#8B5CF6`) | Light purple |
| Delivered | Green (`#10B981`) | Light green |
| Completed | Green (`#10B981`) | Light green |
| Cancelled | Red (`#EF4444`) | Light red |

### Acceptance Criteria
- [ ] Three filter tabs with teal/orange active styling
- [ ] Order cards show icon, name/number, date, status, price
- [ ] Status badges color-coded (using brand colors where applicable)
- [ ] Empty state with message when no orders
- [ ] Tapping order card → Order detail (future)

---

## Dashboard - Profile Tab

### User Story
> **As a** user,
> **I want to** view and manage my account information,
> **So that** I can update my details, check my wallet, and access settings.

### Layout
```
┌─────────────────────────┐
│                         │
│    ┌───┐                │
│    │ T │  Test User     │
│    └───┘  +234 800...   │
│  (teal bg               │
│   avatar)  ┌──────┐     │
│            │ Edit │     │
│            │(teal │     │
│            │outline)    │
│            └──────┘     │
│                         │
│ ┌───────┬───────┬──────┐│
│ │   3   │   5   │   2  ││
│ │Orders │ Gifts │Book- ││
│ │       │ Sent  │ings  ││
│ └───────┴───────┴──────┘│
│                         │
│ ┌─────────────────────┐ │
│ │ 💳 Wallet    ₦5,000 │ │
│ ├─────────────────────┤ │
│ │ ❤️ Favourites       │ │
│ ├─────────────────────┤ │
│ │ 🔔 Reminders        │ │
│ ├─────────────────────┤ │
│ │ 📍 Addresses        │ │
│ ├─────────────────────┤ │
│ │ 🎁 Refer a Friend   │ │
│ ├─────────────────────┤ │
│ │ ❓ Help & Support    │ │
│ ├─────────────────────┤ │
│ │ ⚙️ Settings          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  🚪 Log Out         │ │
│ │  (red/error color)  │ │
│ └─────────────────────┘ │
│                         │
│    QuickGift v2.0.0     │
│                         │
└─────────────────────────┘
```

### User Card
- **Avatar**: Circle with user initial, teal background (`bg-teal`)
- **Name**: Bold, 20px, dark text
- **Phone**: Gray, 14px
- **Edit button**: Teal outline (`border-teal text-teal`)
- **Guest state**: Shows "Sign in to access all features" with teal Sign In button

### Stats Row (3 columns)
| Stat | Label |
|------|-------|
| Order count | "Orders" |
| Gifts sent count | "Gifts Sent" |
| Booking count | "Bookings" |

### Menu Items
| Item | Icon | Right Element |
|------|------|---------------|
| Wallet | Wallet icon (teal) | Balance (₦X,XXX) in orange |
| Favourites | Heart icon (teal) | Chevron |
| Reminders | Bell icon (teal) | Chevron |
| Addresses | Pin icon (teal) | Chevron |
| Refer a Friend | Gift icon (teal) | Chevron |
| Help & Support | Help icon (teal) | Chevron |
| Settings | Gear icon (teal) | Chevron |

### Acceptance Criteria
- [ ] User avatar with initial in teal circle
- [ ] Name and phone number shown
- [ ] Edit profile button (teal outline)
- [ ] Guest mode shows sign-in prompt
- [ ] Stats row with 3 metrics
- [ ] 7 menu items with teal icons and chevrons
- [ ] Wallet shows balance in orange
- [ ] Logout button (red) at bottom
- [ ] App version in footer ("QuickGift v2.0.0")
- [ ] Tapping logout → clears session → Login screen

---

## Design System (Tailwind)

### Tailwind Config Colors

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#35615D',
          light: '#E8F0EF',    // 10% opacity tint for backgrounds
          dark: '#2A4E4B',     // Darker shade for pressed states
        },
        orange: {
          DEFAULT: '#FD8950',
          light: '#FEF0E8',    // 10% opacity tint for backgrounds
          dark: '#E5743F',     // Darker shade for pressed states
        },
        cream: '#FBF7F1',
      },
    },
  },
};
```

### Full Color Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Teal (Primary) | `#35615D` | `teal` | Buttons, headings, nav, logo |
| Teal Light | `#E8F0EF` | `teal-light` | Selected card bg, light tints |
| Teal Dark | `#2A4E4B` | `teal-dark` | Pressed/hover states |
| Orange (Accent) | `#FD8950` | `orange` | Highlights, progress, badges, links |
| Orange Light | `#FEF0E8` | `orange-light` | Orange tint backgrounds |
| Orange Dark | `#E5743F` | `orange-dark` | Pressed/hover states |
| Cream | `#FBF7F1` | `cream` | Dashboard background |
| White | `#FFFFFF` | `white` | Cards, screen backgrounds |
| Success | `#10B981` | `emerald-500` | Delivered, completed |
| Error | `#EF4444` | `red-500` | Errors, cancel, logout |
| Warning | `#F59E0B` | `amber-500` | Pending states |
| Info | `#3B82F6` | `blue-500` | Confirmed status |
| Text Primary | `#1F2937` | `gray-800` | Main body text |
| Text Secondary | `#6B7280` | `gray-500` | Subtitles, descriptions |
| Text Light | `#9CA3AF` | `gray-400` | Placeholders, inactive |
| Border | `#E5E7EB` | `gray-200` | Card borders, dividers |

### Typography Scale

| Token | Tailwind | Size | Weight | Usage |
|-------|----------|------|--------|-------|
| hero | `text-4xl font-extrabold` | 34px | 800 | Onboarding titles |
| title | `text-2xl font-bold` | 28px | 700 | Screen titles |
| heading | `text-xl font-bold` | 22px | 700 | Section headers |
| subtitle | `text-lg font-semibold` | 18px | 600 | Card titles |
| body | `text-base` | 16px | 400 | Body text, buttons |
| caption | `text-sm` | 14px | 400 | Descriptions |
| small | `text-xs` | 12px | 400 | Captions, badges |

### Spacing (Tailwind default)
| Tailwind | Value | Usage |
|----------|-------|-------|
| `p-1` / `m-1` | 4px | Tight spacing |
| `p-2` / `m-2` | 8px | Small gaps |
| `p-3` / `m-3` | 12px | Medium gaps |
| `p-4` / `m-4` | 16px | Standard padding |
| `p-5` / `m-5` | 20px | Section spacing |
| `p-6` / `m-6` | 24px | Screen padding |
| `p-8` / `m-8` | 32px | Large spacing |

### Border Radius
| Tailwind | Value | Usage |
|----------|-------|-------|
| `rounded` | 4px | Small elements |
| `rounded-md` | 6px | Badges, chips |
| `rounded-lg` | 8px | Inputs |
| `rounded-xl` | 12px | Cards, buttons |
| `rounded-2xl` | 16px | Large cards |
| `rounded-full` | 9999px | Avatars, pills |

### Shadows
| Tailwind | Usage |
|----------|-------|
| `shadow-sm` | Subtle cards |
| `shadow` | Standard cards |
| `shadow-lg` | Floating elements, modals |

---

## Component Library

### Button
| Variant | Tailwind Classes |
|---------|-----------------|
| **Primary** | `bg-teal text-white rounded-xl py-4 px-6` |
| **Secondary** | `bg-teal-light text-teal rounded-xl py-4 px-6` |
| **Outline** | `bg-transparent border border-teal text-teal rounded-xl py-4 px-6` |
| **Ghost** | `bg-transparent text-teal py-4 px-6` |
| **Accent** | `bg-orange text-white rounded-xl py-4 px-6` |

Sizes: `sm` (py-2), `md` (py-3), `lg` (py-4)

### GiftCard (w-44)
- Product image (h-32, rounded-t-xl)
- Product name (`text-sm font-semibold text-gray-800`, 1 line)
- Vendor name (`text-xs text-gray-500`)
- Price in Naira (`text-base font-bold text-teal`)
- Star rating (`text-orange`)

### ProviderCard (full width)
- Avatar circle with initial (`bg-teal text-white rounded-full`)
- Business name + service type
- Star rating (orange stars) + review count
- Location (teal pin icon)
- "From ₦X,XXX" price (teal, bold)
- Teal availability dot

### CategoryCard
- Circle icon container with brand-tinted background
- Label text below (`text-xs text-gray-600`)

### SectionHeader
- Bold title left (`text-lg font-bold text-gray-800`)
- "See All" link right (`text-sm text-teal font-medium`)

---

## Bottom Tab Bar

| Tab | Icon (Inactive) | Icon (Active) | Label |
|-----|-----------------|---------------|-------|
| Home | home-outline | home | Home |
| Gifts | gift-outline | gift | Gifts |
| Beauty | sparkles-outline | sparkles | Beauty |
| Orders | receipt-outline | receipt | Orders |
| Profile | person-outline | person | Profile |

- **Height**: 85px (includes safe area)
- **Active color**: `#35615D` (teal)
- **Inactive color**: `#9CA3AF` (gray-400)
- **Icon size**: 22px
- **Active indicator**: Orange dot or underline below active icon

### Tailwind Classes
```
Tab bar:    className="bg-white border-t border-gray-200"
Active tab: className="text-teal"
Inactive:   className="text-gray-400"
```

---

## Assets Inventory

### Files to Copy from Desktop to Project

| Source (Desktop) | Destination (mobile/assets/) | Usage |
|-----------------|------------------------------|-------|
| `logo.png` | `assets/logo.png` | Splash, Login, app icon |
| `Splash Screen.png` | Reference only | Splash screen design ref |
| `Onboarding 1.png` | `assets/onboarding/slide1.png` | Onboarding slide 1 illustration |
| `Onboarding 2.png` | `assets/onboarding/slide2.png` | Onboarding slide 2 illustration |
| `Onboarding 3.png` / `Being Happy 1.png` | `assets/onboarding/slide3.png` | Onboarding slide 3 illustration |
| `Online Shopping 4 1.png` | `assets/illustrations/shopping.png` | Optional: empty states |
| `Box Cover.png` | `assets/illustrations/box.png` | Optional: decorative |
| `Design QuickGifts/` (23 screens) | Reference only | Full design system reference |

### Design Reference Files
The full UI/UX mockup set is at `Desktop/Design QuickGifts/` containing 23 screen designs (JPEG) covering:
- Role selection, authentication flows
- Gift browsing (Flowers, Cakes & Sweets, Gift Baskets, All Gifts)
- Beauty services listing with provider cards
- Booking flow (provider details, date/time, confirmation)
- Order tracking with delivery status

---

> **Migration Note**: This app is transitioning from StyleSheet API to NativeWind (Tailwind CSS for React Native). All new and redesigned screens should use Tailwind classes via NativeWind. The primary brand color changes from coral red (`#FF6B6B`) to teal (`#35615D`) and the accent from generic orange to `#FD8950`.
