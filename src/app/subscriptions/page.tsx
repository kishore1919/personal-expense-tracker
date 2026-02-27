'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    FiPlus,
    FiSearch,
    FiChevronLeft,
    FiChevronRight,
    FiTrash2,
    FiEdit2,
    FiCheckCircle,
    FiCalendar,
    FiDollarSign,
} from 'react-icons/fi';
import {
    Button,
    TextField,
    InputAdornment,
    Box,
    Typography,
    Alert,
    IconButton,
    Skeleton,
    Paper,
    Container,
    MenuItem,
    Select,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Tooltip,
} from '@mui/material';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import { useCurrency } from '../context/CurrencyContext';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * Subscription interface representing a subscription entity
 */
interface Subscription {
    id: string;
    name: string;
    amount: number;
    billingCycle: 'weekly' | 'monthly' | 'yearly';
    startDate: string; // ISO string for easy date input
    category: string;
    status: 'active' | 'paused' | 'cancelled';
    userId?: string;
    createdAt?: Date;
}

const TableRowSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
        <TableCell><Skeleton variant="text" width="60%" /></TableCell>
        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
        <TableCell><Skeleton variant="text" width="80%" /></TableCell>
        <TableCell><Skeleton variant="rectangular" width={80} height={30} /></TableCell>
    </TableRow>
);

