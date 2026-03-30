# Gold Nails Spa — Project Guide

## Overview
Multi-page luxury nail spa website. Pure vanilla HTML/CSS/JS — no build tools, no npm, no dependencies. Open `index.html` directly in a browser.

## File Structure
- **`index.html`** (486 lines) — main landing page, Spanish (`lang="es"`)
- **`services.html`** (1,161 lines) — full services catalog with shopping cart UI
- **`styles.css`** (1,785 lines) — complete design system including cart styles
- **`main.js`** (221 lines) — vanilla JS behaviors, no frameworks
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
10. **Toast** — success notification (slides in from bottom, `.show` class triggers)

## services.html
Separate page with all 19 services organized by category (Manos, Pies, Acrílicas, etc.). Each service card has `data-nombre`, `data-precio`, `data-duracion` attributes powering the cart. Includes embedded `<style>` block for page-specific overrides. Navbar has `.scrolled` class by default (no hero scroll trigger needed).

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