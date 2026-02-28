# Expense Pilot 📊

A modern, intelligent personal expense tracking application built with Next.js 16, Material UI, and Firebase. Organize expenses across multiple books, track loans and subscriptions, manage budgets, and gain insights into your financial health.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.9-orange?style=flat&logo=firebase)
![MUI](https://img.shields.io/badge/MUI-7.3-blue?style=flat&logo=mui)

## ✨ Features

### 📚 Multi-Book Expense Management
- **Unlimited Books** - Create separate books for different purposes (Personal, Business, Travel, Projects)
- **Smart Organization** - Categorize expenses with custom categories
- **Advanced Filtering** - Filter by date range, type, payment mode, category
- **Real-time Search** - Full-text search across descriptions and amounts
- **Running Balance** - Track balance after each transaction
- **CSV Export** - Export filtered data for spreadsheet analysis

### 💰 Financial Dashboard
- **Net Worth Overview** - See total assets, liabilities, and investments at a glance
- **Budget Tracking** - Monitor spending against monthly/weekly/yearly budgets
- **Expense Analytics** - Visual charts showing spending patterns and trends
- **Quick Actions** - Fast access to add expenses, loans, and investments

### 💳 Loan Management
- **Track Multiple Loans** - Monitor personal and institutional loans
- **Amortization Calculator** - Automatic calculation of remaining interest and payoff timeline
- **Payment Tracking** - Record payments and track progress
- **Interest Calculations** - Accurate monthly interest and EMI calculations

### 🔄 Subscription Tracker
- **Recurring Expenses** - Track all your subscriptions (Netflix, Spotify, utilities)
- **Billing Cycle Support** - Weekly, monthly, and yearly billing
- **Next Payment Date** - Never miss a payment with automatic date calculations
- **Cost Estimates** - See monthly and yearly subscription costs

### 📈 Investment Tracking
- **Fixed Deposits** - Track FD principal, interest rates, and maturity dates
- **Multiple Asset Types** - Support for stocks, mutual funds (expandable)
- **Investment Overview** - Total investment value at a glance

### 🎨 User Experience
- **Dark Mode** - Full dark mode support with system preference detection
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Real-time Sync** - Firebase-powered live data updates across tabs
- **Smart Pagination** - Efficient handling of large datasets
- **Collapsible Sidebar** - Maximize screen space when needed
- **Mobile Navigation** - Bottom nav bar for easy mobile access

### 🔒 Security & Performance
- **Firebase Auth** - Secure authentication with Google Sign-In support
- **Firestore Security Rules** - User-level data isolation
- **Optimized Queries** - Parallel fetching to minimize load times
- **Zustand State Management** - Fast, lightweight global state
- **TypeScript** - Full type safety throughout the application

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19.2 + Material UI 7 |
| **Language** | TypeScript 5 |
| **Backend** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS 4 + MUI Sx Prop |
| **Charts** | Recharts |
| **Icons** | React Icons + MUI Icons |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- A Firebase project with Firestore enabled
- Git (for cloning)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd expense-pilot
```

2. **Install dependencies**
```bash
bun install
# or
npm install
# or
pnpm install
```

3. **Set up Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Firestore Database**
   - Enable **Authentication** (Email/Password and/or Google Sign-In)
   - Copy your Firebase config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
```

4. **Deploy Firestore rules and indexes**
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

5. **Start development server**
```bash
bun run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** 🎉

## 📖 Usage Guide

### Creating Your First Book
1. Click **"New Book"** from the Dashboard
2. Enter a name (e.g., "Personal Expenses", "Business 2024")
3. Start adding expenses with categories and amounts

### Adding Expenses
1. Navigate to a book
2. Click **"+ Add Expense"**
3. Fill in details:
   - **Description**: What was the expense for?
   - **Amount**: Enter value (supports expressions like `100+50`)
   - **Type**: Income or Expense
   - **Category**: Select or create custom category
   - **Payment Mode**: Cash, Card, Digital Wallet, etc.
   - **Date**: Can be backdated for historical entries
4. Click **Save**

### Managing Loans
1. Go to **Loans** from sidebar
2. Click **"Add Loan"**
3. Enter loan details:
   - Lender name and loan purpose
   - Principal amount and paid amount
   - Interest rate (%) and monthly EMI
4. View automatic calculations for:
   - Remaining balance
   - Interest remaining
   - Months to payoff
   - Total due amount

### Tracking Subscriptions
1. Go to **Subscriptions** from sidebar
2. Click **"Add Subscription"**
3. Enter subscription details:
   - Name, amount, billing cycle
   - Category and start date
   - Status (active/paused/cancelled)
4. View monthly and yearly cost estimates

### Setting Budgets
1. Go to **Budget** from sidebar
2. Select a book or category
3. Set budget amount and period (weekly/monthly/yearly)
4. Monitor spending progress in real-time

## 📁 Project Structure

```
expense-pilot/
├── src/app/
│   ├── (routes)/
│   │   ├── page.tsx              # Dashboard - Financial overview
│   │   ├── books/
│   │   │   ├── page.tsx          # Books list with search & pagination
│   │   │   └── archived/page.tsx # Archived books
│   │   ├── book/[bookId]/
│   │   │   ├── page.tsx          # Book detail - Expenses list
│   │   │   └── analytics/page.tsx # Book-specific analytics
│   │   ├── loans/page.tsx        # Loan management
│   │   ├── subscriptions/page.tsx # Subscription tracker
│   │   ├── budget/page.tsx       # Budget management
│   │   ├── investments/
│   │   │   ├── page.tsx          # Investments overview
│   │   │   └── fd/page.tsx       # Fixed deposits
│   │   ├── analytics/page.tsx    # Global analytics
│   │   ├── settings/page.tsx     # Settings & categories
│   │   └── login/page.tsx        # Authentication
│   │
│   ├── components/               # Shared components
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── TableSkeleton.tsx
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorState.tsx
│   │   ├── books/                # Book-specific components
│   │   ├── Dashboard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── AddExpenseModal.tsx
│   │   ├── MUIProvider.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useBooks.ts
│   │   ├── useLoans.ts
│   │   ├── useSubscriptions.ts
│   │   ├── useFinancialOverview.ts
│   │   └── useAuth.ts
│   │
│   ├── stores/                   # Zustand state stores
│   │   ├── useCurrencyStore.ts
│   │   ├── useSidebarStore.ts
│   │   └── useThemeStore.ts
│   │
│   ├── lib/
│   │   └── firestore/            # Firestore service layer
│   │       ├── books.ts
│   │       ├── loans.ts
│   │       └── subscriptions.ts
│   │
│   ├── types/                    # TypeScript types
│   ├── firebase.ts               # Firebase configuration
│   └── layout.tsx                # Root layout
│
├── public/                       # Static assets
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Database indexes
├── firebase.json                 # Firebase config
└── package.json
```

## 🎯 Key Architecture Decisions

### State Management
- **Zustand** for global state (theme, sidebar, currency)
- **React Query patterns** for server state (custom hooks with caching)
- **LocalStorage** for user preferences persistence

### Data Flow
```
Component → Custom Hook → Service Layer → Firestore
     ↓
  Zustand Store (UI state)
     ↓
  Component (render)
```

### Performance Optimizations
- **Parallel fetching** for independent data sources
- **Memoized calculations** for expensive operations
- **Virtual scrolling** ready for large lists
- **Debounced search** to reduce queries
- **Optimistic updates** for better UX

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server (Turbopack) |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run test:e2e` | Run E2E tests with Playwright |
| `bun run test:ci` | Run tests in CI environment |

## 🐛 Troubleshooting

### Hydration Mismatches
The app uses `useEffect` for client-only operations. Root layout includes `suppressHydrationWarning` to reduce noise.

### Service Worker 404
A minimal service worker prevents 404 errors. To clear stale registrations:
```javascript
navigator.serviceWorker.getRegistrations()
  .then(rs => rs.forEach(r => r.unregister()));
```

### Firestore Batch Limits
Bulk operations auto-chunk to 499 operations to stay within Firestore's 500-operation limit.

### Cross-Tab Sync
Data syncs across tabs automatically via Firebase real-time listeners + localStorage events.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Keep components small and focused

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Material UI](https://mui.com/) - Component library
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Recharts](https://recharts.org/) - Chart library

---

**Built with ❤️ using Next.js, MUI, and Firebase**

[Report Bug](../../issues) · [Request Feature](../../issues) · [Documentation](../../wiki)
