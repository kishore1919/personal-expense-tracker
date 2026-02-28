# Expense Pilot — Developer README 🚀

A modern expense-tracking application built with Next.js 16, Material UI, Firebase, and TypeScript. This guide covers setup, architecture, and development workflows.

---

## 📋 Table of Contents

- [Quick Overview](#quick-overview-)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started-)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [State Management](#state-management)
- [Firestore Integration](#firestore-integration)
- [Testing](#testing)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting-)

---

## Quick Overview ✨

**Features:**
- Multi-book expense management
- Loan tracking with amortization calculations
- Subscription management
- Budget tracking
- Investment tracking (Fixed Deposits)
- Real-time analytics and charts
- Dark mode with system preference detection
- Responsive design (mobile-first)

**Architecture Highlights:**
- Next.js 16 App Router
- Zustand for global state
- Custom hooks for data fetching
- Service layer for Firestore operations
- TypeScript throughout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + MUI 7 |
| **Language** | TypeScript 5 |
| **State** | Zustand |
| **Backend** | Firebase Firestore |
| **Auth** | Firebase Auth |
| **Styling** | Tailwind 4 + MUI Sx |
| **Charts** | Recharts |
| **Package Manager** | Bun (or npm/pnpm) |

---

## Getting Started 🛠️

### Prerequisites

```bash
# Check versions
node -v  # 18+ recommended
bun -v   # 1.0+ (optional but recommended)
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd expense-pilot

# Install dependencies
bun install

# Copy environment template
cp .env.example .env.local
```

### Firebase Setup

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database**
3. Enable **Authentication** (Email/Password, Google Sign-In)
4. Copy config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
```

5. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
expense-pilot/
├── src/app/
│   ├── (routes)/           # Page routes
│   │   ├── page.tsx        # Dashboard
│   │   ├── books/          # Books management
│   │   ├── book/[bookId]/  # Book detail
│   │   ├── loans/          # Loan tracking
│   │   ├── subscriptions/  # Subscriptions
│   │   ├── budget/         # Budget management
│   │   ├── investments/    # Investments
│   │   ├── analytics/      # Analytics
│   │   ├── settings/       # Settings
│   │   └── login/          # Auth
│   │
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI (atoms)
│   │   ├── books/         # Book-specific components
│   │   ├── Dashboard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useBooks.ts
│   │   ├── useLoans.ts
│   │   ├── useSubscriptions.ts
│   │   ├── useFinancialOverview.ts
│   │   └── useAuth.ts
│   │
│   ├── stores/            # Zustand stores
│   │   ├── useCurrencyStore.ts
│   │   ├── useSidebarStore.ts
│   │   └── useThemeStore.ts
│   │
│   ├── lib/
│   │   └── firestore/     # Service layer
│   │       ├── books.ts
│   │       ├── loans.ts
│   │       └── subscriptions.ts
│   │
│   ├── types/             # TypeScript types
│   ├── firebase.ts        # Firebase init
│   └── layout.tsx         # Root layout
│
├── public/                # Static files
├── firestore.rules        # Security rules
├── firestore.indexes.json # Indexes
└── package.json
```

---

## Architecture

### Data Flow

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │ uses
       ↓
┌─────────────┐
│ Custom Hook │ (useBooks, useLoans, etc.)
└──────┬──────┘
       │ calls
       ↓
┌─────────────┐
│   Service   │ (lib/firestore/)
└──────┬──────┘
       │ queries
       ↓
┌─────────────┐
│  Firestore  │
└─────────────┘
```

### State Management

**Global State (Zustand):**
- Theme (dark/light mode)
- Sidebar (collapsed state)
- Currency (formatting preferences)

**Server State (Custom Hooks):**
- Books, Loans, Subscriptions
- Financial overview
- User authentication

**Local State:**
- Form inputs
- UI toggles
- Temporary filters

### Component Hierarchy

```
layout.tsx
├── ErrorBoundary
│   └── MUIProvider
│       └── ProtectedLayout
│           ├── Sidebar
│           └── Page Component
│               ├── PageHeader
│               ├── Summary Cards
│               ├── Data Table / List
│               └── Pagination
```

---

## Development Workflow

### Adding a New Feature

1. **Create types** (`src/app/types/index.ts`)
```typescript
export interface NewFeature {
  id: string;
  name: string;
  // ...
}
```

2. **Create service layer** (`src/app/lib/firestore/newFeature.ts`)
```typescript
export async function getNewFeatures(userId: string) {
  // Firestore queries
}
```

3. **Create custom hook** (`src/app/hooks/useNewFeature.ts`)
```typescript
export function useNewFeature() {
  // State management + service calls
}
```

4. **Create UI components** (`src/app/components/newFeature/`)
```typescript
export function NewFeatureList() {
  // Component logic
}
```

5. **Create page** (`src/app/newFeature/page.tsx`)
```typescript
export default function NewFeaturePage() {
  // Page composition
}
```

### Code Style

- **TypeScript**: Strict mode, no `any`
- **Components**: Functional with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Files**: Named exports preferred
- **Imports**: Absolute paths with `@/app/`

---

## State Management

### Zustand Stores

**Example: Currency Store**
```typescript
// src/app/stores/useCurrencyStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCurrencyStore = create()(
  persist(
    (set, get) => ({
      currency: 'USD',
      setCurrency: (code) => set({ currency: code }),
      formatCurrency: (amount) => 
        new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: get().currency,
        }).format(amount),
    }),
    { name: 'currency-storage' }
  )
);
```

**Usage in components:**
```typescript
const { formatCurrency } = useCurrencyStore();
const amount = formatCurrency(1234.56);
```

### Custom Hooks Pattern

```typescript
export function useBooks(options = {}) {
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    // Fetch logic
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return { books, loading, refetch: fetchBooks };
}
```

---

## Firestore Integration

### Service Layer Example

```typescript
// src/app/lib/firestore/books.ts
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/firebase';

