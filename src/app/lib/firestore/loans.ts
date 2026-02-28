/**
 * Loans Firestore service layer.
 * Provides type-safe methods for loan CRUD operations.
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import type { Loan } from '@/app/types';
import { toNumber } from '@/app/lib/firestore';

const LOANS_COLLECTION = 'loans';

/**
 * Convert Firestore document to Loan interface.
 */
function docToLoan(docSnapshot: { id: string; data: () => DocumentData }): Loan {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    name: data.name || '',
    lender: data.lender || '',
    amount: toNumber(data.amount),
    paidAmount: toNumber(data.paidAmount),
    interestRate: toNumber(data.interestRate),
    monthlyPayment: toNumber(data.monthlyPayment),
    isActive: data.isActive ?? true,
    createdAt: data.createdAt,
    userId: data.userId,
  };
}

/**
 * Get all loans for a user.
 */
export async function getUserLoans(userId: string): Promise<Loan[]> {
  const q = query(
    collection(db, LOANS_COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToLoan);
}

/**
 * Create a new loan.
 */
export async function createLoan(
  userId: string,
  loanData: Omit<Loan, 'id' | 'userId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, LOANS_COLLECTION), {
    ...loanData,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a loan.
 */
export async function updateLoan(
  loanId: string,
  data: Partial<Omit<Loan, 'id' | 'userId'>>
): Promise<void> {
  const docRef = doc(db, LOANS_COLLECTION, loanId);
  await updateDoc(docRef, data);
}

/**
 * Delete a loan.
 */
export async function deleteLoan(loanId: string): Promise<void> {
  const docRef = doc(db, LOANS_COLLECTION, loanId);
  await deleteDoc(docRef);
}

/**
 * Update loan payment amount.
 */
export async function updateLoanPayment(
  loanId: string,
  paidAmount: number
): Promise<void> {
  const docRef = doc(db, LOANS_COLLECTION, loanId);
  await updateDoc(docRef, { paidAmount });
}

/**
 * Toggle loan active status.
 */
export async function toggleLoanActiveStatus(
  loanId: string,
  isActive: boolean
): Promise<void> {
  const docRef = doc(db, LOANS_COLLECTION, loanId);
  await updateDoc(docRef, { isActive });
}

/**
 * Calculate loan statistics for a user.
 */
export function calculateLoanStats(loans: Loan[]) {
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.isActive).length;
  const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalPaid = loans.reduce((sum, l) => sum + l.paidAmount, 0);
  const totalRemaining = totalAmount - totalPaid;
  const avgInterestRate =
    loans.length > 0
      ? loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length
      : 0;

  return {
    totalLoans,
    activeLoans,
    totalAmount,
    totalPaid,
    totalRemaining,
    avgInterestRate,
  };
}
