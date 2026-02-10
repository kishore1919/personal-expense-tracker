'use client';

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiBook } from 'react-icons/fi';
import {
  Typography,
  Box,
  Grid,
  LinearProgress,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from '../firebase';
import Loading from '../components/Loading';
import { useCurrency } from '../context/CurrencyContext';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Expense {
  id: string;
  description: string;
  amount: number;
  type?: 'in' | 'out';
  createdAt?: string;
}

export default function AnalyticsPage() {
  const [user] = useAuthState(auth);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [averageExpense, setAverageExpense] = useState(0);
  const [highestExpense, setHighestExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'books'), where('userId', '==', user.uid));
      const booksSnapshot = await getDocs(q);
      const booksData = booksSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name 
      }));
      setTotalBooks(booksData.length);

      let totalOutAmount = 0;
      let expenseCount = 0;
      let highestAmount = 0;

      for (const book of booksData) {
        const expensesSnapshot = await getDocs(collection(db, `books/${book.id}/expenses`));
        expensesSnapshot.forEach((doc) => {
          const expense = doc.data() as Expense;
          const amount = expense.amount || 0;
          
          if (expense.type === 'out') {
            totalOutAmount += amount;
            expenseCount++;
            if (amount > highestAmount) {
              highestAmount = amount;
            }
          }
        });
      }

      setTotalExpenses(totalOutAmount);
      setAverageExpense(expenseCount > 0 ? totalOutAmount / expenseCount : 0);
      setHighestExpense(highestAmount);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: FiDollarSign,
      color: 'primary.main',
    },
    {
      title: 'Total Books',
      value: totalBooks,
      icon: FiBook,
      color: 'secondary.main',
    },
    {
      title: 'Average Expense',
      value: formatCurrency(averageExpense),
      icon: FiTrendingUp,
      color: 'success.main',
    },
    {
      title: 'Highest Expense',
      value: formatCurrency(highestExpense),
      icon: FiTrendingDown,
      color: 'error.main',
    },
  ];

  if (loading) {
    return <Loading />;
  }

  // Manage monthlyBudget on the client to avoid SSR/client mismatches when reading localStorage
  const [monthlyBudget, setMonthlyBudget] = useState<number>(Math.max(1000, totalBooks * 1000));

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('monthly_budget') : null;
      if (stored !== null) {
        const n = Number(stored) || 0;
        setMonthlyBudget(Math.max(1000, n || totalBooks * 1000));
      } else {
        setMonthlyBudget(Math.max(1000, totalBooks * 1000));
      }
    } catch {
      setMonthlyBudget(Math.max(1000, totalBooks * 1000));
    }
  }, [totalBooks]);

  const spendingPercent = totalExpenses > 0 ? Math.min(Math.max(Math.round((totalExpenses / monthlyBudget) * 100), 0), 100) : 0;
  const healthPercent = totalExpenses > 0 ? Math.min(Math.max(Math.round(((monthlyBudget - totalExpenses) / monthlyBudget) * 100), 0), 100) : 100;

  return (
    <Box sx={{ pb: 10 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your financial insights and spending patterns.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, xl: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: stat.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <stat.icon size={24} />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: '500' }}>
                Expense Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Spending Activity
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {totalExpenses > 0 ? 'Active' : 'No Activity'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={spendingPercent}
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Book Organization
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {totalBooks > 0 ? `${totalBooks} Books` : 'No Books'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={totalBooks > 0 ? Math.min(totalBooks * 20, 100) : 0}
                    color="secondary"
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Budget Health
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {totalExpenses > 0 ? 'Good' : 'N/A'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={healthPercent}
                    color="warning"
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: '500' }}>
                Quick Insights
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3, display: 'flex', gap: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingUp />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      Spending Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {totalExpenses > 0
                        ? `You've recorded ${formatCurrency(totalExpenses)} in total expenses across ${totalBooks} book${totalBooks !== 1 ? 's' : ''}.`
                        : 'Start adding expenses to see your spending trends.'
                      }
                    </Typography>
                  </Box>
                </Paper>

                <Paper sx={{ p: 3, display: 'flex', gap: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiDollarSign />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      Average Transaction
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {averageExpense > 0
                        ? `Your average expense is ${formatCurrency(averageExpense)} per transaction.`
                        : 'Add expenses to calculate your average transaction amount.'
                      }
                    </Typography>
                  </Box>
                </Paper>

                <Paper sx={{ p: 3, display: 'flex', gap: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingDown />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      Top Expense
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {highestExpense > 0
                        ? `Your highest single expense was ${formatCurrency(highestExpense)}.`
                        : 'No expenses recorded yet.'
                      }
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
