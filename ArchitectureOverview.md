# System Architecture Overview

This document describes the design layers and data flows in the StockPulse platform.

---

## 1. Directory Structure

```
stockpulse/
├── src/
│   ├── components/       # Reusable layout and telemetry components
│   ├── theme/            # Consolidated design system tokens
│   ├── store/            # Decoupled Zustand stores
│   ├── services/         # MockDataEngine NYSE PubSub generator
│   ├── features/         # Page-specific feature modules
│   └── main.tsx          # Application entry point
```

## 2. Telemetry PubSub Data Flow

The platform utilizes a mock real-time simulator that drives UI updates:
1. `MockDataEngine` starts ticking on application mount.
2. It pushes updated stock prices, indices, and sector spreads.
3. Decoupled Zustand stores subscribe to these ticks and update components reactively.
4. Calculations are memoized to minimize canvas and DOM redraws.
