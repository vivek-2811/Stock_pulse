# Visual Audit & Design System Alignment Report

This document reports on the visual consistency audit across all StockPulse pages, ensuring a unified UI/UX, unified spacing multipliers, and strict design token compliance.

---

## 1. Card Spacing & Layout Alignment
* **Audit Standard**: Card borders must use `border-border-glass` (`rgba(255, 255, 255, 0.08)`) with `glass-card` background (`rgba(255, 255, 255, 0.03)`).
* **Margin/Padding**: Main pages use standard gutter padding (`px-6 py-6`).
* **Radius Scale**: Corner radius is uniformly set to `rounded-xl` (12px/0.75rem) for standard widgets, and `rounded-2xl` (16px/1rem) for page heroes.

## 2. Typography Consistency
* **Display Elements**: Stock tickers and main metric readouts leverage tabular numbers (`font-mono tabular-nums`).
* **Headings**: Page titles consume `headline-lg` (`text-xl font-bold text-white`) or `headline-md` (`text-sm font-bold uppercase tracking-wider`).
* **Muted Content**: Description copy uses `text-text-muted` (`#8A8F98`) exclusively to maintain accessibility contrast ratios (above 4.5:1).

## 3. Interactive Buttons & Hover Lifts
* **Action Buttons**: CTA actions consume `btn-primary` with green outer glow on hover, or `btn-ghost` for secondary triggers.
* **Hover State**: Cards consume `.glass-card-hover:hover` or `.card-hover-lift` spring transitions, avoiding flat jumps.
* **Select Indicators**: Sidebar and tabs leverage spring layouts (`layoutId="activeSidebar"`) for fluid line transfers.

## 4. Charts & Visualization Wrappers
* **Layouts**: Charts are centered inside cards with a fixed height (220px to 300px) and clean relative margins, preventing overlap.
* **End Dots**: Glowing SVG end-dots correspond to prices (green for positive, red for negative).

## 5. Mobile & Tablet Responsiveness
* **Flex Wrappers**: Grid systems automatically collapse from `grid-cols-3` or `grid-cols-2` down to `grid-cols-1` on screens under 768px.
* **Sidebar**: Desktop layout hides sidebar on mobile, replacing it with a slide-in Hamburger Drawer and unified bottom mobile navigation elements.
