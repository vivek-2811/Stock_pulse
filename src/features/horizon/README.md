# Horizon Finance: Converted Transaction Ledger Showcase

Horizon Finance is a high-density, real-time transaction ledger designed to show senior-level frontend engineering. Originally built as a static HTML/CSS/JS mockup, this feature has been fully converted into a production-grade React + TypeScript module integrated within the **StockPulse** recruiter showcase platform.

---

## 🛠️ Key Design Decisions

### 1. State Orchestration: `useReducer` vs `useState`
Instead of scattering transaction data updates across individual state hooks (e.g. for uploads, deletions, categories, and edits), the CRUD lifecycle is coordinated by a unified React `useReducer` inside [useTransactions.ts](file:///C:/Users/Asus/Desktop/D1/stockpulse/src/features/horizon/hooks/useTransactions.ts). This ensures atomic and trace-able state transitions.

### 2. Optimistic UI Updates & Error Rollbacks
When saving transaction details (such as category edits or personal memo changes), the ledger applies the updates *optimistically* in the UI immediately. It then triggers a mock asynchronous service with a 1.2s network latency.
- **Success Path**: The saving loader unmounts and a success toast confirmation flashes.
- **Fail Path (Simulated)**: If the "Simulate Network Error" system toggle is active, the operation is rejected. The reducer rolls the state back to the cached original transaction properties, and an error alert is shown.

### 3. Debounced Searching & Memoized Filtering
- **Input Debouncing**: Keyup searches are debounced by 250ms via [useDebouncedSearch.ts](file:///C:/Users/Asus/Desktop/D1/stockpulse/src/features/horizon/hooks/useDebouncedSearch.ts). This avoids triggering refilters and layouts on every keystroke, reducing CPU stress.
- **Memoized Filtering**: Visible items are computed via `useMemo` based on active category pills and the debounced search keyword.
- **Component Memoization**: Rows are rendered using the `React.memo`'d [TransactionRow.tsx](file:///C:/Users/Asus/Desktop/D1/stockpulse/src/features/horizon/components/TransactionRow.tsx) component. This prevents unnecessary re-rendering of all rows in the grid when only the parent search text changes.

### 4. Interactive Data Visualizations
Responsive SVG-based visualizations render live aggregated spending patterns directly from the transaction dataset:
- **Donut/Bar Categories Breakouts**: Proportional spend charts.
- **Income vs Expense Metrics**: Multi-month comparisons with custom spring height metrics.

---

## ♿ Accessibility & Keyboard Support
The ledger is navigable via keyboard and screen readers:
- **Focus Trapping**: The [DetailsDrawer.tsx](file:///C:/Users/Asus/Desktop/D1/stockpulse/src/features/horizon/components/DetailsDrawer.tsx) slide-over traps tab focus while open and closes instantly on hitting `Escape`.
- **Focus Restoration**: When the drawer closes, focus is returned to the table row that originally triggered the panel.
- **Keyboard Navigation**: Rows support `tabIndex={0}` and can be opened by pressing `Enter` or `Space`.

---

## 🚫 Out of Scope (Intentional Design Boundaries)
To keep the component focused on demonstrating frontend crafts, the following architectures were intentionally omitted:
- **Real Backend / database integrations**: Transactions persist in `localStorage` for session continuity but do not connect to a real database.
- **Authentications**: System settings assume a single-user Platinum tier session (`Sarah Jenkins`).
- **Table Virtualization**: Virtualized viewports (e.g. `react-window`) were considered but excluded since the standard dataset size (~10–100 items) is too small to justify the additional JS payload.