export default function SubscriptionsPage() {
    const [user] = useAuthState(auth);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'amount' | 'nextBillingDate'>('nextBillingDate');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [page, setPage] = useState<number>(1);
    const pageSize = 10;

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        billingCycle: 'monthly',
        startDate: '',
        category: 'OTT',
        status: 'active',
    });

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        setPage(1);
    }, [searchQuery, sortBy, pageSize]);

    useEffect(() => {
        if (!user) return;

        const fetchSubscriptions = async () => {
            try {
                setLoading(true);
                const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);

                const subsData = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || 'Unnamed',
                        amount: Number(data.amount) || 0,
                        billingCycle: data.billingCycle || 'monthly',
                        startDate: data.startDate || '',
                        category: data.category || 'OTT',
                        status: data.status || 'active',
                        createdAt: data.createdAt,
                    } as Subscription;
                });

                setSubscriptions(subsData);
                setError(null);
            } catch (e) {
                console.error("Error loading subscriptions:", e);
                setError('Failed to load subscriptions.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptions();
    }, [user]);

    const handleSaveSub = async () => {
        if (!user) return;
        if (!formData.name || !formData.amount || !formData.startDate) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            const subData = {
                name: formData.name,
                amount: Number(formData.amount),
                billingCycle: formData.billingCycle,
                startDate: formData.startDate,
                category: formData.category,
                status: formData.status,
                updatedAt: new Date(),
                userId: user.uid,
            };

            if (editingSub) {
                const docRef = doc(db, 'subscriptions', editingSub.id);
                await updateDoc(docRef, subData);
                setSubscriptions(prev => prev.map(s => s.id === editingSub.id ? { ...s, ...subData, id: editingSub.id } as Subscription : s));
            } else {
                const fullData = { ...subData, createdAt: new Date() };
                const docRef = await addDoc(collection(db, 'subscriptions'), fullData);
                setSubscriptions(prev => [{ ...fullData, id: docRef.id } as Subscription, ...prev]);
            }

            setIsModalOpen(false);
            setEditingSub(null);
            setFormData({ name: '', amount: '', billingCycle: 'monthly', startDate: '', category: 'OTT', status: 'active' });
            setError(null);
        } catch (e) {
            console.error("Error saving subscription: ", e);
            setError("Failed to save subscription.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'subscriptions', deleteTarget));
            setSubscriptions(prev => prev.filter(s => s.id !== deleteTarget));
            setError(null);
        } catch (e) {
            console.error('Error deleting subscription:', e);
            setError('Failed to delete subscription.');
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const openAddModal = () => {
        setEditingSub(null);
        const dateStr = new Date().toISOString().split('T')[0];
        setFormData({ name: '', amount: '', billingCycle: 'monthly', startDate: dateStr, category: 'OTT', status: 'active' });
        setIsModalOpen(true);
    };

    const openEditModal = (sub: Subscription) => {
        setEditingSub(sub);
        setFormData({
            name: sub.name,
            amount: sub.amount.toString(),
            billingCycle: sub.billingCycle,
            startDate: sub.startDate,
            category: sub.category,
            status: sub.status,
        });
        setIsModalOpen(true);
    };

    const calculateNextBillingDate = (startDate: string, cycle: 'weekly' | 'monthly' | 'yearly'): Date => {
        const start = new Date(startDate);
        const now = new Date();
        const next = new Date(start);

        while (next < now) {
            if (cycle === 'weekly') next.setDate(next.getDate() + 7);
            else if (cycle === 'monthly') next.setMonth(next.setMonth(next.getMonth() + 1));
            else if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1);
        }
        return next;
    };

    const filteredAndSorted = useMemo(() => {
        let result = subscriptions.filter(sub =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

        result = [...result].sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'amount') return b.amount - a.amount;
            if (sortBy === 'nextBillingDate') {
                const nextA = calculateNextBillingDate(a.startDate, a.billingCycle);
                const nextB = calculateNextBillingDate(b.startDate, b.billingCycle);
                return nextA.getTime() - nextB.getTime();
            }
            return 0;
        });

        return result;
    }, [subscriptions, searchQuery, sortBy]);

    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const monthlyTotal = activeSubs.reduce((sum, s) => {
        if (s.billingCycle === 'yearly') return sum + (s.amount / 12);
        if (s.billingCycle === 'weekly') return sum + (s.amount * 4.33); // Average weeks in a month
        return sum + s.amount;
    }, 0);
    const yearlyTotal = activeSubs.reduce((sum, s) => {
        if (s.billingCycle === 'monthly') return sum + (s.amount * 12);
        if (s.billingCycle === 'weekly') return sum + (s.amount * 52);
        return sum + s.amount;
    }, 0);

    const totalFiltered = filteredAndSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const displayedSubs = filteredAndSorted.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [page, totalPages]);

    const getStatusColor = (status: string) => {
        if (status === 'active') return 'success';
        if (status === 'paused') return 'warning';
        return 'error';
    };

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
            {!loading && (
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'primary.main' }}>
                            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                                    <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)', color: 'primary.main', display: 'flex' }}>
                                        <FiCheckCircle size={16} />
                                    </Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Active Subscriptions</Typography>
                                </Box>
                                <Typography variant="h5" fontWeight={700}>{activeSubs.length}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'warning.main' }}>
                            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                                    <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', color: 'warning.main', display: 'flex' }}>
                                        <FiDollarSign size={16} />
                                    </Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Monthly Est. Cost</Typography>
                                </Box>
                                <Typography variant="h5" fontWeight={700} color="warning.main">{formatCurrency(monthlyTotal)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                        <Card sx={{ height: '100%', borderTop: '4px solid', borderColor: 'error.main' }}>
                            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 } }}>
                                    <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: 'error.main', display: 'flex' }}>
                                        <FiCalendar size={16} />
                                    </Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Yearly Est. Cost</Typography>
                                </Box>
                                <Typography variant="h5" fontWeight={700} color="error.main">{formatCurrency(yearlyTotal)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 }, mb: { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <TextField
                            placeholder="Search by name or category..."
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><FiSearch size={18} /></InputAdornment>,
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: 1, sm: 'none' } }}>
                            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'amount' | 'nextBillingDate')}>
                                <MenuItem value="nextBillingDate">Sort By: Next Billing Date</MenuItem>
                                <MenuItem value="amount">Sort By: Amount</MenuItem>
                                <MenuItem value="name">Sort By: Name</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={openAddModal}
                            startIcon={<FiPlus />}
                            fullWidth
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                px: { xs: 3, sm: 4 },
                                height: 40,
                                width: { sm: 'auto' },
                                boxShadow: (theme) => theme.palette.mode === 'dark'
                                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                                    : '0 4px 12px rgba(99, 102, 241, 0.2)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: (theme) => theme.palette.mode === 'dark'
                                        ? '0 6px 16px rgba(0, 0, 0, 0.6)'
                                        : '0 6px 16px rgba(99, 102, 241, 0.3)',
                                    bgcolor: 'primary.dark',
                                },
                                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            Add Subscription
                        </Button>
                    </Box>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Mobile View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="40%" height={20} />
                        </Paper>
                    ))
                ) : displayedSubs.length > 0 ? (
                    displayedSubs.map((sub) => (
                        <Paper key={sub.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography fontWeight={600}>{sub.name}</Typography>
                                    <Typography color="text.secondary" variant="body2">{sub.category}</Typography>
                                </Box>
                                <Box>
                                    <IconButton size="small" onClick={() => openEditModal(sub)}><FiEdit2 size={16} /></IconButton>
                                    <IconButton size="small" onClick={() => setDeleteTarget(sub.id)} color="error"><FiTrash2 size={16} /></IconButton>
                                </Box>
                            </Box>

                            <Grid container spacing={1.5}>
                                <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">Amount</Typography>
                                    <Typography fontWeight={600}>{formatCurrency(sub.amount)}</Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">Billing</Typography>
                                    <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>{sub.billingCycle}</Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary">Next Date</Typography>
                                    <Typography fontWeight={600}>{calculateNextBillingDate(sub.startDate, sub.billingCycle).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Status</Typography>
                                    <Chip label={sub.status} color={getStatusColor(sub.status)} size="small" sx={{ textTransform: 'capitalize' }} />
                                </Grid>
                            </Grid>
                        </Paper>
                    ))
                ) : (
                    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="body1" color="text.secondary">No subscriptions found</Typography>
                    </Paper>
                )}
            </Box>

            {/* Desktop View */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Billing Cycle</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Next Billing Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3].map((i) => <TableRowSkeleton key={i} />)
                        ) : displayedSubs.length > 0 ? (
                            displayedSubs.map((sub) => (
                                <TableRow key={sub.id} hover>
                                    <TableCell><Typography fontWeight={500}>{sub.name}</Typography></TableCell>
                                    <TableCell>{sub.category}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(sub.amount)}</TableCell>
                                    <TableCell align="center" sx={{ textTransform: 'capitalize' }}>{sub.billingCycle}</TableCell>
                                    <TableCell>{calculateNextBillingDate(sub.startDate, sub.billingCycle).toLocaleDateString()}</TableCell>
                                    <TableCell align="center"><Chip label={sub.status} color={getStatusColor(sub.status)} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditModal(sub)}><FiEdit2 size={16} /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTarget(sub.id)} color="error"><FiTrash2 size={16} /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography variant="h6" color="text.secondary">No subscriptions found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
                    <IconButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} size="small"><FiChevronLeft /></IconButton>
                    <Typography variant="body2" color="text.secondary">Page <strong>{page}</strong> of {totalPages}</Typography>
                    <IconButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} size="small"><FiChevronRight /></IconButton>
                </Box>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingSub ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="Amount" type="number" fullWidth value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <Select value={formData.billingCycle} onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'weekly' | 'monthly' | 'yearly' })}>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                        <MenuItem value="yearly">Yearly</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="Category" fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. OTT, Software, Utility" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="Start Date" type="date" fullWidth value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                            </Grid>
                        </Grid>
                        <FormControl fullWidth>
                            <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'cancelled' })}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="paused">Paused</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSub} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <DialogTitle>Delete Subscription</DialogTitle>
                <DialogContent>Are you sure you want to delete this subscription? This action cannot be undone.</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
