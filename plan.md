# Restaurant Card Redesign - Editorial/Magazine Aesthetic

## Goal

Transform bland restaurant cards into visually striking, magazine-style cards that feel curated and
intentional. Bold execution over timid iteration.

## Aesthetic Direction

**Editorial / Food Magazine**

- Warm, sophisticated feel inspired by premium food publications (Bon Appetit, Cereal Magazine,
  etc.)
- Elegant typography with serif display fonts (Playfair Display) at generous sizes
- Refined spacing with breathing room - generous whitespace is key
- Subtle warm accent colors (burnt orange as dominant accent)
- Full-bleed hero imagery - food is visual, show it immediately

### Typography Specification

- **Display font**: Playfair Display (serif) for restaurant names
  - Desktop: 26px/1.2, Mobile: 20px/1.2
  - Font weight: 600-700 for authority
- **Body font**: Source Sans 3 (sans-serif) for all other text
  - Base: 16px/1.6 for readability
  - Small text: 14px with tracking-wide
- Keep emoji rating system (unique brand voice, hilarious captions)

### Color Palette

- **Background**: Warm off-white `#faf9f7` (light mode) - like quality paper
- **Dark background**: Warm dark `#1a1918` - not cold neutral gray
- **Cards**: White with subtle border `border-neutral-200/60`, gentle shadow
- **Primary accent**: Flame-pea-700 (#b53920) - use boldly, not timidly
- **Text hierarchy**: Neutral-900 (headings) → Neutral-600 (body) → Neutral-400 (meta)

### Spatial Design

- **Hero image**: Full-bleed, 16:9 aspect ratio, always visible
- **Card padding**: `p-6` (24px) - generous breathing room
- **Section gaps**: `gap-5` (20px) between content blocks
- **No dividing lines**: Use spacing instead of borders
- **Rounded corners**: `rounded-xl` (16px) for warmth

---

## Implementation Phases

### Phase 1: Foundation (Typography & Theme)

#### 1. `src/index.css`

**Changes:**

- Add Google Fonts import: Playfair Display (400, 600, 700) + Source Sans 3 (400, 600)
- Update base background to warm off-white `#faf9f7`
- Update dark mode background to warm dark `#1a1918`
- Add CSS custom properties for editorial spacing

```css
/* Add to top of file */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;600&display=swap");

/* Update base styles */
:root {
  --font-display: "Playfair Display", Georgia, serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
}
```

#### 2. `src/ui/card.tsx`

**Changes:**

- Remove `divide-y` - no internal borders
- Softer shadow: `shadow-sm` → subtle custom shadow
- More rounded: `rounded-lg` → `rounded-xl`
- Better dark mode: warm dark background, subtle border

**New styling:**

- Light: `bg-white border border-neutral-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
- Dark: `bg-[#242321] border border-white/10`
- Padding: Keep internal sections but remove dividers

---

### Phase 2: Component Refinements

#### 3. `src/ui/badge.tsx`

**Changes:**

- Add "editorial" variant for cuisine tags
- Pills with generous padding: `px-3 py-1.5`
- Warm background (flame-pea) with white text
- Letter spacing: `tracking-wide`

**Editorial variant:**

```
bg-flame-pea-600 text-white px-3 py-1.5 tracking-wide font-semibold
```

#### 4. `src/ui/emoji-rating.tsx`

**Changes:**

- Larger emojis: `text-2xl` (24px) up from `text-xl`
- More horizontal spacing between emojis: `gap-1` minimum
- Caption styling: italic, neutral-500, smaller (13px)
- Container: better visual anchoring with subtle background

**Layout:**

- Horizontal flex with `justify-between`
- Add subtle hover scale: `hover:scale-125`
- Selected state: full opacity + subtle transform

---

### Phase 3: Restaurant Card Restructure (Major Work)

#### 5. `src/features/restaurant-card.tsx`

**New Layout Structure:**

```
┌─────────────────────────────────────┐
│  [Full-bleed hero image 16:9]       │
│  [Gradient overlay from bottom]       │
│  ┌───────────────────────────────┐  │
│  │ Cuisine badge (absolute)      │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│                                     │
│  Restaurant Name                    │  ← Playfair Display, 26px
│  📍 Location | 🔗 Menu              │  ← Inline, Source Sans
│                                     │
│  "Notes go here with refined        │  ← 16px/1.6, generous
│   typography and line height..."    │     line-height
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🚑  💩  🤡  😐  😏  😍  🍆  │   │  ← Prominent rating
│  │     "Chef's whole tongue"    │   │     section
│  └─────────────────────────────┘   │
│                                     │
│  [View on Map ▼]                    │  ← Collapsible triggers
│  [More Photos (3) ▼]                │     below rating
│                                     │
│  ─────────────────────────────────  │
│  Proposed by {name}            ✏️   │  ← Footer, minimal
│                                     │
└─────────────────────────────────────┘
```

**Key Structural Changes:**

1. **Hero Image (Always Visible)**
   - Move to top of card, full-bleed within card bounds
   - `rounded-t-xl` to match card corners
   - Gradient overlay: `bg-gradient-to-t from-black/60 via-black/20 to-transparent`
   - Cuisine badge positioned absolute top-right

2. **Restaurant Header**
   - Name: Playfair Display, 26px desktop / 20px mobile, font-semibold
   - Location + Menu link on same line, separated by `•` or `|`
   - Icon-only for menu link, text for location

3. **Notes Section**
   - Refined typography: 16px, line-height 1.6
   - Max 4 lines with `line-clamp-4` if needed
   - Subtle text color: `text-neutral-600 dark:text-neutral-400`

4. **Rating Section (Visual Anchor)**
   - Prominent placement: middle of card, not bottom
   - Subtle background container: `bg-neutral-50/50 dark:bg-white/5`
   - Padding: `p-4` to make it feel like a feature
   - Border-radius: `rounded-lg`

5. **Collapsible Sections (Below Rating)**
   - Map trigger: "View on Map" with MapPin icon
   - Images trigger: "More Photos (count)" with Images icon
   - Full-width button style: subtle background on hover
   - No borders - use background color change on hover

6. **Footer**
   - Minimal divider: `border-t border-neutral-200/60`
   - Smaller text: 14px
   - Edit button: icon only, subtle hover state

**Remove:**

- CardHeader component usage (replaced by hero + content area)
- Multiple CardContent wrappers (consolidate into one content flow)
- Collapsible wrapper around main image
- Dividing lines between sections

**Add:**

- Image click handler to open gallery directly from hero
- Better empty states for missing data
- Hover states on interactive elements

---

### Phase 4: Polish & Details

#### 6. `src/ui/lazy-image.tsx`

**Changes:**

- Skeleton loading: animate-pulse with warm neutral tone
- Transition duration: 400ms for smoother feel
- Error state: better styling with icon

**Skeleton color:**

- Light: `bg-neutral-200` → warm `bg-[#e8e6e3]`
- Dark: `bg-neutral-700` → warm `bg-[#2d2b29]`

---

## Mobile Adaptations

- **Hero image**: Maintain 16:9 aspect ratio
- **Typography**: Name scales 20px (mobile) → 26px (desktop)
- **Padding**: Reduce to `p-4` (16px) on mobile
- **Rating emojis**: Slightly smaller on mobile `text-xl`
- **Touch targets**: Minimum 44px for all interactive elements

---

## Acceptance Criteria

- [x] Typography: Playfair Display + Source Sans 3 loaded and applied
- [x] Layout: Hero image always visible at top, full-bleed
- [x] Rating: Prominent horizontal layout with larger emojis
- [x] Spacing: Generous whitespace, no cramped elements
- [x] Color: Warm off-white background (not cold neutral-50)
- [x] No dividing lines: Pure spacing-based separation
- [x] Cards feel premium and magazine-like
- [x] Mobile responsive with appropriate scaling
- [x] Dark mode: Warm dark tones (not cold gray)
- [x] Performance: Lazy loading still functional
- [x] Accessibility: Proper contrast, focus states maintained

---

## File Change Summary

| File                               | Changes                         | Priority |
| ---------------------------------- | ------------------------------- | -------- |
| `src/index.css`                    | Add fonts, warm backgrounds     | P1       |
| `src/ui/card.tsx`                  | Remove dividers, softer styling | P1       |
| `src/ui/badge.tsx`                 | Add editorial variant           | P2       |
| `src/ui/emoji-rating.tsx`          | Larger emojis, refined layout   | P2       |
| `src/features/restaurant-card.tsx` | Complete restructure            | P3       |
| `src/ui/lazy-image.tsx`            | Warm skeleton colors            | P4       |

---

## Design References

**Inspiration:**

- Cereal Magazine - minimal, warm, editorial
- Bon Appetit - bold food photography
- Airbnb listings - hero-first, clear hierarchy
- Kinfolk - generous whitespace, warm tones

**Key Principle:**

> "The food is the hero. Typography gives it authority. Whitespace lets it breathe."
