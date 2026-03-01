# Expense Pilot - Next.js Refactoring Plan

**Objective:** Modernize the codebase to follow Next.js App Router best practices, improve maintainability, and enhance performance.

**Target:** `src/app/` directory and related components

---

## 📊 Current State Analysis

### Framework & Stack
- Next.js 16.0.8 (App Router)
- React 19.2.1
- TypeScript 5 (strict mode)
- Material-UI v7
- Firebase (Firestore, Auth)
- Zustand for state management
- Tailwind CSS v4

### Major Issues Identified
1. **Monolithic Components:** Files exceeding 500+ lines
   - `BookDetailPageClient.tsx`: 1,011 lines
   - `loans/page.tsx`: 724 lines
   - `AddExpenseModal.tsx`: 883 lines
   - `Sidebar.tsx`: 522 lines

2. **Unnecessary Server Component Wrappers:** Most `page.tsx` files are 5-line boilerplate that just re-export Client Components

3. **Large Custom Hooks:**
   - `useLoans.ts`: 405 lines
   - `useSubscriptions.ts`: 354 lines
   - `useBooksWithPagination.ts`: 398 lines

4. **No Server-Side Data Fetching:** All data fetched client-side, missing SSR benefits

5. **Anti-patterns:**
   - Window events for cross-component communication
   - Inconsistent hook organization
   - Single type definitions file (189 lines)

---

## 🎯 Refactoring Phases

### **Phase 1: Component Architecture Restructure** (High Priority)

**1.1 Remove Unnecessary Server Component Wrappers**
- Directly export Client Components from routes when no server data fetching occurs
- Delete boilerplate `page.tsx` files that just re-export
- **Impact:** Cleaner structure, fewer files, better DX

**Before:**
```tsx
// books/page.tsx
import BooksPageClient from './BooksPageClient';
export default function BooksPage() {
  return <BooksPageClient />;
}
```

**After:**
```tsx
// books/page.tsx
'use client';
export { default } from './BooksPageClient';
```

**1.2 Extract Monolithic Components**

| File | Current Lines | Target Components |
|------|--------------|-------------------|
| `BookDetailPageClient.tsx` | 1,011 | - `BookHeader`<br>- `ExpenseTable`<br>- `FilterBar`<br>- `StatsPanel`<br>- `ActionButtons`<br>- `ArchiveDialog` |
| `loans/page.tsx` | 724 | - `LoanSummary`<br>- `LoanCard`<br>- `LoanForm`<br>- `LoanTable`<br>- `LoanStats` |
| `AddExpenseModal.tsx` | 883 | - `AmountCalculator`<br>- `CategoryPicker`<br>- `PaymentModeSelector`<br>- `DatePicker`<br>- `BalancePreview` |
| `Sidebar.tsx` | 522 | - `NavItem`<br>- `UserProfile`<br>- `MobileMenuToggle`<br>- `ThemeSwitcher` |

**1.3 Add Suspense Boundaries**
- Wrap async data sections with `<Suspense fallback={...}>`
- Create granular `loading.tsx` files per route segment
- Replace full-page loading with skeleton components

---

### **Phase 2: Server Components & Data Fetching** (High Priority)

**2.1 Implement Server-Side Rendering**

Convert pages to use Server Components for data fetching:

```typescript
// Before (client-side only):
'use client';
const { books } = useBooks();

// After (server-side):
export default async function BooksPage() {
  const books = await getBooks(); // Direct Firestore access in Server Component
  return <BooksList books={books} />;
}
```

**Required Setup:**
- Create `lib/firestore.server.ts` with server-side Firestore helpers
- Use `server-only` import to prevent accidental client usage

**2.2 Create Server Actions**

New directory structure:
```
src/app/
├── actions/
│   ├── books.ts
│   ├── expenses.ts
│   ├── loans.ts
│   ├── subscriptions.ts
│   └── index.ts (barrel export)
```

Example Server Action:
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/app/firebase';

