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
