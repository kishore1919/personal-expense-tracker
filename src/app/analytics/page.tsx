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
import { useCurrencyStore } from '../stores';
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
  const { formatCurrency } = useCurrencyStore();

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => Math.max(1000, totalBooks * 1000));

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

  useEffect(() => {
    if (!user) return;

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

    fetchAnalyticsData();
  }, [user]);

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

  const spendingPercent = totalExpenses > 0 ? Math.min(Math.max(Math.round((totalExpenses / monthlyBudget) * 100), 0), 100) : 0;
  const healthPercent = totalExpenses > 0 ? Math.min(Math.max(Math.round(((monthlyBudget - totalExpenses) / monthlyBudget) * 100), 0), 100) : 100;

  return (
    <Box sx={{ pb: { xs: 10, sm: 10, md: 4 } }}>
      {/* Header Card */}
      <Card sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              fontWeight: 600,
            }}
          >
            Analytics
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5,
            }}
          >
            Track your financial insights and spending patterns.
          </Typography>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    width: { xs: 44, sm: 48 },
                    height: { xs: 44, sm: 48 },
                    borderRadius: 2,
                    bgcolor: (theme) => {
                      const baseColor = stat.color.split('.')[0];
                      return theme.palette.mode === 'dark'
                        ? `rgba(${baseColor === 'primary' ? '129, 140, 248' : baseColor === 'secondary' ? '161, 161, 170' : baseColor === 'success' ? '16, 185, 129' : '239, 68, 68'}, 0.1)`
                        : theme.palette[baseColor as 'primary'|'secondary'|'success'|'error'].light;
                    },
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <stat.icon size={20} />
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    lineHeight: 1.4,
                  }}
                >
                  {stat.title}
                </Typography>
                <Typography 
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    fontWeight: 600,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                  }}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Expense Overview */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: { xs: 3, sm: 4 }, 
                  fontWeight: 500,
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                }}
              >
                Expense Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
                <Box>
                  <Box sx={{ 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Spending Activity
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {totalExpenses > 0 ? 'Active' : 'No Activity'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={spendingPercent}
                    sx={{ height: { xs: 10, sm: 12 }, borderRadius: 6 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Book Organization
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {totalBooks > 0 ? `${totalBooks} Books` : 'No Books'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={totalBooks > 0 ? Math.min(totalBooks * 20, 100) : 0}
                    color="secondary"
                    sx={{ height: { xs: 10, sm: 12 }, borderRadius: 6 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Budget Health
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {totalExpenses > 0 ? 'Good' : 'N/A'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={healthPercent}
                    color="warning"
                    sx={{ height: { xs: 10, sm: 12 }, borderRadius: 6 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Insights */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: { xs: 3, sm: 4 }, 
                  fontWeight: 500,
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                }}
              >
                Quick Insights
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                <Paper 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    display: 'flex', 
                    gap: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'row', sm: 'row' },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.1)' : 'primary.light',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingUp size={18} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}
                    >
                      Spending Trend
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {totalExpenses > 0
                        ? `You've recorded ${formatCurrency(totalExpenses)} in total expenses across ${totalBooks} book${totalBooks !== 1 ? 's' : ''}.`
                        : 'Start adding expenses to see your spending trends.'
                      }
                    </Typography>
                  </Box>
                </Paper>

                <Paper 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    display: 'flex', 
                    gap: { xs: 2, sm: 3 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(161, 161, 170, 0.1)' : 'secondary.light',
                      color: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiDollarSign size={18} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}
                    >
                      Average Transaction
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {averageExpense > 0
                        ? `Your average expense is ${formatCurrency(averageExpense)} per transaction.`
                        : 'Add expenses to calculate your average transaction amount.'
                      }
                    </Typography>
                  </Box>
                </Paper>

                <Paper 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    display: 'flex', 
                    gap: { xs: 2, sm: 3 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'error.light',
                      color: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingDown size={18} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}
                    >
                      Top Expense
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
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
