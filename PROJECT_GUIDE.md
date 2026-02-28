# 📘 Expense Pilot - Project Guide for Humans

A simple, plain-English guide to understanding this project.

---

## 🎯 What Does This App Do?

**Expense Pilot helps you track your money.**

Think of it like a digital checkbook, but smarter. You can:

1. **Create "Books"** - Like separate notebooks for different things
   - Example: "Personal Expenses", "Business Trip", "Home Renovation"

2. **Add Expenses** - Record every rupee/dollar you spend or earn
   - Example: "₹500 on groceries", "₹5000 salary"

3. **Track Loans** - Money you owe or people owe you
   - Example: "Car loan - ₹5 lakhs remaining"

4. **Track Subscriptions** - Netflix, Spotify, gym membership
   - Never forget what you're paying for

5. **Set Budgets** - Decide how much to spend, see if you're over

6. **See Analytics** - Charts showing where your money goes

---

## 🗺️ App Map (All Pages)

```
Expense Pilot
│
├─ 🏠 Dashboard (/)                      ← Home page, see everything at once
│
├─ 📚 My Books (/books)                  ← List of all your books
│   └─ 📖 Book Detail (/book/[id])       ← Inside one book, see expenses
│       └─ 📊 Analytics (/book/[id]/analytics)  ← Charts for this book
│
├─ 💳 Loans (/loans)                     ← Track money borrowed/lent
│
├─ 🔄 Subscriptions (/subscriptions)     ← Track recurring payments
│
├─ 🎯 Budget (/budget)                   ← Set spending limits
│
├─ 📈 Investments (/investments)         ← Track fixed deposits, etc.
│
├─ 📊 Analytics (/analytics)             ← Overall spending charts
│
├─ ⚙️ Settings (/settings)               ← Change currency, theme, categories
│
└─ 🔐 Login (/login)                     ← Sign in
```

---

## 🧩 Main Components (Building Blocks)

### 1. **Sidebar** - The Navigation Menu
- Lives on the left side (desktop) or bottom (mobile)
- Has buttons to go to each page
- Can collapse to save space
- Shows "Logout" button

### 2. **Dashboard** - The Home Page
- Shows summary cards:
  - Total money across all books
  - Total loans remaining
  - Total investments
  - Budget progress
- Quick links to add new things
- List of your recent books

### 3. **Books List** - Your Notebooks
- Shows all your books as cards
- Can search books by name
- Can sort by date or name
- Can archive old books
- Shows balance on each book

### 4. **Book Detail** - Inside a Book
- List of all expenses in that book
- Can add new expense (opens popup)
- Can edit/delete expenses
- Filters: by date, type, category, payment mode
- Shows running balance after each expense
- Can export to CSV (Excel format)

### 5. **Add Expense Modal** - The Popup Form
- Opens when you click "Add Expense"
- Fields:
  - Description (what was it for?)
  - Amount (how much?)
  - Type (income or expense?)
  - Category (food, travel, etc.)
  - Payment mode (cash, card, UPI)
  - Date (when did it happen?)

### 6. **Summary Cards** - The Big Number Boxes
- Used on Dashboard, Loans, Subscriptions pages
- Shows one important number with an icon
- Example: "₹50,000 - Total Principal" with a money icon

### 7. **Tables** - Data Lists
- Shows expenses/loans/subscriptions in rows
- Can sort by clicking column headers
- Has pagination (page 1, 2, 3...)
- Mobile view shows cards instead of table

### 8. **Skeleton Loaders** - The Gray Boxes
- Shows while data is loading
- Looks like gray rectangles
- Prevents page from "jumping" when loading

### 9. **Error Boundary** - The Safety Net
- Catches crashes and shows friendly error
- Prevents entire app from breaking
- Shows "Try Again" button

---

## 🔄 How Data Flows (Simple Version)

```
You click "Add Expense"
        ↓
Form opens (popup)
        ↓
You fill details and click Save
        ↓
Data goes to Firebase (Google's database)
        ↓
App automatically refreshes the list
        ↓
You see your new expense with updated balance
```

---

## 🧠 State Management (How App Remembers Things)

### What is "State"?
State = things the app remembers

### Three Types of Memory:

1. **Zustand Stores** - Long-term memory
   - Your theme preference (dark/light)
   - Your currency (USD, INR, etc.)
   - Sidebar collapsed or not
   - Saved in browser storage

2. **React State** - Short-term memory
   - What's in the search box
   - Which page you're on
   - Is the popup open?
   - Lost when you refresh

