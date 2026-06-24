# Accessibility (a11y) Compliance Report

This report tracks focus states, keyboard shortcuts, ARIA tags, contrast ratios, and prefers-reduced-motion support.

---

## 1. Keyboard Nav & Focus Control
* **Command Palette**: `Ctrl + K` triggers the modal. Arrow keys traverse elements, and `Enter` executes actions.
* **Shortcut Guide**: Pressing `?` displays the shortcut cheatsheet.
* **Global Navigation**: Traversal commands (`g` + page key) allow fast jumping between pages without mouse interaction.
* **Focus outline**: Interactive cards and buttons consume focus rings (`focus:outline-none focus:border-app-green`) when navigated via keyboard.

## 2. ARIA Labels & Semantic Tags
* **Interactive elements**: Close buttons, page toggles, and preset trigger buttons have explicit `aria-label` tags (e.g. `aria-label="Close modal"`).
* **Semantic HTML**: Sections use standard tags (`header`, `main`, `aside`, `nav`, `button`, `section`) instead of generic nested divs.
* **Icons**: Decorative Lucide-react icons are labeled or have hidden accessibility tags where text label is already present.

## 3. Contrast Ratios
* **Background vs Text**: Charcoal-black surfaces (`#0A0E14`) pair with off-white text (`#dfe2eb`) and soft-grey descriptors (`#8A8F98`), satisfying WCAG AA standards (4.5:1 ratio).
* **Color Indicators**: Green price changes (`#00FF94`) and red drops (`#FF3B5C`) include text indicator badges to support color-blind users.

## 4. Prefers-Reduced-Motion Support
* Layout transitions and spring animations are disabled when `prefers-reduced-motion: reduce` is configured in browser settings.