export async function getBooks(userId: string) {
  const q = query(
    collection(db, 'books'),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

### Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Testing

### E2E Tests (Playwright)

```bash
# Run all tests
bun run test:e2e

# Run with UI
bun run test:e2e:ui

# Run specific browser
bun run test:e2e:chrome
```

**Test file example:**
```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('should create a book', async ({ page }) => {
  await page.goto('/books');
  await page.click('[data-testid="add-book"]');
  // ... assertions
});
```

---

## Performance

### Optimizations Implemented

1. **Parallel Fetching**
   - Independent queries run concurrently with `Promise.all`
   
2. **Memoization**
   - Expensive calculations use `useMemo`
   - Callbacks use `useCallback`

3. **Lazy Loading**
   - Components loaded on demand
   - Routes code-split automatically

4. **Virtual Scrolling Ready**
   - Large lists can use virtualization

5. **Cross-Tab Sync**
   - localStorage events for state sync
   - Firebase real-time listeners

### Bundle Analysis

```bash
# Analyze bundle size
bun run build
# Check .next/static/chunks/
```

---

## Troubleshooting ⚠️

### Hydration Mismatches

**Problem:** Console warnings about attribute mismatches

**Solution:**
```typescript
// ❌ Wrong - reads localStorage during render
const theme = localStorage.getItem('theme');

// ✅ Correct - reads in useEffect
const [theme, setTheme] = useState('light');
useEffect(() => {
  setTheme(localStorage.getItem('theme') || 'light');
}, []);
```

### Service Worker 404

**Problem:** Browser tries to register non-existent service worker

**Solution:**
```javascript
// Run once in browser console
navigator.serviceWorker.getRegistrations()
  .then(rs => rs.forEach(r => r.unregister()));
```

### Firestore Batch Limits

**Problem:** Can't delete more than 500 documents at once

**Solution:** Already handled - bulk operations chunk to 499 ops:
```typescript
for (let i = 0; i < refs.length; i += 499) {
  const batch = writeBatch(db);
  refs.slice(i, i + 499).forEach(ref => batch.delete(ref));
  await batch.commit();
}
```

### TypeScript Errors

**Common issue:** Module not found

**Solution:** Ensure absolute imports use `@/app/`:
```typescript
// ❌ Wrong
import { x } from '../../components/ui';

// ✅ Correct
import { x } from '@/app/components/ui';
```

---

## Contributing 👥

1. Fork the repo
2. Create feature branch: `git checkout -b feature/feature-name`
3. Make changes with clear commits
4. Test thoroughly
5. Push: `git push origin feature/feature-name`
6. Open Pull Request

### Commit Convention

```
feat: add loan amortization calculator
fix: correct balance calculation for past dates
docs: update README with setup instructions
refactor: extract useLoans hook from page component
chore: update dependencies
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [MUI Components](https://mui.com/material-ui/)
- [Zustand Guide](https://zustand-demo.pmnd.rs/)
- [Firebase Docs](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Help & Contact

- 🐛 Report bugs via [Issues](../../issues)
- 💡 Request features via [Issues](../../issues)
- 📖 Check [Wiki](../../wiki) for guides

**Happy coding!** 🎯
