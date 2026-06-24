# Technical Debt Registry

This registry tracks minor refactoring opportunities and future enhancements for developer follow-up.

---

## 1. Identified Technical Debt

### State Synchronization
* **Issue**: Custom chart animations reload data arrays on timeframe switches.
* **Refactor Plan**: Implement a cached data buffer or store history in Zustand to avoid re-fetching via mock calculations.

### Virtualized Lists
* **Issue**: The screener results table renders up to 50 rows.
* **Refactor Plan**: Integrate react-window or react-virtual to limit DOM nodes on larger search lists if expanded beyond 100 tickers.

### CSS Container Queries
* **Issue**: Grid columns collapse based on screen width.
* **Refactor Plan**: Transition to CSS Container Queries (`@container`) once Tailwind v4 has complete browser compatibility support.

---

## 2. DSA & Core Engineering Review Tasks
For placement and engineering review prep, prioritize:
- [ ] **System Design**: Client-server WebSocket architectures.
- [ ] **SQL Indexes**: Optimizing join structures for large tick databases.
- [ ] **OOP Patterns**: Observer pattern for PubSub market generator.