3. **Firebase** - Permanent memory
   - All your expenses
   - All your books
   - All your loans
   - Saved forever in cloud

---

## 🎨 How Styling Works

### Two Ways Things Get Styled:

1. **MUI Components** - Pre-made styled components
   ```typescript
   <Button variant="contained">Click Me</Button>
   ```

2. **Tailwind Classes** - Utility classes
   ```typescript
   <div className="flex gap-2 p-4">...</div>
   ```

3. **Sx Prop** - Custom styles inline
   ```typescript
   <Box sx={{ color: 'red', fontSize: 20 }}>Text</Box>
   ```

---

## 📁 File Organization (Where Things Live)

```
expense-pilot/
│
├── src/app/                    ← All your code lives here
│   │
│   ├── page.tsx               ← Homepage (Dashboard)
│   ├── layout.tsx             ← Wraps all pages (adds sidebar)
│   │
│   ├── books/
│   │   └── page.tsx           ← Books list page
│   │
│   ├── book/[bookId]/
│   │   └── page.tsx           ← Book detail page
│   │
│   ├── loans/
│   │   └── page.tsx           ← Loans page
│   │
│   ├── subscriptions/
│   │   └── page.tsx           ← Subscriptions page
│   │
│   ├── components/            ← Reusable pieces
│   │   ├── Sidebar.tsx        ← The navigation menu
│   │   ├── Dashboard.tsx      ← Home page content
│   │   ├── AddExpenseModal.tsx ← Popup form
│   │   └── ui/                ← Small reusable pieces
│   │
│   ├── hooks/                 ← Smart functions
│   │   ├── useBooks.ts        ← How to get books
│   │   ├── useLoans.ts        ← How to get loans
│   │   └── ...
│   │
│   ├── stores/                ← Memory (Zustand)
│   │   ├── useThemeStore.ts   ← Remembers dark/light
│   │   └── useCurrencyStore.ts← Remembers currency
│   │
│   └── firebase.ts            ← Connection to database
│
└── public/                     ← Images, icons, etc.
```

---

## 🔧 Common Tasks (How To...)

### Add a New Page
1. Create folder: `src/app/your-page/`
2. Add file: `page.tsx`
3. Write component
4. Add link to Sidebar

### Add a New Component
1. Create file: `src/app/components/YourComponent.tsx`
2. Write your React component
3. Import where needed

### Add a New Feature to Books
1. Add field to type: `src/app/types/index.ts`
2. Update Firestore service: `src/app/lib/firestore/books.ts`
3. Update hook: `src/app/hooks/useBooks.ts`
4. Update UI component

---

## 🐛 Debugging Tips

### Problem: Balance not updating
**Check:** Did you add expense with past date?
**Fix:** App now auto-refreshes when you add/edit/delete

### Problem: Page shows old data
**Check:** Is Firebase connected?
**Fix:** Refresh page or check internet

### Problem: Dark mode not working
**Check:** Settings page → toggle dark mode
**Fix:** Clear browser cache

### Problem: Can't login
**Check:** Firebase config in `.env.local`
**Fix:** Make sure API keys are correct

---

## 🚀 How to Run

```bash
# 1. Install dependencies (first time only)
bun install

# 2. Start development server
bun run dev

# 3. Open browser
# Go to: http://localhost:3000
```

---

## 💡 Key Concepts Explained Simply

### What is a "Book"?
A **Book** is like a physical notebook. You can have:
- One book for "Personal"
- One book for "Business"
- One book for "Trip to Japan"

Each book has its own expenses and balance.

### What is "Balance"?
**Balance** = Money In - Money Out

If you earned ₹10,000 and spent ₹7,000:
- Balance = ₹3,000

### What is "Net Worth"?
**Net Worth** = All Your Money - All Your Debts

Example:
- Books balance: ₹50,000
- Investments: ₹1,00,000
- Loans remaining: ₹2,00,000
- **Net Worth** = ₹50,000 + ₹1,00,000 - ₹2,00,000 = **-₹50,000** (in debt)

### What is "Real-time"?
**Real-time** = Changes appear instantly

When you add expense on your phone, it shows on your laptop too (if both open).

---

## 📞 Need Help?

1. **Check this file first** - It has common answers
2. **Check README.md** - More detailed docs
3. **Check README.dev.md** - For developers
4. **Ask in issues** - GitHub issues page

---

**Remember:** This app is just a fancy database with a pretty interface. You add data, it shows data. That's it! 🎉
