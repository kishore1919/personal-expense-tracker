'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  Skeleton, 
  useTheme, 
  Paper,
  Divider,
  Button,
  Menu,
  MenuItem,
  Radio,
  FormControlLabel
} from '@mui/material';
import { 
  FiChevronLeft, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity,
  FiTag,
  FiChevronDown
} from 'react-icons/fi';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area,
  Label
} from 'recharts';
import { doc, getDoc, collection, getDocs, query } from "firebase/firestore";
import { auth, db } from '../../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCurrency } from '../../../context/CurrencyContext';

interface Expense {
  id: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  createdAt: Date;
  category: string;
  paymentMode: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#42a5f5', '#66bb6a', '#ffa726'];

export default function BookAnalyticsPage() {
  const { bookId } = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const theme = useTheme();
  const { formatCurrency, currency } = useCurrency();

  const [bookName, setBookName] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const parseLocalDate = (dateStr: string, isEnd = false) => {
    if (!dateStr) return new Date(NaN);
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (isEnd) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleRangeChange = (val: typeof timeRange) => {
    setTimeRange(val);
    handleCloseMenu();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!bookId || typeof bookId !== 'string' || !user) return;

      try {
        setLoading(true);
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          const data = bookSnap.data();
          if (data.userId !== user.uid) {
            router.push('/');
            return;
          }
          setBookName(data.name);
        } else {
          router.push('/');
          return;
        }

        const q = query(collection(db, `books/${bookId}/expenses`));
        const querySnapshot = await getDocs(q);
        
        const expensesData = querySnapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: d.id,
            description: data.description || '--',
            amount: data.amount || 0,
            type: data.type || 'out',
            createdAt,
            category: data.category || 'General',
            paymentMode: data.paymentMode || 'Online',
          } as Expense;
        });

        setExpenses(expensesData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookId, user, router]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let base = expenses;

    // Apply Duration
    switch (timeRange) {
      case 'today':
        base = base.filter(e => e.createdAt >= startOfToday);
        break;
      
      case 'yesterday': {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        base = base.filter(e => e.createdAt >= startOfYesterday && e.createdAt < startOfToday);
        break;
      }
      
      case 'thisMonth': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        base = base.filter(e => e.createdAt >= startOfMonth);
        break;
      }
      
      case 'lastMonth': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        base = base.filter(e => e.createdAt >= startOfLastMonth && e.createdAt <= endOfLastMonth);
        break;
      }

      case 'custom': {
        const startDate = parseLocalDate(customRange.start, false);
        const endDate = parseLocalDate(customRange.end, true);
        base = base.filter(e => e.createdAt >= startDate && e.createdAt <= endDate);
        break;
      }
    }

    return base;
  }, [expenses, timeRange, customRange]);

  const stats = useMemo(() => {
    const totalIn = filteredExpenses.reduce((sum, e) => sum + (e.type === 'in' ? e.amount : 0), 0);
    const totalOut = filteredExpenses.reduce((sum, e) => sum + (e.type === 'out' ? e.amount : 0), 0);
    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut
    };
  }, [filteredExpenses]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number; timestamp: number }>();
    
    const getDateObj = (d: Date) => ({
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      timestamp: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    });

    // For ranges that span multiple days, we can initialize them
    if (timeRange === 'thisMonth') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const { date, timestamp } = getDateObj(d);
        map.set(date, { date, timestamp, income: 0, expense: 0 });
      }
    } else if (timeRange === 'lastMonth') {
      const now = new Date();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(startOfLastMonth.getFullYear(), startOfLastMonth.getMonth(), i);
        const { date, timestamp } = getDateObj(d);
        map.set(date, { date, timestamp, income: 0, expense: 0 });
      }
    } else if (timeRange === 'today') {
      const { date, timestamp } = getDateObj(new Date());
      map.set(date, { date, timestamp, income: 0, expense: 0 });
    } else if (timeRange === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const { date, timestamp } = getDateObj(d);
      map.set(date, { date, timestamp, income: 0, expense: 0 });
    } else if (timeRange === 'custom') {

      const start = parseLocalDate(customRange.start);
      const end = parseLocalDate(customRange.end);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const iterations = Math.min(diffDays, 365);
      for (let i = 0; i <= iterations; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const { date, timestamp } = getDateObj(d);
        map.set(date, { date, timestamp, income: 0, expense: 0 });
      }
    }

    filteredExpenses.forEach(e => {
      const { date, timestamp } = getDateObj(e.createdAt);
      const current = map.get(date) || { date, timestamp, income: 0, expense: 0 };
      if (e.type === 'in') current.income += e.amount;
      else current.expense += e.amount;
      map.set(date, current);
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredExpenses, timeRange, customRange]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    const totalOut = filteredExpenses.reduce((sum, e) => sum + (e.type === 'out' ? e.amount : 0), 0);

    filteredExpenses.filter(e => e.type === 'out').forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ 
      name, 
      value,
      percentage: totalOut > 0 ? (value / totalOut) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, px: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={() => router.back()} 
            size="small" 
            sx={{ 
              ml: -1.5,
              p: 2.5,
              '& .MuiSvgIcon-root, & svg': {
                fontSize: '1.25rem'
              }
            }}
          >
            <FiChevronLeft />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            {bookName} Analytics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Duration Filter */}
          <Button
            variant="outlined"
            onClick={handleOpenMenu}
            endIcon={<FiChevronDown />}
            sx={{ 
              textTransform: 'none', 
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.primary',
              px: { xs: 1, sm: 2 },
              minWidth: 140,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
            }}
          >
            Duration: {(() => {
              switch (timeRange) {
                case 'all': return 'All Time';
                case 'today': return 'Today';
                case 'yesterday': return 'Yesterday';
                case 'thisMonth': return 'This Month';
                case 'lastMonth': return 'Last Month';
                case 'custom': {
                  const start = parseLocalDate(customRange.start);
                  const end = parseLocalDate(customRange.end);
                  return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
                }
                default: return 'All Time';
              }
            })()}
          </Button>

          {/* Duration Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: { width: 220, borderRadius: 2, mt: 1, boxShadow: theme.shadows[4] }
            }}
          >
            {[
              { label: 'All Time', value: 'all' },
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'This Month', value: 'thisMonth' },
              { label: 'Last Month', value: 'lastMonth' },
            ].map((option) => (
              <MenuItem 
                key={option.value} 
                onClick={() => handleRangeChange(option.value as typeof timeRange)}
                sx={{ py: 0.5 }}
              >
                <FormControlLabel
                  value={option.value}
                  control={<Radio size="small" checked={timeRange === option.value} />}
                  label={option.label}
                  sx={{ width: '100%', m: 0 }}
                />
              </MenuItem>
            ))}
            <MenuItem onClick={() => setTimeRange('custom')} sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                value="custom"
                control={<Radio size="small" checked={timeRange === 'custom'} />}
                label="Custom"
                sx={{ width: '100%', m: 0 }}
              />
            </MenuItem>
            
            {timeRange === 'custom' && (
              <Box 
                sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">From</Typography>
                  <Box component="input"
                    type="date" 
                    value={customRange.start}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    sx={{ 
                      width: '100%', 
                      p: 1, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      '&:focus': { borderColor: 'primary.main' }
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">To</Typography>
                  <Box component="input"
                    type="date" 
                    value={customRange.end}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    sx={{ 
                      width: '100%', 
                      p: 1, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      '&:focus': { borderColor: 'primary.main' }
                    }}
                  />
                </Box>
              </Box>
            )}
            
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button size="small" onClick={() => handleRangeChange('all')} sx={{ textTransform: 'none' }}>Clear</Button>
              <Button size="small" variant="contained" onClick={handleCloseMenu} sx={{ textTransform: 'none' }}>Done</Button>
            </Box>
          </Menu>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: 'success.main', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'success.main' }}>
                <FiTrendingUp />
                <Typography variant="subtitle2" fontWeight={600}>Total Income</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{formatCurrency(stats.totalIn)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: 'error.main', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'error.main' }}>
                <FiTrendingDown />
                <Typography variant="subtitle2" fontWeight={600}>Total Expense</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{formatCurrency(stats.totalOut)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: 'primary.main', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                <FiActivity />
                <Typography variant="subtitle2" fontWeight={600}>Net Balance</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: stats.balance >= 0 ? 'success.main' : 'error.main' }}>
                {formatCurrency(stats.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Charts */}
      {filteredExpenses.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No expense data found for the selected time range.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Trend Chart */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FiActivity /> Spending & Income Trend
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4caf50" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f44336" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      tickFormatter={(val) => {
                        // Use compact notation for currency on the axis
                        return new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: currency,
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(val);
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
                      formatter={(value: string | number | undefined, name?: string) => [formatCurrency(Number(value) || 0), name || '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#4caf50" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#f44336" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorExpense)" 
                      name="Expense"
                    />
                    <Legend verticalAlign="top" height={36}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Category Breakdown */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FiTag /> Expenses by Category
              </Typography>
              
              <Grid container spacing={4} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <Label 
                            value={formatCurrency(stats.totalOut)} 
                            position="center" 
                            style={{ 
                              fontSize: '18px', 
                              fontWeight: 'bold', 
                              fill: theme.palette.text.primary,
                              fontFamily: 'inherit'
                            }} 
                          />
                          <Label 
                            value="Total Spent" 
                            position="center" 
                            dy={20}
                            style={{ 
                              fontSize: '12px', 
                              fill: theme.palette.text.secondary,
                              fontFamily: 'inherit'
                            }} 
                          />
                        </Pie>
                        <Tooltip 
                          formatter={(value: string | number | undefined, name?: string) => [
                            formatCurrency(Number(value) || 0), 
                            name || ''
                          ]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {categoryData.length > 0 ? (
                      categoryData.map((item, index) => (
                        <Box key={item.name} sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                              <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" fontWeight={600}>{formatCurrency(item.value)}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.percentage.toFixed(1)}%</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                            <Box 
                              sx={{ 
                                width: `${item.percentage}%`, 
                                height: '100%', 
                                bgcolor: COLORS[index % COLORS.length],
                                transition: 'width 1s ease-in-out'
                              }} 
                            />
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary" textAlign="center">No expenses recorded yet.</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

