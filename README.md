This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Developer Guide (short)

**Environment & Firebase**
- Create a Firebase project and enable Firestore (and Auth if needed).
- Add your Firebase config to the app (see `src/app/firebase.ts`).
- Firestore rules and indexes are in `firestore.rules` and `firestore.indexes.json`.

**Important scripts**
- `dev` — start the local dev server
- `build` — create production build
- `start` — run production build
- `lint` — run ESLint

**Key files**
- `src/app/books/page.tsx` — Books list (search, sort, pagination)
- `src/app/book/[bookId]/page.tsx` — Book detail (filters, CSV export, running balance)
- `src/app/components/MUIProvider.tsx` — theme + CSS variable sync

**Troubleshooting highlights**
- Use `useEffect` to read `localStorage` to avoid hydration mismatches.
- If Next infers the wrong root due to multiple lockfiles, set `turbopack.root` in `next.config.ts` or remove the extra lockfile.
- A minimal `public/service-worker.js` is included to prevent 404s from stale registrations.
- Bulk deletes handle Firestore's 500-op batch limit by chunking expense deletions.

---
