/**
 * Shared CSS selectors and data-testid attributes for E2E tests
 * 
 * Centralizes all selectors to make tests more maintainable.
 * If UI changes, update selectors here instead of in every test.
 */

export const Selectors = {
  // Login Page
  login: {
    googleSignInButton: 'button:has-text("Continue with Google")',
    errorAlert: '[role="alert"]',
    appTitle: 'text=Expense Pilot',
    appSubtitle: 'text=Sign in to manage your expenses.',
  },
  
  // Common UI Elements
  common: {
    loadingSpinner: '[role="progressbar"]',
    errorMessage: '.MuiAlert-root',
    successMessage: '.MuiAlert-standardSuccess',
    modalOverlay: '.MuiModal-root',
    dialogTitle: '.MuiDialogTitle-root',
    confirmButton: 'button:has-text("Confirm")',
    cancelButton: 'button:has-text("Cancel")',
    deleteButton: 'button:has-text("Delete")',
    closeButton: 'button[aria-label="close"]',
    submitButton: 'button[type="submit"]',
  },
  
  // Books Page
  books: {
    addBookButton: 'button:has-text("Add Book")',
    searchInput: 'input[placeholder*="Search"]',
    bookCard: '[data-testid="book-card"]',
    bookName: '[data-testid="book-name"]',
    bookBalance: '[data-testid="book-balance"]',
    selectAllCheckbox: 'input[type="checkbox"]',
    deleteSelectedButton: 'button:has-text("Delete")',
    emptyState: 'text=No books found',
    quickAddSuggestion: '[data-testid="quick-add-suggestion"]',
    sortSelect: 'select',
    paginationInfo: 'text=/Showing\s+\d+/',
  },
  
  // Add Book Modal
  addBookModal: {
    modal: '.MuiDialog-root',
    nameInput: 'input[name="name"], input[placeholder*="Book"]',
    submitButton: 'button[type="submit"]',
    closeButton: 'button[aria-label="close"]',
    title: 'text=Add New Book',
  },
  
  // Book Detail Page
  bookDetail: {
    bookTitle: 'h5',
    backButton: 'button:has([data-testid="FiChevronLeft"])',
    cashInButton: 'button:has-text("Cash In")',
    cashOutButton: 'button:has-text("Cash Out")',
    searchInput: 'input[placeholder*="Search"]',
    exportButton: 'button:has-text("Export")',
    analyticsButton: 'button:has-text("Analytics")',
    filterButton: 'button:has-text("Filters")',
    expenseRow: '[data-testid="expense-row"]',
    expenseDescription: '[data-testid="expense-description"]',
    expenseAmount: '[data-testid="expense-amount"]',
    editExpenseButton: 'button[aria-label="edit"]',
    selectAllCheckbox: 'input[type="checkbox"]',
    paginationInfo: 'text=/Showing\s+\d+/',
    cashInCard: 'text=Cash In',
    cashOutCard: 'text=Cash Out',
    netBalanceCard: 'text=Net Balance',
    durationFilter: 'button:has-text("Duration")',
    typeFilter: 'button:has-text("Types")',
    clearFiltersButton: 'button:has-text("Clear Filters")',
  },
  
  // Add Expense Modal
  addExpenseModal: {
    modal: '.MuiDialog-root',
    descriptionInput: 'input[name="description"]',
    amountInput: 'input[name="amount"]',
    typeSelect: 'select[name="type"]',
    categorySelect: 'select[name="category"]',
    paymentModeSelect: 'select[name="paymentMode"]',
    remarksInput: 'textarea[name="remarks"]',
    submitButton: 'button[type="submit"]',
    saveAndNewButton: 'button:has-text("Save & New")',
    closeButton: 'button[aria-label="close"]',
    title: 'text=Add Entry',
  },
  
  // Sidebar/Navigation
  navigation: {
    sidebar: '[role="navigation"]',
    dashboardLink: 'a:has-text("Dashboard")',
    booksLink: 'a:has-text("Books")',
    analyticsLink: 'a:has-text("Analytics")',
    settingsLink: 'a:has-text("Settings")',
    logoutButton: 'button:has-text("Logout")',
  },
  
  // Dashboard
  dashboard: {
    totalBalance: '[data-testid="total-balance"]',
    totalIncome: '[data-testid="total-income"]',
    totalExpense: '[data-testid="total-expense"]',
    recentBooks: '[data-testid="recent-books"]',
    statsCards: '.MuiCard-root',
    welcomeMessage: 'text=Welcome',
  },
  
  // Delete Confirmation Dialog
  deleteDialog: {
    dialog: '.MuiDialog-root',
    title: 'text=Confirm Deletion',
    message: 'text=Are you sure you want to delete',
    confirmButton: 'button:has-text("Delete")',
    cancelButton: 'button:has-text("Cancel")',
  },

  // Analytics Page
  analytics: {
    page: '[data-testid="analytics-page"]',
    expenseChart: '[data-testid="expense-chart"]',
    incomeChart: '[data-testid="income-chart"]',
    categoryChart: '[data-testid="category-chart"]',
    dateRangeFilter: '[data-testid="date-range-filter"]',
    bookFilter: '[data-testid="book-filter"]',
    exportButton: 'button:has-text("Export")',
    refreshButton: 'button:has-text("Refresh")',
    summaryCards: '[data-testid="summary-card"]',
    trendIndicator: '[data-testid="trend-indicator"]',
  },

  // Settings Page
  settings: {
    page: '[data-testid="settings-page"]',
    currencySelect: '[data-testid="currency-select"]',
    languageSelect: '[data-testid="language-select"]',
    darkModeToggle: '[data-testid="dark-mode-toggle"]',
    notificationsToggle: '[data-testid="notifications-toggle"]',
    changePasswordButton: 'button:has-text("Change Password")',
    deleteAccountButton: 'button:has-text("Delete Account")',
    logoutButton: 'button:has-text("Logout")',
    saveButton: 'button:has-text("Save")',
    resetButton: 'button:has-text("Reset")',
    profileSection: '[data-testid="profile-section"]',
    preferencesSection: '[data-testid="preferences-section"]',
    securitySection: '[data-testid="security-section"]',
  },

  // Budget Page
  budget: {
    page: '[data-testid="budget-page"]',
    addBudgetButton: 'button:has-text("Add Budget")',
    budgetCard: '[data-testid="budget-card"]',
    budgetName: '[data-testid="budget-name"]',
    budgetAmount: '[data-testid="budget-amount"]',
    budgetProgress: '[data-testid="budget-progress"]',
    budgetCategory: '[data-testid="budget-category"]',
    searchInput: 'input[placeholder*="Search budgets"]',
    filterButton: 'button:has-text("Filter")',
    editButton: 'button[aria-label="edit"]',
    deleteButton: 'button[aria-label="delete"]',
    emptyState: 'text=No budgets found',
  },

  // Add/Edit Budget Modal
  budgetModal: {
    modal: '.MuiDialog-root',
    nameInput: 'input[name="budget-name"], input[placeholder*="Budget name"]',
    amountInput: 'input[name="amount"]',
    categorySelect: 'select[name="category"]',
    periodSelect: 'select[name="period"]',
    startDateInput: 'input[name="startDate"]',
    endDateInput: 'input[name="endDate"]',
    notesInput: 'textarea[name="notes"]',
    submitButton: 'button[type="submit"]',
    closeButton: 'button[aria-label="close"]',
  },

  // Loans Page
  loans: {
    page: '[data-testid="loans-page"]',
    addLoanButton: 'button:has-text("Add Loan")',
    loanCard: '[data-testid="loan-card"]',
    loanName: '[data-testid="loan-name"]',
    loanAmount: '[data-testid="loan-amount"]',
    loanBalance: '[data-testid="loan-balance"]',
    loanInterest: '[data-testid="loan-interest"]',
    loanStatus: '[data-testid="loan-status"]',
    searchInput: 'input[placeholder*="Search loans"]',
    filterButton: 'button:has-text("Filter")',
    sortSelect: 'select',
    editButton: 'button[aria-label="edit"]',
    deleteButton: 'button[aria-label="delete"]',
    payButton: 'button:has-text("Pay")',
    emptyState: 'text=No loans found',
  },

  // Add/Edit Loan Modal
  loanModal: {
    modal: '.MuiDialog-root',
    nameInput: 'input[name="loan-name"], input[placeholder*="Loan name"]',
    amountInput: 'input[name="amount"]',
    interestRateInput: 'input[name="interestRate"]',
    termInput: 'input[name="term"]',
    startDateInput: 'input[name="startDate"]',
    lenderInput: 'input[name="lender"]',
    notesInput: 'textarea[name="notes"]',
    submitButton: 'button[type="submit"]',
    closeButton: 'button[aria-label="close"]',
  },

  // Subscriptions Page
  subscriptions: {
    page: '[data-testid="subscriptions-page"]',
    addSubscriptionButton: 'button:has-text("Add Subscription")',
    subscriptionCard: '[data-testid="subscription-card"]',
    subscriptionName: '[data-testid="subscription-name"]',
    subscriptionAmount: '[data-testid="subscription-amount"]',
    subscriptionCycle: '[data-testid="subscription-cycle"]',
    subscriptionNextBill: '[data-testid="subscription-next-bill"]',
    subscriptionStatus: '[data-testid="subscription-status"]',
    searchInput: 'input[placeholder*="Search subscriptions"]',
    filterButton: 'button:has-text("Filter")',
    sortByCycle: 'button:has-text("Cycle")',
    editButton: 'button[aria-label="edit"]',
    deleteButton: 'button[aria-label="delete"]',
    cancelSubscriptionButton: 'button:has-text("Cancel")',
    emptyState: 'text=No subscriptions found',
  },

  // Add/Edit Subscription Modal
  subscriptionModal: {
    modal: '.MuiDialog-root',
    nameInput: 'input[name="subscription-name"], input[placeholder*="Subscription name"]',
    amountInput: 'input[name="amount"]',
    cycleSelect: 'select[name="cycle"]',
    categorySelect: 'select[name="category"]',
    startDateInput: 'input[name="startDate"]',
    paymentMethodSelect: 'select[name="paymentMethod"]',
    notesInput: 'textarea[name="notes"]',
    reminderToggle: '[data-testid="reminder-toggle"]',
    submitButton: 'button[type="submit"]',
    closeButton: 'button[aria-label="close"]',
  },

  // Investments Page
  investments: {
    page: '[data-testid="investments-page"]',
    addInvestmentButton: 'button:has-text("Add Investment")',
    investmentCard: '[data-testid="investment-card"]',
    investmentName: '[data-testid="investment-name"]',
    investmentValue: '[data-testid="investment-value"]',
    investmentType: '[data-testid="investment-type"]',
    investmentReturns: '[data-testid="investment-returns"]',
    searchInput: 'input[placeholder*="Search investments"]',
    filterButton: 'button:has-text("Filter")',
    sortByValue: 'button:has-text("Value")',
    editButton: 'button[aria-label="edit"]',
    deleteButton: 'button[aria-label="delete"]',
    emptyState: 'text=No investments found',
  },

  // Add/Edit Investment Modal
  investmentModal: {
    modal: '.MuiDialog-root',
    nameInput: 'input[name="investment-name"], input[placeholder*="Investment name"]',
    typeSelect: 'select[name="type"]',
    valueInput: 'input[name="value"]',
    sharesInput: 'input[name="shares"]',
    purchaseDateInput: 'input[name="purchaseDate"]',
    notesInput: 'textarea[name="notes"]',
    submitButton: 'button[type="submit"]',
    closeButton: 'button[aria-label="close"]',
  },
} as const;

/**
 * Helper to create a data-testid selector
 * @param id - The data-testid value
 * @returns CSS selector string
 */
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

/**
 * Helper to create a text-based selector
 * @param text - The text content to match
 * @returns CSS selector string
 */
export function text(text: string): string {
  return `text="${text}"`;
}

/**
 * Helper to create a contains-text selector
 * @param text - The text content to match (partial)
 * @returns CSS selector string
 */
export function containsText(text: string): string {
  return `:has-text("${text}")`;
}
