# DESIGN SYSTEM

> Apple-inspired design language. Photography-first, UI recedes. Single blue accent. Alternating light/dark tiles.

---

## Colors

### Accent
| Token | Hex | Use |
|---|---|---|
| `primary` | `#4F46E5` | Every interactive element — links, CTAs, focus signals. The ONLY accent color. |
| `primary-focus` | `#6366f1` | Keyboard focus ring on buttons (`outline: 2px solid`) |
| `primary-on-dark` | `#818cf8` | Links on dark tiles only |

### Status
| Token | Hex | Use |
|---|---|---|
| `success` | `#10B981` | Active alarm state, accepted permission |
| `danger` | `#ef4444` | Destructive actions, errors |

### Surfaces
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#ffffff` | Dominant canvas — content, utility cards, store tiles |
| `canvas-parchment` | `#f5f5f7` | Alternating light tiles, footer, page canvas |
| `surface-pearl` | `#fafafc` | Secondary ghost button fill |
| `surface-tile-1` | `#272729` | Primary dark tile |
| `surface-tile-2` | `#2a2a2c` | Dark tile sitting above/below tile-1 (micro-step lighter) |
| `surface-tile-3` | `#252527` | Bottom of stack, video frames (micro-step darker) |
| `surface-black` | `#000000` | Global nav bar, video backgrounds only |
| `surface-chip-translucent` | `rgba(210,210,215,0.64)` | Circular control chips over photography |

### Text
| Token | Hex | Use |
|---|---|---|
| `ink` | `#1d1d1f` | All headlines, body, dark utility button fill |
| `body-on-dark` | `#ffffff` | All text on dark tiles |
| `body-muted` | `#cccccc` | Secondary copy on dark tiles |
| `ink-muted-80` | `#333333` | Body on Pearl Button surface |
| `ink-muted-48` | `#7a7a7a` | Disabled button text, fine-print |

### Borders
| Token | Value | Use |
|---|---|---|
| `divider-soft` | `rgba(0,0,0,0.04)` | Secondary button ring |
| `hairline` | `#e0e0e0` | Store utility cards, configurator chips |

