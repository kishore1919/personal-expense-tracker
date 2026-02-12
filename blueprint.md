        
# Personal Expense Tracker Application

## Overview

A simple, intuitive, and accessible personal expense tracker application that allows users to manage their personal finances across multiple devices. The application features a modern minimalist user interface and is built using Next.js and Firebase.

## Features

*   **Expense Management:**
    *   Users can add, view, edit, and delete their expenses organized in "Cashbooks".
    *   Expenses are stored and synchronized in real-time using Firestore.
*   **Modern Personal Dashboard UI:**
    *   A modern, intuitive dashboard with clean design and clear visual hierarchy.
    *   Global loading states with a clean pulse animation for seamless page transitions.
    *   Responsive design for web and mobile with collapsible sidebar.
    *   An elegant empty state to guide new users.
    *   Skeleton loading states for better perceived performance.
*   **My Books Page:**
    *   A dedicated page to view and manage all expense books.

## Design Enhancements

### Modern Minimalist UI Redesign (v2.0)

*   **Aesthetic:** Implemented a clean, modern minimalist style with subtle shadows and accent colors.
*   **Color Palette:** 
    *   Primary: Indigo (#6366F1) - friendly and trustworthy
    *   Semantic colors for success, error, warning, and info states
    *   WCAG AA compliant text colors
*   **Global Styles:** Updated the global stylesheet (`globals.css`) with:
    *   CSS custom properties for design tokens
    *   Consistent spacing system (8px base)
    *   Subtle shadow system for depth
    *   Smooth transitions and animations
*   **Component Styling:**
    *   **Sidebar:** Redesigned with collapsible dock mode (72px collapsed, 260px expanded)
    *   **Cards:** Clean design with subtle borders and hover effects
    *   **Forms:** Improved input styling with better focus states
    *   **Modals:** Cleaner dialog design with better spacing
*   **Typography:** Refined scale using Manrope (body) and Space Grotesk (headings)
*   **Mobile Experience:**
    *   Bottom navigation with iOS safe area support
    *   Clean pulse loading animation for better feedback
    *   Larger touch targets (min 44px)
    *   Responsive grid layouts

### Previous Enhancements

*   **Card Component:**
    *   Subtle shadow for depth
    *   Hover effect with smooth transitions
    *   Consistent border radius
*   **Sidebar Component:**
    *   Collapsible dock mode for desktop
    *   Dynamic active state highlighting
    *   Tooltips when collapsed
*   **Dark Mode Support:**
    *   Full dark mode color palette
    *   Smooth theme transitions
    *   Persisted preference in localStorage

## Technical Implementation

### Design System

```
Colors:
- Primary: #6366F1 (Indigo)
- Success: #10B981 (Green)
- Error: #EF4444 (Red)
- Warning: #F59E0B (Amber)
- Info: #3B82F6 (Blue)

Spacing (8px base):
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

Border Radius:
- sm: 4px
- md: 8px
- lg: 12px
- full: 9999px

Shadows:
- sm: Subtle lift
- md: Card default
- lg: Elevated elements
- xl: Modals
```

### File Structure

```
src/app/
├── components/
│   ├── AddBookModal.tsx
│   ├── AddExpenseModal.tsx
│   ├── Dashboard.tsx
│   ├── Loading.tsx
│   ├── MUIProvider.tsx
│   └── Sidebar.tsx
├── context/
│   ├── CurrencyContext.tsx
│   ├── SidebarContext.tsx
│   └── ThemeContext.tsx
├── book/[bookId]/
│   └── page.tsx
├── books/
│   └── page.tsx
├── login/
│   └── page.tsx
├── settings/
│   └── page.tsx
├── signup/
│   └── page.tsx
├── firebase.ts
├── globals.css
├── loading.tsx
├── layout.tsx
└── page.tsx
```

## Current Plan

### Phase 6: Polish & Optimization

*   Add toast notifications for user feedback
*   Implement keyboard shortcuts (Ctrl+B for sidebar, Ctrl+N for new)
*   Add data visualization styling for charts
*   Performance optimization
*   Final accessibility audit

## Future Enhancements

*   **Analytics Dashboard:** Charts and graphs for spending trends
*   **Export Features:** CSV/PDF export of expenses
*   **Recurring Expenses:** Automatic recurring entry creation
*   **Budget Goals:** Set and track budget limits per book
*   **Multi-currency Support:** Real-time currency conversion
