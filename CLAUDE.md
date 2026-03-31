# Gold Nails Spa — Project Guide

## Overview
Multi-page luxury nail spa website. Pure vanilla HTML/CSS/JS — no build tools, no npm, no dependencies. Open `index.html` directly in a browser.

## File Structure
- **`index.html`** (486 lines) — main landing page, Spanish (`lang="es"`)
- **`services.html`** (1,298 lines) — full services catalog with shopping cart UI
- **`styles.css`** (2,572 lines) — complete design system including cart + game styles
- **`main.js`** (230 lines) — vanilla JS behaviors, no frameworks
- **`game.js`** (572 lines) — "Juega y Gana" memory game + voucher system (see section below)
- **`Servicios.json`** (227 lines) — service database (19 services with prices, durations, keywords)
- **`logo.png`** / **`background.png`** — brand assets
- 15 JPG images — gallery photos (timestamp filenames)

## Design Tokens (CSS Variables)
```
--black: #0A0A0A          --gold: #D4AF37
--black-soft: #111111     --gold-light: #E8C84A
--black-card: #141414     --gold-dim: #D4AF3733
--black-glass: #161616e6  --gold-border: #D4AF3755
--cream: #FAF9F6          --grey: #888888
--cream-dim: #FAF9F6aa    --grey-light: #555555
--font-serif: 'Cormorant Garamond', Georgia, serif
--font-sans: 'Josefin Sans', system-ui, sans-serif
--ease-luxury: cubic-bezier(0.76, 0, 0.24, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--section-pad: clamp(80px, 10vw, 140px)
--container: 1240px
--side-pad: clamp(1rem, 5vw, 2rem)
--cart-width: min(420px, 92vw)
```

## index.html Sections (in order)
1. **Navigation** — fixed glassmorphism navbar (`.scrolled` adds blur on scroll)
2. **Hero** — full-screen parallax banner with scroll indicator
3. **About** — philosophy, image, "100% Toxic Free" badge with tooltip, 4 pillars
4. **Services** — 6-card grid with staggered reveal animations
5. **Gallery** — 11-item CSS masonry (`.tall` / `.wide` items for visual rhythm)
6. **Testimonials** — 7 Google review cards with star ratings and avatar initials
7. **Booking** — 4 contact info cards + floating-label reservation form
8. **Footer** — brand info, 4 social links, 3-column nav, legal text
9. **WhatsApp FAB** — fixed button (green, bottom-right) with spring-animated tooltip
10. **Juega y Gana FAB** — gold pulsing star button above WhatsApp FAB, injected by `game.js`
11. **Toast** — success notification (slides in from bottom, `.show` class triggers)

## services.html
Separate page with all 19 services organized by category (Manos, Pies, Acrílicas, etc.). Each service card has `data-nombre`, `data-precio`, `data-duracion` attributes powering the cart. Includes embedded `<style>` block for page-specific overrides. Navbar has `.scrolled` class by default (no hero scroll trigger needed).

## Juega y Gana — Game & Voucher System (game.js)

Single IIFE loaded by both `index.html` and `services.html`. Must be loaded **before** the embedded cart `<script>` in `services.html` so `window.GNSVoucher` is available.

### Public API: `window.GNSVoucher`
| Property | Type | Description |
|---|---|---|
| `AMOUNT` | `5000` | Discount in COP |
| `isValid()` | `→ boolean` | Checks `localStorage['gns_voucher_expiry']` against `Date.now()` |
| `set()` | `→ void` | Writes expiry timestamp (now + 15 min), starts global countdown |
| `clear()` | `→ void` | Removes key, stops interval, fires `gns:voucher-cleared` event |
| `getExpiry()` | `→ number` | Raw ms timestamp from localStorage |
| `formatCountdown(ms)` | `→ "MM:SS"` | Formats remaining ms as countdown string |

### DOM Injected by game.js
- `#gnsGameFab` — fixed FAB button (`.gns-fab`, `.gns-fab--above-cart` on services.html)
- `#gnsModal` — full-screen game dialog with 4 screens: intro / game / win / lose
- `#gnsExpiredModal` — alertdialog shown when voucher countdown hits 0:00

### FAB Positioning
- `index.html`: `.gns-fab` default — `bottom: 7.5rem; right: 2.2rem` (above WhatsApp)
- `services.html`: `.gns-fab--above-cart` — `bottom: 11rem; right: 2.2rem` (above cart FAB)
- Mobile `≤480px`: matches cart FAB shift — `bottom: 6.5rem; right: 1.4rem`

### Game Flow
1. User clicks FAB → modal opens (shows win screen if voucher already active)
2. Intro → "Empezar" → 4×2 card board (8 cards, 4 pairs: 💅🌸✨🧴), 20s timer
3. Win all 4 pairs → confetti + `setVoucher()` → 15-min countdown starts
4. Timer ≤5s or countdown ≤5min → red pulse animation (FOMO)
5. At 0:00 → "Bono Expirado" modal, `clearVoucher()` fires `gns:voucher-cleared`

