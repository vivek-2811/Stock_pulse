# Recruiter Evaluation & Showcase Guide

This guide explains how recruiters can navigate and evaluate the StockPulse platform in under 3 minutes.

---

## 1. Fast Assessment Flow

### Step 1: Launch Showcase Mode
1. Click **Showcase** in the sidebar.
2. Review the architecture diagram and tech stack summary.
3. Click **Play Guided Demo** to launch the automated route navigation walk-through.

### Step 2: Test Workspace Reset
1. Go to **Portfolio** or **Watchlist** and click "Reset Demo Workspace" or delete cards.
2. Go to **Showcase** and click **Reset Data baseline**. Confirm that all mock assets, screens, and AI chat logs restore.

### Step 3: Trigger Keyboard Command
1. Press `?` (or `Shift + /`) to open the global shortcut cheat sheet.
2. Press `Ctrl + K` (or `Cmd + K`) to open the Command palette, and search for a ticker (e.g. `AAPL`).

---

## 2. Key Engineering Highlights to Mention in Interviews
* **PubSub simulated feed**: In-memory market ticker pushing ticks reactively to Zustand stores.
* **Density design tokens**: Unified spacing and font variables preventing layout shifting.
* **Universal loader skeletons**: Shimmer states replacing simple loading rings.