export async function createBook(name: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');

  const docRef = await addDoc(collection(db, 'books'), {
    name,
    userId: user.uid,
    createdAt: new Date(),
  });

  revalidatePath('/books');
  revalidatePath('/');
  return docRef.id;
}
```

**Benefits:**
- Progressive enhancement (forms work without JS)
- Automatic CSRF protection
- Reduced client bundle size
- Built-in error handling with `useFormStatus`

**2.3 Update Hooks to Use Server Actions**
Replace Firestore SDK calls in client hooks with Server Action invocations

---

### **Phase 3: Hook Refactoring** (Medium Priority)

**3.1 Split Large Hooks**

| Hook | Current | New Structure |
|------|---------|---------------|
| `useLoans.ts` | 405 lines | `useLoansData.ts` (data fetching)<br>`useLoanForm.ts` (form state)<br>`useLoanCalculations.ts` (loan math) |
| `useSubscriptions.ts` | 354 lines | `useSubscriptionsData.ts`<br>`useSubscriptionForm.ts` |
| `useBooksWithPagination.ts` | 398 lines | `useBooks.ts` (basic CRUD)<br>`usePagination.ts` (pagination logic)<br>`useBookFilters.ts` (filter/sort) |

**3.2 Standardize Hook Organization**

Choose one pattern:

**Option A (Recommended - Colocated):**
```
app/
├── books/
│   ├── hooks/
│   │   ├── useBooks.ts
│   │   ├── useBookFilters.ts
│   │   └── index.ts
├── loans/
│   ├── hooks/
│   │   ├── useLoansData.ts
│   │   ├── useLoanForm.ts
│   │   └── index.ts
└── shared/ (only truly shared hooks)
```

**Option B (Centralized):**
```
app/
├── hooks/
│   ├── books/
│   │   ├── useBooks.ts
│   │   └── useBookFilters.ts
│   ├── loans/
│   │   ├── useLoansData.ts
│   │   └── useLoanForm.ts
│   └── index.ts
```

**3.3 Replace Window Events**
- Replace `window.addEventListener('expenses-updated')` with Zustand store triggers
- Or use React Context for component tree communication

---

### **Phase 4: Type Organization** (Medium Priority)

**Split `types/index.ts` by Domain**

```
src/app/types/
├── index.ts          # Public re-exports only
├── book.ts           # Book, BookWithExpenses
├── expense.ts        # Expense, ExpensePayload
├── loan.ts           # Loan, LoanFormData, LoanDetails
├── subscription.ts   # Subscription, SubscriptionFormData
├── user.ts           # User (Firebase)
├── investment.ts     # FixedDeposit, etc.
├── budget.ts         # Budget
├── common.ts         # SortOption, PageSize, PaginationState
└── ui.ts             # Component props (ButtonProps, etc.)
```

---

### **Phase 5: State Management** (Medium Priority)

**5.1 Zustand Store Review**
- Audit stores in `app/stores/`
- Ensure server state (from Firestore) is separate from UI state
- Consider if React Query would simplify things

**5.2 Optional: Evaluate TanStack Query**
If state management becomes too complex:
- Automatic caching
- Background refetching
- Optimistic updates
- Reduced custom hook complexity

---

### **Phase 6: File Structure Reorganization** (Low Priority)

**Consider Feature-Based Structure (Optional)**

```
src/app/
├── (dashboard)/          # Route group with shared layout
│   ├── layout.tsx        # Sidebar + header wrapper
│   ├── page.tsx          # Dashboard
│   ├── books/
│   │   ├── page.tsx      # Server Component
│   │   ├── components/
│   │   │   ├── BooksList.tsx
│   │   │   ├── BookCard.tsx
│   │   │   └── BookFilters.tsx
│   │   ├── hooks/
│   │   │   └── useBooks.ts
│   │   └── actions/
│   │       └── books.ts
│   ├── loans/
│   ├── subscriptions/
│   └── ...
├── login/
│   ├── page.tsx
│   └── components/
├── (public)/             # Optional route group
├── components/           # Truly shared components only
│   ├── ui/
│   ├── forms/
│   └── layouts/
├── hooks/               # Truly shared hooks only
├── lib/
│   ├── firestore/       # Client-side helpers
│   ├── firestore.server/ # Server-side helpers
│   ├── utils/
│   └── validators/
├── actions/             # All Server Actions
└── types/

---

### **Phase 7: Performance Optimizations** (Low Priority)

**7.1 Use Streaming for Slow Data**
```typescript
// Wrap slow sections with Suspense
export default function BookPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <BookStats bookId={bookId} />
    </Suspense>
    <Suspense fallback={<ExpensesSkeleton />}>
      <ExpenseTable bookId={bookId} />
    </Suspense>
  );
}
```

