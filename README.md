# Personal Expense Tracker

A modern, full-featured expense tracking application built with Next.js, Material UI, and Firebase. Track your expenses across multiple books, visualize spending patterns, and export data for analysis.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.9-orange?style=flat&logo=firebase)
![MUI](https://img.shields.io/badge/MUI-7.3-blue?style=flat&logo=mui)

## Features

### Core Functionality
- **Multi-Book Management** - Organize expenses into separate books (e.g., Personal, Business, Travel)
- **Expense Tracking** - Add, edit, and delete expenses with detailed information
- **Smart Filtering** - Filter by date range, transaction type, payment mode, and category
- **Search & Sort** - Full-text search with sorting by date, amount, or running balance
- **Running Balance** - Real-time balance calculation as you browse expenses
- **CSV Export** - Export filtered expense data for spreadsheet analysis

### Analytics & Insights
- **Dashboard Overview** - Visual summary of total expenses, book count, and spending trends
- **Analytics Page** - Detailed statistics including average expense and highest transactions
- **Visual Charts** - Spending breakdowns and trend visualizations

### User Experience
- **Dark Mode** - Full dark mode support with persistent preference
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Real-time Updates** - Firebase-powered live data synchronization
- **Bulk Operations** - Efficient batch delete operations (handles 500+ items)
- **Hydration-Safe** - Careful client/server rendering to prevent hydration mismatches

### Authentication & Security
- **User Authentication** - Secure login and signup with Firebase Auth
- **Firestore Security** - Configurable security rules for data protection
- **Category Management** - Customizable expense categories in settings

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** Material UI (MUI) 7 with Emotion styling
- **Backend:** Firebase Firestore (NoSQL database)
- **Authentication:** Firebase Auth
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + CSS Variables for theme sync
- **Icons:** React Icons + MUI Icons

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Firebase project with Firestore enabled

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd personal-expense-tracker
```

2. Install dependencies
```bash
npm install
# or
pnpm install
# or
bun install
```

3. Configure Firebase
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (if using auth features)
   - Add your Firebase configuration to `src/app/firebase.ts`
   - Deploy Firestore rules: `firestore.rules`
   - Deploy indexes: `firestore.indexes.json`

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables (Optional)

Create a `.env.local` file for additional configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   ├── books/page.tsx              # Book management (list, search, pagination)
│   ├── book/[bookId]/page.tsx      # Book detail (expenses, filters, CSV export)
│   ├── analytics/page.tsx          # Analytics dashboard
│   ├── settings/page.tsx           # Settings & category management
│   ├── login/page.tsx              # Authentication login
│   ├── signup/page.tsx             # Authentication signup
│   ├── admin/page.tsx              # Admin panel
│   ├── components/                 # Reusable components
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── AddExpenseModal.tsx     # Add expense dialog
│   │   ├── AddBookModal.tsx        # Add book dialog
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── MUIProvider.tsx         # Theme provider with CSS sync
│   │   └── Loading.tsx             # Loading states
│   ├── context/                    # React contexts
│   │   ├── ThemeContext.tsx        # Dark mode state
│   │   ├── SidebarContext.tsx      # Sidebar collapsed state
│   │   └── CurrencyContext.tsx     # Currency formatting
│   ├── firebase.ts                 # Firebase configuration
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page (Dashboard)
├── public/
│   └── service-worker.js           # Minimal SW to prevent 404s
├── firestore.rules                 # Firestore security rules
└── firestore.indexes.json          # Firestore indexes
```

## Key Features Explained

### Book Management
Books are containers for related expenses. Each book tracks its own running balance and can be searched, sorted, and paginated. Books support bulk deletion with automatic chunking to handle Firestore's 500-operation batch limit.

### Expense Tracking
Expenses support:
- Description and amount
- Transaction type (Income/Expense)
- Payment mode (Cash, Card, Digital Wallet, etc.)
- Category (customizable in settings)
- Date tracking with automatic timestamp

### Running Balance
The running balance is calculated dynamically based on the transaction type and amount, showing the current balance for each book in real-time.

### CSV Export
Export filtered and sorted expense data to CSV format for use in Excel, Google Sheets, or other analytics tools.

## Troubleshooting

### Hydration Mismatches
The app uses `useEffect` for client-only operations like reading `localStorage` and `window.matchMedia`. The root layout includes `suppressHydrationWarning` to reduce noise during development.

### Turbopack Root Warning
If you see root inference warnings, the project already includes `turbopack.root` configuration in `next.config.ts`.

### Service Worker 404
A minimal service worker is included at `public/service-worker.js` to prevent 404 errors from stale registrations. To unregister all service workers:

```javascript
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
```

### Firestore Batch Limits
Bulk operations automatically chunk deletions into batches of 499 operations to stay within Firestore's 500-operation limit.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with clear, focused commits
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request with a detailed description

## License

This project is private and proprietary.

---

Built with Next.js, MUI, and Firebase.
