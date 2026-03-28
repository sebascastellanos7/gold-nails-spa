# Gold Nails Spa — Project Guide

## Overview
Single-page luxury nail spa website. Pure vanilla HTML/CSS/JS — no build tools, no npm, no dependencies. Open `index.html` directly in a browser.

## Tech Stack
- **HTML5** (`index.html`) — full site structure, Spanish (`lang="es"`)
- **CSS3** (`styles.css`) — design tokens via CSS variables, ~850 lines
- **Vanilla JS** (`main.js`) — ~222 lines, no frameworks
- **Assets** — 15 JPG images in root directory

## Design Tokens (CSS Variables)
- `--color-primary`: `#0A0A0A` (black background)
- `--color-accent`: `#D4AF37` (gold)
- `--color-text`: `#FAF9F6` (cream)
- Fonts: Cormorant Garamond (serif), Josefin Sans (sans-serif) via Google Fonts

## Page Sections (in order)
1. Navigation — fixed glassmorphism navbar
2. Hero — full-screen parallax banner
3. About — philosophy with image and badges
4. Services — 6-card grid
5. Gallery — 11-item masonry layout
6. Testimonials — 5 reviews with star ratings
7. Booking — reservation form with validation
8. Footer — brand info, social links, WhatsApp CTA

## Key JS Behaviors (`main.js`)
- Scroll reveal animations via `IntersectionObserver`
- Active nav link tracking via `IntersectionObserver`
- Hamburger mobile menu with ARIA `aria-expanded`
- Booking form validation with toast notifications
- Lazy image loading with fade-in
- Parallax background effect
- Dynamic footer year

## No Build Process
No compilation, bundling, or transpilation. Edit files directly and refresh browser.