**7.2 Parallel Routes for Related Content**
```
app/book/[bookId]/
├── page.tsx             # Main content
├── @analytics/page.tsx  # Loads in parallel
└── @details/page.tsx    # Loads in parallel
```

**7.3 Image Optimization**
- Audit `next/image` usage
- Add proper `sizes` and `priority` attributes
- Convert inline SVGs to `next/image` or `@svgr/webpack`

---

## 📋 Implementation Order

### **Sprint 1: Quick Wins (Week 1)**
1. Remove unnecessary `page.tsx` wrappers (no functionality change)
2. Extract `BookDetailPageClient.tsx` into 5-6 smaller components
3. Add Suspense boundaries to Books page
4. Create first Server Action (`createBook`) as proof-of-concept

**Expected Impact:** ~30% reduction in largest file, immediate DX improvement

### **Sprint 2: Data Fetching Modernization (Week 2)**
1. Create `lib/firestore.server.ts`
2. Convert Books page to use Server Components
3. Implement all Book CRUD Server Actions
4. Update hooks to use Server Actions
5. Add `loading.tsx` files for each route

**Expected Impact:** Faster initial page loads, better SEO, JS bundle reduction

### **Sprint 3: Hook & Type Refactoring (Week 3)**
1. Split `useLoans.ts` into 3 focused hooks
2. Split `useSubscriptions.ts` similarly
3. Split `types/index.ts` by domain
4. Update all imports

**Expected Impact:** More maintainable, testable code

### **Sprint 4: Advanced Patterns (Week 4)**
1. Refactor `loans/page.tsx` (724 lines)
2. Refactor `AddExpenseModal.tsx` (883 lines)
3. Replace window events with Zustand
4. Add parallel routes if beneficial
5. Performance audit and optimization

**Expected Impact:** Resolve all monolithic components, improved performance

---

## 🛠️ Technical Checklist

### Server Components
- [ ] Identify all pages that can be Server Components (no `useState`, `useEffect`, event handlers)
- [ ] Move Firestore queries to Server Components
- [ ] Create `lib/firestore.server.ts` with server-optimized queries
- [ ] Add `'use server'` to Server Actions
- [ ] Update client components to accept props instead of fetching

### Component Extraction
- [ ] `BookDetailPageClient.tsx` → 6 components
- [ ] `loans/page.tsx` → 5 components
- [ ] `AddExpenseModal.tsx` → 5 components
- [ ] `Sidebar.tsx` → 4 components
- [ ] Extract reusable UI to `components/ui/`

### File Organization
- [ ] Remove redundant `page.tsx` wrappers
- [ ] Create `actions/` directory
- [ ] Reorganize `types/` by domain
- [ ] Decide on hook organization pattern (colocated vs centralized)
- [ ] Apply pattern consistently across features

### Error & Loading States
- [ ] Add `loading.tsx` to all routes
- [ ] Add `error.tsx` for route-level error boundaries
- [ ] Replace inline loading spinners with Suspense boundaries
- [ ] Create skeleton components for common patterns

### Testing
- [ ] Verify all Server Actions work
- [ ] Test client-side navigation
- [ ] Check Firebase auth flows
- [ ] Test offline mode (if applicable)
- [ ] Run existing Playwright tests
- [ ] Update any broken imports post-refactor

---

## 🔍 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Largest file size | 1,011 lines | < 400 lines |
| Files > 500 lines | 4 files | 0 files |
| JS bundle size | ? KB | -15% reduction |
| Time to Interactive | ? ms | -20% improvement |
| Lighthouse score | ? | >90 performance |
| Test coverage | ?% | Maintain >80% |

---

