
# Personal Expense Tracker Application

## Overview

A simple, intuitive, and accessible personal expense tracker application that allows users to manage their personal finances across multiple devices. The application features a minimal user interface and is built using Next.js and Firebase.

## Features

*   **Expense Management:**
    *   Users can add, view, edit, and delete their expenses organized in "Cashbooks".
    *   Expenses are stored and synchronized in real-time using Firestore.
*   **Modern Personal Dashboard UI:**
    *   A modern, intuitive dashboard inspired by the CashBook design but tailored for personal use.
    *   Clean, simple, and easy to navigate sidebar and header.
    *   Responsive design for web and mobile.
    *   An elegant empty state to guide new users.
    *   Subtle visual polish, such as a noise texture background.
*   **My Books Page:**
    *   A dedicated page to view and manage all expense books.

## Design Enhancements

### "Liquid Glass" UI Redesign

*   **Aesthetic:** Implemented a modern "liquid glass" style, characterized by its transparent, blurred, and glossy aesthetic.
*   **Global Styles:** Updated the global stylesheet (`globals.css`) to include a new `glassmorphic` class and a linear gradient background, creating a frosted glass effect.
*   **Layout:** Applied the glassmorphic effect to the main layout, sidebar, and cards for a cohesive look and feel.
*   **Component Styling:**
    *   **Sidebar:** Updated to use the `glassmorphic` style with adjusted colors for text and icons to ensure legibility against the transparent background.
    *   **Cards:** Re-styled to use the `glassmorphic` class, creating a floating, transparent look.
    *   **Dashboard & Book Detail Page:** Text and element colors were updated for better contrast and legibility on the new background.
    *   **Modals:** `AddBookModal` and `AddExpenseModal` were redesigned to match the liquid glass theme, including a blurred backdrop.
*   **Color Palette:** Shifted to a lighter, more vibrant color palette that complements the transparent UI, with white and light-colored text for readability.

### Previous Enhancements

*   **Card Component:**
    *   Increased shadow for a more pronounced "lifted" effect.
    *   Added a hover effect that subtly increases the shadow.
    *   Slightly reduced the corner rounding for a more modern look.
*   **Sidebar Component:**
    *   Implemented a dynamic active state that highlights the current page.
    *   Redesigned the logo and menu items for a more modern aesthetic.
    *   Enhanced hover and active states with smooth transitions and scaling effects.

## Current Plan

### Phase 5: Final Touches

*   Review and refine the overall design and user experience.
*   Ensure the application is fully responsive and accessible.
*   Deploy the application to Firebase Hosting.