**Rules:**
- `primary` (#4F46E5) is the ONLY accent — never introduce a second color
- `surface-black` appears only in global nav and video backgrounds
- `primary-on-dark` (#818cf8) is for dark tiles only; never use on light surfaces

---

## Typography

### Font Stack
```css
/* Display (≥19px) */
font-family: SF Pro Display, system-ui, -apple-system, sans-serif;

/* Body / UI */
font-family: SF Pro Text, system-ui, -apple-system, sans-serif;

/* Fallback (non-Apple) */
font-family: Inter, system-ui, sans-serif;
/* Inter: add letter-spacing: -0.01em on display sizes */
```

### Scale
| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `hero-display` | 56px | 600 | 1.07 | -0.28px | Hero headline |
| `display-lg` | 40px | 600 | 1.10 | 0 | Product tile headlines |
| `display-md` | 34px | 600 | 1.47 | -0.374px | Section heads |
| `lead` | 28px | 400 | 1.14 | 0.196px | Product tile subcopy |
| `lead-airy` | 24px | 300 | 1.5 | 0 | Airy lead paragraphs |
| `tagline` | 21px | 600 | 1.19 | 0.231px | Sub-tile tagline, sub-nav name |
| `body-strong` | 17px | 600 | 1.24 | -0.374px | Inline strong emphasis |
| `body` | 17px | 400 | 1.47 | -0.374px | Default paragraph |
| `dense-link` | 17px | 400 | 2.41 | 0 | Footer link lists |
| `caption` | 14px | 400 | 1.43 | -0.224px | Captions, button text |
| `caption-strong` | 14px | 600 | 1.29 | -0.224px | Emphasized captions |
| `button-large` | 18px | 300 | 1.0 | 0 | Store hero CTAs |
| `button-utility` | 14px | 400 | 1.29 | -0.224px | Utility/nav button labels |
| `fine-print` | 12px | 400 | 1.0 | -0.12px | Footer body |
| `micro-legal` | 10px | 400 | 1.3 | -0.08px | Legal disclaimers |
| `nav-link` | 12px | 400 | 1.0 | -0.12px | Global nav items |

**Rules:**
- Weight ladder: **300 / 400 / 600 / 700** — weight 500 is deliberately absent
- Negative letter-spacing only at 17px and above; never at 12px or below
- Body copy is always **17px**, not 16px
- Weight 300 is reserved for large airy moments (`lead-airy`, `button-large`) only
- Headlines are weight **600**, not 700

---

## Spacing

| Token | Value |
|---|---|
| `xxs` | 4px |
| `xs` | 8px |
| `sm` | 12px |
| `md` | 17px |
| `lg` | 24px |
| `xl` | 32px |
| `xxl` | 48px |
| `section` | 80px |

- **Base unit:** 8px — structural layout snaps to 8/12/16/20/24
- **Tile vertical padding:** 80px (`section`)
- **Card padding:** 24px (`lg`)
- **Button padding:** 8–11px vertical × 15–22px horizontal
- Tiles stack edge-to-edge with **0 gap** — color change is the divider

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `none` | 0px | Full-bleed product tiles |
| `xs` | 5px | Subtle inline chips (rare) |
| `sm` | 8px | Dark utility buttons, inline card imagery |
| `md` | 11px | Pearl Button capsules |
| `lg` | 16px (`rounded-2xl`) | Store/accessories grid cards |
| `pill` | 9999px | Primary blue CTAs, configurator chips, search input |
| `full` | 50% | Circular control chips over photography |

**Rules:**
- `pill` = "this is an action" signal — reserve for primary CTAs, chips, search
- Full-bleed tiles are always `none` (rectangular, edge-to-edge)
- Don't mix radius grammars — `sm` for compact utility, `lg` for cards, `pill` for actions

---

## Elevation & Shadow

| Level | CSS | Use |
|---|---|---|
| Flat | none | Tiles, nav, footer, body sections |
| Soft hairline | `1px solid rgba(0,0,0,0.08)` | Utility cards, sub-nav separator |
| Backdrop blur | `backdrop-filter: saturate(180%) blur(20px)` | Sub-nav frosted glass, floating sticky bar |
| **Product shadow** | `box-shadow: rgba(0,0,0,0.22) 3px 5px 30px 0` | Product renders on a surface — THE ONLY SHADOW |

**Rules:**
- Shadow is applied **only to product photography** — never to cards, buttons, or text
- Elevation comes from surface-color change (light ↔ dark tile), not chrome
- Never add decorative gradients — atmosphere comes from photography

---

## Components

### Global Nav
```
Background:  #000000 (surface-black)
Height:      44px
Text:        nav-link (12px / 400 / -0.12px), #ffffff
Right:       Search + Bag icons
Collapse:    ≤834px → hamburger
```

### Sub-Nav (Frosted)
```
Background:  canvas-parchment 80% + backdrop-filter blur
Height:      52px
Left:        Product category — tagline (21px / 600)
Right:       nav links (button-utility 14px) + button-primary CTA
```

### Buttons

**button-primary** — Signature action
```css
background:    #4F46E5;
color:         #ffffff;
font:          17px / 400 SF Pro Text;
border-radius: 9999px;          /* pill */
padding:       11px 22px;
/* Active */ transform: scale(0.95);
/* Focus  */ outline: 2px solid #6366f1;
```

**button-secondary-pill** — Ghost pill CTA
```css
background:    transparent;
color:         #4F46E5;
border:        1px solid #4F46E5;
border-radius: 9999px;
padding:       11px 22px;
```

**button-dark-utility** — Nav actions (Sign In, Bag)
```css
background:    #1d1d1f;
color:         #ffffff;
font:          14px / 400 / -0.224px;
border-radius: 8px;             /* sm */
padding:       8px 15px;
/* Active */ transform: scale(0.95);
```

**button-pearl-capsule** — Card secondary
```css
background:    #fafafc;
color:         #333333;
border:        3px solid rgba(0,0,0,0.04);
border-radius: 11px;            /* md */
padding:       8px 14px;
font:          14px / 400;
```

**button-icon-circular** — Floats over photography
```css
width:         44px;
height:        44px;
background:    rgba(210,210,215,0.64);
border-radius: 50%;
```

### Product Tiles

**Light tile**
```
Background:   #ffffff
Text:         #1d1d1f
Padding:      80px vertical
Border-radius: 0 (edge-to-edge)
Stack:        display-lg headline → lead tagline → 2× button-primary → product render
```

**Parchment tile** — Same as light, background `#f5f5f7`

**Dark tile**
```
Background:   #272729
Text:         #ffffff (links: #818cf8)
Padding:      80px vertical
Border-radius: 0
```

Alternate: **light → dark → light → dark** — color change IS the section divider.

### Store Utility Card
```css
background:    #ffffff;
border:        1px solid #e0e0e0;
border-radius: 18px;            /* lg */
padding:       24px;
/* Image: 1:1 crop, border-radius: 8px inside */
/* Name:  body-strong (17px / 600) */
/* Price: body (17px / 400) */
/* CTA:   text-link in #4F46E5 */
```

### Search Input
```css
background:    #ffffff;
border:        1px solid rgba(0,0,0,0.08);
border-radius: 9999px;          /* pill */
padding:       12px 20px;
height:        44px;
font:          17px / 400;
```

### Floating Sticky Bar
```css
background:    rgba(245,245,247,0.80);   /* parchment 80% */
backdrop-filter: saturate(180%) blur(20px);
height:        64px;
padding:       12px 32px;
/* Left: price total — body (17px) */
/* Right: button-primary */
```

---

## Layout

| Breakpoint | Width | Key changes |
|---|---|---|
| Wide desktop | ≥1441px | Content locked at 1440px |
| Desktop | 1069–1440px | Full layout, 4–5 col grids |
| Small desktop | 1024–1068px | 2/3 width tiles, hero h1 40px |
| Tablet landscape | 834–1023px | Nav fully expanded, 2-col grids |
| Tablet portrait | 736–833px | Nav → hamburger |
| Large phone | 641–735px | Tile padding 48px |
| Phone | 420–640px | Single column, hero 34px |
| Small phone | ≤419px | Hero drops to 28px |

**Utility grid columns:** 5 → 4 → 3 → 2 → 1 as breakpoints shrink

**Hero typography collapse:**
```
56px (hero-display) → 40px (1068px) → 34px (640px) → 28px (419px)
```

**Touch targets:** Minimum 44×44px on all interactive elements.

---

## Rules Summary

| ✅ Do | ❌ Don't |
|---|---|
| Single accent `#4F46E5` for every interactive element | Introduce a second accent color |
| Negative letter-spacing on headlines (17px+) | Use gradients as decorative backgrounds |
| Body copy at 17px / 400 / lh 1.47 | Set body at 16px or weight 500 |
| Alternate light ↔ dark tiles for section rhythm | Add shadows to cards, buttons, or text |
| `pill` radius for primary CTAs only | Use pill radius on utility cards |
| Product shadow only on product renders | Round full-bleed tiles |
| `transform: scale(0.95)` on all button active states | Use `primary-on-dark` (#818cf8) on light surfaces |
| Global nav stays `surface-black` (#000000) | Tighten body line-height below 1.47 |
