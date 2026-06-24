# Horizon Finance: HTML/JS to React/TS Conversion Notes

This log documents the refactoring decisions made during the migration of the Horizon Finance transactions dashboard prototype (`C:\Users\Asus\Desktop\UI`) to StockPulse's modern React + TypeScript + Tailwind v4 build system.

---

## 🔄 Core Architectural Shifts

### 1. State Management vs. Manual DOM Manipulation
- **Prototype (Vanilla JS)**: The state was stored in a global `transactions` array, and every change (filtering, searching, editing, clearing) required manually query-selecting elements (like `tableBody.innerHTML = ''`), clearing the DOM, and re-injecting HTML strings with inline event listeners.
- **React (TypeScript)**: Converted to a declarative model where UI renders reactively from state. The CRUD lifecycle is orchestrated via a clean React `useReducer` hook inside `useTransactions.ts`, maintaining single-direction data flow.

### 2. Base64 Receipt Image Upload Handling
- **Prototype (Vanilla JS)**: The file input change listener used `FileReader` to read files, then set `txn.receipt = imgBase64` and manually mutated the `display` style of `#receipt-preview` and set `#receipt-preview-img.src`.
- **React (TypeScript)**: Refactored into a declarative [ReceiptDropzone.tsx](file:///C:/Users/Asus/Desktop/D1/stockpulse/src/features/horizon/components/ReceiptDropzone.tsx) component. The base64 string is managed as local form state inside the `DetailsDrawer` and only committed to the global transaction state when the user explicitly clicks "Save Changes". We also introduced defensive file validations (type checking for `image/*` and size capping at 2MB) which were missing in the prototype.

### 3. Event Handling and Event Delegation
- **Prototype (Vanilla JS)**: Bindings were scattered across various `.addEventListener` calls at the bottom of `app.js`. Row clicks were bound dynamically during HTML string injection, using inline `onclick="event.stopPropagation()"` to avoid checkbox toggles triggering the drawer.
- **React (TypeScript)**: Cleanly handled via React's synthetic event bubble. Clicking a checkbox stops propagation declaratively: `onClick={(e) => e.stopPropagation()}` on the wrapping checkbox table cell. 

---

## 🛠️ Issues Encountered & Resolved

### 1. Typographic Alignment (Tabular Numerals)
- **Problem**: In high-density list displays, fluctuating number widths (e.g. `1` vs `8`) caused the decimal points in the amount column to shift slightly, breaking visual scan lines.
- **Solution**: Replicating the CSS `font-variant-numeric: tabular-nums;` rule by adding the Tailwind v4 utility class `tabular-nums` to the amount column in `TransactionRow` and stats values.

### 2. Drawer Exit Animations
- **Problem**: Using vanilla CSS class toggling (like `.classList.add('open')`) meant that if the drawer was closed quickly, it would disappear instantly or animate inconsistently with React's render cycles.
- **Solution**: Integrated Framer Motion's `<AnimatePresence>` around the `<DetailsDrawer>` to coordinate Spring transitions with unmounting, ensuring fluid slide-out exit animations on close.

### 3. Tab Indexing and Focus Restoration
- **Problem**: When a user navigated the table via keyboard, hitting Space/Enter on a focused row opened the drawer, but closing the drawer caused the keyboard focus to get lost at the top of the body, breaking WCAG compliance.
- **Solution**: Stored `document.activeElement` inside a ref when the drawer mounts, and called `.focus()` on the cached element when the drawer closes or unmounts, keeping the keyboard user context completely intact.