### Cart Integration (services.html)
- `renderItems()` checks `window.GNSVoucher.isValid()` and branches totals HTML:
  - **With voucher**: subtotal row + green "Bono Juega y Gana: −$5,000" row + final total + live countdown (`#cartVoucherCountdown`)
  - **Without voucher**: original single-total layout
- `handleConfirm()` re-validates at submit time; sends `total_price` (discounted) + `voucher` object to n8n webhook; calls `GNSVoucher.clear()` on success
- Listens for `gns:voucher-claimed` and `gns:voucher-cleared` events → calls `renderItems()`

### CSS Classes (styles.css, section `/* ═══ JUEGA Y GANA GAME ═══ */`)
| Key class | Purpose |
|---|---|
| `.gns-fab` | Base FAB, pulsing gold ring animation |
| `.gns-fab--above-cart` | Added on services.html; raises bottom to clear cart FAB |
| `.gns-fab--active` | Applied while voucher is valid; changes pulse to glow |
| `.gns-modal` + `.gns-visible` | Full-screen dialog; opacity transition on `.gns-visible` |
| `.gns-card` + `.gns-flipped` + `.gns-matched` | 3D card flip via `rotateY`; reduced-motion uses opacity |
| `.gns-timer--urgent` | Red pulse on game timer ≤5s |
| `.gns-voucher-time.gns-urgent` | Red pulse on win-screen countdown ≤5min |
| `.gns-cart-voucher-block` | Discount breakdown injected into `.cart-totals` |
| `.gns-cart-countdown.gns-urgent` | Red pulse on cart countdown ≤5min |

---

## Shopping Cart System (styles.css lines 1294–1786)
Full e-commerce UI built in CSS/JS:
- **`.cart-fab`** — fixed FAB with `.cart-fab-badge` item count
- **`.cart-backdrop`** + **`.cart-panel`** — slide-in side panel (420px, full-width on mobile)
- Cart items show name, price, duration with remove button
- **`.cart-totals`** — summary with total price + total duration
- **`.cart-form-group`** — date input + time slot picker (`.cart-timeslots-grid`)
- **`.cart-payment-fieldset`** — payment method radio buttons
- **`.cart-success-screen`** — confirmation screen with pop animation
- **`.cart-loading-overlay`** — spinner shown during simulated search

## main.js Modules (all IIFEs, `'use strict'`)
| Function | Behavior |
|---|---|
| `initNavbar()` | `.scrolled` on navbar when `scrollY > 60` |
| `initMobileMenu()` | hamburger toggle, ESC close, body scroll lock, `aria-expanded` |
| `initReveal()` | IntersectionObserver → adds `.visible` to `.reveal-up/left/right` |
| `initParallax()` | `translateY` ±40px on `.parallax-bg`, respects `prefers-reduced-motion` |
| `initActiveLink()` | gold nav links via IntersectionObserver on `section[id]` |
| `initSmoothScroll()` | smooth scroll with dynamic navbar height offset |
| `initForm()` | floating label date fix, field validation, 1.4s simulated submit, toast |
| `updateYear()` | sets `#current-year` to current year |
| `initServiceCards()` | Enter/Space keyboard access on `.service-card[tabindex="0"]` |
| `initLazyImages()` | IntersectionObserver + `img.decode()` fade-in, 200px rootMargin |

## Servicios.json Schema
```json
{ "nombre": "...", "claves": ["kw1","kw2","kw3"], "duracion": 45, "Descripción": "...", "precio": 20000 }
```
19 services from 10,000 COP (Cambio de Esmalte) to 125,000 COP (Acrílicas esculpidas con molde). Keywords (`claves`) suggest chatbot/search integration.

## Responsive Breakpoints
- **1100px** — 2-col grids (services, testimonials), masonry 3-col
- **1024px** — tablet landscape: tighter gaps for booking/about containers
- **900px** — stack to 1 col, reduce masonry to 2-col
- **768px** — hide nav links, show hamburger; cart panel width `min(380px, 88vw)`
- **540px** — tighter nav/hero padding, footer-bottom stacks vertically
- **480px** — hero actions stack, booking form tighter padding; cart panel full-width
- **360px** — masonry collapses to 1 col (only on very narrow screens)

## No Build Process
No compilation, bundling, or transpilation. Edit files directly and refresh browser.

## n8n Automation (MCP)

You have access to n8n-mcp tools connected to my live n8n instance on Railway.
- URL: https://n8n-production-5920.up.railway.app

### Always follow this order when building workflows:
1. `search_nodes()` — find the right node
2. `get_node_essentials()` — get exact properties before configuring
3. `validate_workflow()` — check before deploying
4. `create_workflow()` / `update_workflow()` — deploy to n8n

### Rules
- NEVER guess node properties — always call `get_node_essentials()` first
- NEVER deploy without validating first
- Use `{{$json.field}}` syntax for expressions