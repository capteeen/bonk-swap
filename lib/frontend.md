# BonkSwap Frontend UI/UX Guide

This document is a guide for Cursor to help build a web app with the same layout and UI as shown in the provided screenshots. The goal is to replicate the look, feel, and structure of the BonkSwap interface.

---

## 1. General Layout
- **Background:** Gradient orange/yellow background.
- **Header:**
  - Left: Logo and app name (BONKSWAP, with a dog icon).
  - Center: Navigation menu (SWAP, LIQUIDITY, STAKE, DCA, BONKORBUST, APPS).
  - Right: Wallet button ("Select Wallet").
- **Main Swap Card:**
  - Two main panels/cards side by side:
    - **FROM** (left): Token selection (BONK), input, price, market cap, change stats.
    - **TO** (right): Token selection (USDC), output, price, market cap, change stats.
  - Between panels: Arrow or swap icon.
  - Above input: "Half" and "Max" buttons.
  - Top left: "Refresh" and "Slippage" buttons.
- **Details Section (Below Swap):**
  - Shows swap route, rate, price impact, swap fees, and a summary of the swap.
  - Includes token icons, price, 24h change, and mini price chart.

---

## 2. UI/UX Notes
- **Cards:** Rounded corners, soft drop shadows, light gradient backgrounds.
- **Typography:** Bold for token names, clear hierarchy for labels/values.
- **Buttons:** Rounded, high contrast (e.g., black for wallet button), hover effects.
- **Stats:** Use green/red for positive/negative changes.
- **Charts:** Simple line charts for price history (can use placeholder for now).
- **Responsiveness:** Layout should stack vertically on mobile.

---

## 3. Component Breakdown
- **HeaderBar**: Logo, navigation, wallet button.
- **SwapPanel**: Contains FROM and TO cards.
  - **TokenCard**: For each token (BONK, USDC), shows icon, name, input/output, price, market cap, change stats.
  - **SwapActions**: Half/Max buttons, Refresh, Slippage.
- **SwapDetails**: Shows route, rate, price impact, swap fees, summary.
- **MiniChart**: Small line chart for price history.

---

## 4. Suggested Tech Stack
- **React** (with hooks)
- **Styled Components** or **Tailwind CSS** for styling
- **Recharts** or **Chart.js** for mini price charts
- **Web3/Wallet Adapter** for wallet connection

---

## 5. Implementation Tips
- Use a CSS gradient for the background.
- Use flexbox or CSS grid for layout.
- Use context or state management for swap logic.
- Mock data for prices/market cap if backend is not ready.
- Use SVG or PNG for token icons.

---

## 6. Example File Structure
```
/components
  HeaderBar.tsx
  SwapPanel.tsx
  TokenCard.tsx
  SwapActions.tsx
  SwapDetails.tsx
  MiniChart.tsx
/pages
  index.tsx
/styles
  theme.ts
```

---

## 7. References
- Use the screenshots as the primary visual reference for spacing, colors, and layout.
- Follow modern DeFi UI/UX best practices for accessibility and responsiveness.

---

> **Cursor:** Use this guide to structure, style, and implement the BonkSwap frontend to match the provided screenshots as closely as possible.
