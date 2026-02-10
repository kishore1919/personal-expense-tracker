# Personal Expense Tracker — Developer README 🚀

A small expense-tracking Next.js app using MUI and Firebase (Firestore). This document explains how to set up, run, and troubleshoot the project for local development.

---

## Quick overview ✨
- Framework: Next.js (App Router)
- UI: Material UI (MUI)
- Backend: Firebase Firestore (client SDK)
- Language: TypeScript

This repository implements features like book management, expense listing with filters/sorting/pagination, CSV export, and theme-sync for dark mode.

---

## Getting started (local dev) 🛠️
Prerequisites:
- Node.js (16+ recommended) or Bun
- A Firebase project (Firestore + Auth if you need auth)

Install dependencies:

```bash
# npm
npm install
# or pnpm
pnpm install
# or bun
bun install
```

Run the dev server:

```bash
# npm
npm run dev
# or pnpm
pnpm dev
# or bun
bun dev
```

Open http://localhost:3000

---

## Environment & Firebase setup 🔐
- Copy environment variables (if used) into a `.env.local` as needed by your Firebase setup.
- Firestore rules are in `firestore.rules` and indexes in `firestore.indexes.json`.
- To delete a book and its expenses, the code performs chunked batch deletes to avoid Firestore's 500-op batch limit.

---

## Important scripts (from package.json)
- `dev` — start the local dev server
- `build` — build for production
- `start` — run production build
- `lint` — run ESLint

---

## Key files & where to look 🔎
- Pages & routes (app dir):
  - `src/app/books/page.tsx` — Books list (search, sort, pagination)
  - `src/app/book/[bookId]/page.tsx` — Book detail; filters, sorting, CSV export, running balance
  - `src/app/settings/page.tsx` — Settings & category management
  - `src/app/analytics/page.tsx` — Analytics dashboard
- Components:
  - `src/app/components/MUIProvider.tsx` — MUI theme and CSS variable sync
  - `src/app/components/AddExpenseModal.tsx` — Add expense modal
  - `src/app/components/Sidebar.tsx` — App navigation sidebar
- Contexts:
  - `src/app/context/SidebarContext.tsx` — sidebar collapsed state (hydration-safe)
  - `src/app/context/ThemeContext.tsx` — theme state (hydration-safe)
  - `src/app/context/CurrencyContext.tsx` — currency & formatter

---

## Recent fixes & notes (troubleshooting) ⚠️
- Hydration mismatches:
  - Avoid reading `localStorage` or `window.matchMedia` during render — use `useEffect` to hydrate client-only values.
  - We added `suppressHydrationWarning` on `<body>` in `src/app/layout.tsx` to reduce noisy attribute-mismatch logs during development.
- Turbopack root warning:
  - If Next infers the wrong root due to multiple lockfiles, set `turbopack.root` in `next.config.ts` (already added in this workspace) or remove the extra lockfile.
- Service worker 404:
  - A minimal `public/service-worker.js` was added to prevent 404 noise from stale registrations. If you prefer to unregister any service worker, run the following once in console or a client hook:

```js
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
```

- Firestore batch limits:
  - Bulk deletes now delete expense docs in chunks (≤ 499 per batch), then delete the book document to avoid exceeding Firestore limits.

---

## UX & behavior notes ✔️
- Book detail page includes filters (duration/type/payment mode/category), search, sorting (date/amount/balance), CSV export and pagination.
- Books list has server-side-ordered listing and client-side pagination.
- Dark mode is synchronized between MUI and global CSS variables for consistent visuals.

---

## Contributing 👥
- Fork the repo, make a feature branch, and open a pull request with a clear description.
- Keep changes small and focused. Add tests when appropriate.

---

## Help & Contact
If you run into issues, open an issue with the console trace, the page where it happened, and steps to reproduce.

Happy hacking! 🎯
