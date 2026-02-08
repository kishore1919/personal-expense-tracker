# Personal Expense Tracker Application

## Overview

A simple, intuitive, and accessible personal expense tracker application that allows users to manage their personal finances across multiple devices. The application features a minimal user interface and is built using Next.js and Firebase.

## Features

*   **User Authentication:**
    *   Users can sign up and log in to the application.
    *   Authentication is handled by Firebase Authentication, ensuring data security and cross-device access.
*   **Expense Management:**
    *   Authenticated users can add, view, edit, and delete their expenses organized in "Cashbooks".
    *   Expenses are stored and synchronized in real-time using Firestore.
*   **Modern Personal Dashboard UI:**
    *   A modern, intuitive dashboard inspired by the CashBook design but tailored for personal use.
    *   Clean, simple, and easy to navigate sidebar and header.
    *   Responsive design for web and mobile.

## Current Plan

### Phase 3: Transition to Personal Expense Tracker

1.  **Update UI for Personal Context:**
    *   Modify `Sidebar.tsx` to focus on personal finance.
    *   Update `Header.tsx` to remove "Business" references.
    *   Update `Dashboard.tsx` for personal expense categories and titles.
2.  **Integrate Firebase functionality with UI:**
    *   Replace hardcoded data with real data from Firestore.
    *   Implement "Add New Book" functionality for personal cashbooks.
    *   Implement expense listing within a selected cashbook.