## 📚 References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-and-client-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Suspense for Data Fetching](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Best Practices](https://react.dev/learn)
- [Next.js TypeScript](https://nextjs.org/docs/pages/building-your-application/typedefs)

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking Firebase auth flows | High | Test all auth routes thoroughly; use feature flags |
| Server Actions CORS issues | Medium | Verify Firebase Admin SDK setup |
| Bundle size increase | Low | Monitor with `@next/bundle-analyzer` |
| SEO regression | Low | Use Lighthouse before/after |
| Test failures | Medium | Run Playwright suite after each sprint |

---

## 🎓 Migration Guide (For Developers)

### Before You Start
1. Create a new branch: `git checkout -b refactor/nextjs-best-practices`
2. Install bundle analyzer: `npm install -D @next/bundle-analyzer`
3. Read this entire document

### Daily Workflow
1. Pick one task from this plan
2. Make small, incremental changes
3. Test after each change
4. Commit with descriptive messages
5. Update this document if plan changes

### Common Patterns

**Convert Client Page to Server Component:**
```diff
- 'use client';
- import { useState } from 'react';
- import { useBooks } from '../hooks/useBooks';
-
- export default function BooksPage() {
-   const { books } = useBooks();
-   return <BooksList books={books} />;
- }

+ import { getBooks } from '@/app/lib/firestore/server';
+
+ export default async function BooksPage() {
+   const books = await getBooks();
+   return <BooksList books={books} />;
+ }
```

**Extract Component:**
1. Create new file in `components/` or `components/books/`
2. Move related JSX and state to new component
3. Pass props instead of accessing hook directly
4. Update parent component to use extracted component
5. Delete old code from parent

**Add Server Action:**
1. Create or update file in `app/actions/`
2. Add `'use server'` directive
3. Export async function
4. Call from client with `'use client'` wrapper
5. Use `useFormStatus` for progressive enhancement

---

## 🎯 Simplified Implementation Guide

**Keep it simple:** No complex TypeScript, straightforward patterns, copy-paste code.

### **Core Principles**
✅ Simple TypeScript (basic interfaces only)
✅ Regular functions, no advanced patterns
✅ Copy-paste friendly examples
✅ Minimal abstractions

---

## **Phase 1: Split Big Files** (Do First)

**Problem:** Some files are huge and hard to work with.

**Targets:**
| File | Size | Split Into |
|------|------|------------|
| `BookDetailPageClient.tsx` | 1,011 lines | `Header.tsx`, `ExpenseTable.tsx`, `FilterBar.tsx` |
| `loans/page.tsx` | 724 lines | `LoanList.tsx`, `LoanForm.tsx`, `LoanStats.tsx` |
| `AddExpenseModal.tsx` | 883 lines | `AmountInput.tsx`, `CategorySelect.tsx` |

**How To:**
1. Create new component file
2. Cut related JSX from big file → paste into new file
3. Pass data via props (no complex types, just basic ones)
4. Import and use new component in parent
5. Repeat until file is < 300 lines

**Example:**
```tsx
// New: components/ExpenseTable.tsx
interface ExpenseTableProps {
  expenses: any[]; // Keep it simple, can refine later
  formatCurrency: (amount: number) => string;
}

export function ExpenseTable({ expenses, formatCurrency }) {
  return (
    <table>
      {expenses.map(exp => (
        <tr key={exp.id}>
          <td>{exp.description}</td>
          <td>{formatCurrency(exp.amount)}</td>
        </tr>
      ))}
    </table>
  );
}

// In BookDetailPageClient.tsx - replace the table section with:
import { ExpenseTable } from './components/ExpenseTable';
<ExpenseTable expenses={filteredExpenses} formatCurrency={formatCurrency} />
```

---

## **Phase 2: Add Server Actions** (Big Improvement, Little Work)

**What:** Move data writing (create, update, delete) to server.

**Step 1:** Create `src/app/actions/books.ts`
```typescript
'use server';

import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/app/firebase';
import { revalidatePath } from 'next/cache';

export async function createBook(formData: FormData) {
  const name = formData.get('name') as string;
  const user = auth.currentUser;
  
  if (!user) throw new Error('Not logged in');
  
  await addDoc(collection(db, 'books'), {
    name,
    userId: user.uid,
    createdAt: new Date(),
  });
  
  revalidatePath('/books');
  revalidatePath('/');
}

export async function deleteBook(id: string) {
  await deleteDoc(doc(db, 'books', id));
  revalidatePath('/books');
}
```

**Step 2:** Use in component (forms work without JavaScript!)
```tsx
// Old way: Complex hook + event handler
const handleSubmit = async () => {
  await addBook(name);
  router.refresh();
};

// New way: Simple form
<form action={createBook}>
  <input name="name" />
  <button type="submit">Add Book</button>
</form>

// For delete:
<button formAction={() => deleteBook(bookId)}>Delete</button>
```

**Benefits:**
- ✅ Forms work without JavaScript
- ✅ Automatic security (CSRF protection)
- ✅ Page refreshes automatically
- ✅ Less code, easier to understand

---

## **Phase 3: Clean Up** (Easy Stuff)

**3.1 Delete Wrapper Files**
```bash
# These are just 5-line files that re-export:
rm src/app/books/page.tsx
rm src/app/book/[bookId]/page.tsx
# etc. - delete any page.tsx that just returns <ClientComponent />
```

**3.2 Remove `import React`**
Not needed in React 19. Search and remove:
```bash
grep -l "import React from 'react'" src/app/**/*.tsx | xargs sed -i '/import React from/d'
```

**3.3 Split types**
Move from one big `types/index.ts` to:
```
types/
  book.ts
  expense.ts
  loan.ts
  subscription.ts
```

Just copy each interface to its own file and export.

---

## **Phase 4: Organize By Feature** (Optional but Nice)

**Current:** Mixed folders
**Better:** Group related files together

```
src/app/
├── books/
│   ├── page.tsx          # Uses server actions for data
│   ├── BookList.tsx      # UI components
│   ├── BookCard.tsx
│   ├── actions.ts        # Book-specific server actions
│   └── components/       # Book-specific components
├── loans/
│   ├── page.tsx
│   ├── LoanList.tsx
│   ├── LoanForm.tsx
│   └── actions.ts
├── subscriptions/
└── components/           # Shared stuff only
    ├── Button.tsx
    ├── Card.tsx
    └── Modal.tsx
```

---

## **What NOT To Do** (Keep It Simple)

❌ Don't create complex generic types
❌ Don't use advanced TypeScript patterns (mapped types, conditional types)
❌ Don't build fancy abstractions
❌ Don't over-engineer
❌ Don't create utility libraries you don't need

✅ Do:
- Use `any` temporarily if needed (fix later)
- Keep functions short and clear
- Copy-paste similar code (DRY is not #1 priority)
- Comment complex logic simply
- Test after each change

---

## **Step-by-Step Migration**

### **Week 1: Component Splitting**
1. Start with `BookDetailPageClient.tsx`
2. Extract 1 component at a time
3. Test after each extraction
4. Aim: Reduce to ~300 lines

### **Week 2: Server Actions**
1. Pick Books feature
2. Create `actions/books.ts` with create, update, delete
3. Update one form to use actions
4. Test that it works with and without JavaScript
5. Finish all Books actions

### **Week 3: More Splitting**
1. Split `loans/page.tsx`
2. Split `AddExpenseModal.tsx`
3. Clean up types

### **Week 4: Polish**
1. Delete all wrapper `page.tsx` files
2. Remove unused imports
3. Test everything
4. Fix any broken stuff

---

## **Quick Reference: Common Changes**

**Before (Client-side fetch):**
```tsx
'use client';
import { useBooks } from '../hooks/useBooks';

export default function BooksPage() {
  const { books, loading, addBook } = useBooks();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {books.map(b => <div key={b.id}>{b.name}</div>)}
      <button onClick={() => addBook('New Book')}>Add</button>
    </div>
  );
}
```

**After (Server Component + Actions):**
```tsx
// page.tsx - Server Component
import { getBooks } from '@/app/lib/firestore.server';
import { createBook } from './actions';

export default async function BooksPage({ searchParams }) {
  const books = await getBooks();
  
  return (
    <div>
      {books.map(b => <div key={b.id}>{b.name}</div>)}
      <form action={createBook}>
        <input name="name" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

---

## **Troubleshooting**

**"Server Actions can't use Firebase client SDK"**
- Fix: Install Firebase Admin SDK for server-side, or keep auth check simple
- Actually for Vercel/Node, Firebase client SDK works in Server Actions too

**"Component still renders as Client"**
- Check for `'use client'` at top
- Check for `useState`, `useEffect` - those force client
- If you need interactivity, keep it client. That's okay!

**"Types are breaking"**
- Temporarily use `any` to unblock
- Fix types in cleanup phase later
- Don't spend hours on complex types

**"Forms not working without JS"**
- Ensure form has `action` prop, not `onSubmit`
- Use regular `<button type="submit">`
- Server Action must have `'use server'`

---

**Remember:** Done is better than perfect. Get it working, then improve.

**Last Updated:** 2026-03-01
**Status:** Simplified Version - Ready to Execute
