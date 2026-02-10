'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Chip,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Grid,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  FiUser,
  FiMail,
  FiMoon,
  FiBell,
  FiShield,
  FiGlobe,
  FiTrash2,
  FiTag,
} from 'react-icons/fi';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAuthState } from 'react-firebase-hooks/auth';

const CORE_CATEGORIES = ['Food', 'Travel', 'Medical', 'Shopping', 'Bills', 'Misc'];

// Skeleton loader
const SettingSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width="40%" height={28} />
      </Box>
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
    </CardContent>
  </Card>
);

const CategoryManager: React.FC = () => {
  const [user] = useAuthState(auth);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      try {
        setLoadingCats(true);
        const q = query(
          collection(db, 'categories'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const cats = querySnapshot.docs
          .map(d => ({ id: d.id, name: d.data().name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(cats);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories.');
      } finally {
        setLoadingCats(false);
      }
    };

    fetchCategories();
  }, [user]);

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategory.trim() || !user) return;

    const name = newCategory.trim();
    if (CORE_CATEGORIES.some(c => c.toLowerCase() === name.toLowerCase())) {
      setError('This category already exists in core categories.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: name,
        userId: user.uid
      });
      setCategories((prev) => [...prev, { id: docRef.id, name: name }].sort((a,b)=>a.name.localeCompare(b.name)));
      setNewCategory('');
      setError(null);
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    // Open the confirmation dialog
    setDeleteCatTarget(id);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCatTarget) return;
    setIsDeletingCat(true);
    try {
      await deleteDoc(doc(db, 'categories', deleteCatTarget));
      setCategories((prev) => prev.filter(c => c.id !== deleteCatTarget));
      setError(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete category: ${msg}`);
    } finally {
      setIsDeletingCat(false);
      setDeleteCatTarget(null);
    }
  };

  // Combine core and user categories for display
  const allCategories = [
    ...CORE_CATEGORIES.map(name => ({ id: `core-${name}`, name, isCore: true })),
    ...categories.map(c => ({ ...c, isCore: false }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box 
        component="form" 
        onSubmit={handleAddCategory} 
        sx={{ display: 'flex', gap: 1.5, mb: 3 }}
      >
        <TextField
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          size="small"
          placeholder="New category name"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : undefined,
              '& fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : undefined },
              '&:hover fieldset': { borderColor: '#6366F1' },
            },
            '& .MuiInputBase-input::placeholder': { color: (theme) => theme.palette.mode === 'dark' ? '#64748B' : undefined }
          }}
        />
        <Button type="submit" variant="contained" disabled={!newCategory.trim()} sx={{ width: 92, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : undefined, color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : undefined, border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : undefined }}>
          Add
        </Button>
      </Box>

      {loadingCats ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : undefined, borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : undefined, borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {allCategories.map((c, index) => (
              <React.Fragment key={c.id}>
                {index > 0 && <Divider sx={{ borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : undefined }} />}
                <ListItem
                  secondaryAction={
                    !c.isCore && (
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteCategory(c.id)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'error.main',
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.08)' : 'error.bg',
                          },
                        }}
                      >
                        <FiTrash2 size={18} />
                      </IconButton>
                    )
                  }
                  sx={{
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : undefined,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: c.isCore ? 'secondary.main' : 'primary.main',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText 
                    primary={c.name}
                    primaryTypographyProps={{ fontWeight: 500 }}
                    secondary={c.isCore ? 'Core Category' : null}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <Dialog
        open={deleteCatTarget !== null}
        onClose={() => !isDeletingCat && setDeleteCatTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this category? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCatTarget(null)} disabled={isDeletingCat}>Cancel</Button>
          <Button onClick={handleConfirmDeleteCategory} color="error" autoFocus disabled={isDeletingCat}>
            {isDeletingCat ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  // Default to 'true' at initial render and hydrate actual persisted value on mount to avoid
  // server/client content differences that cause hydration warnings.
  const [notifications, setNotifications] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('pet_notifications');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    } catch {
      // ignore
    }
  }, []);
  const { currency, setCurrency, currencyOptions } = useCurrency();
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleNotifications = () => {
    setNotifications((prev) => {
      const next = !prev;
      try { localStorage.setItem('pet_notifications', String(next)); } catch {}
      return next;
    });
  };

  const settingsItems = [
    {
      icon: <FiMail size={20} />,
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      icon: <FiShield size={20} />,
      label: 'Account Status',
      value: <Chip label="Active" color="success" size="small" />,
    },
    {
      icon: <FiUser size={20} />,
      label: 'User ID',
      value: <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{user?.uid || 'N/A'}</Typography>,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account and preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Account Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          {loading ? (
            <SettingSkeleton />
          ) : (
            <Card sx={{ height: '100%', backgroundColor: isDarkMode ? '#1E293B' : undefined, color: isDarkMode ? '#F8FAFC' : undefined, border: isDarkMode ? '1px solid #334155' : undefined, boxShadow: isDarkMode ? 'none' : undefined }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    <FiUser size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    Account Information
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {settingsItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                      {index > 0 && <Divider sx={{ my: 2, borderColor: isDarkMode ? '#334155' : undefined }} />}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: 'text.secondary' }}>{item.icon}</Box>
                          <Typography color="text.secondary">{item.label}</Typography>
                        </Box>
                        <Box>
                          {typeof item.value === 'string' ? (
                            <Typography fontWeight={500}>{item.value}</Typography>
                          ) : (
                            item.value
                          )}
                        </Box>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Preferences */}
        <Grid size={{ xs: 12, md: 6 }}>
          {loading ? (
            <SettingSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    <FiBell size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    Preferences
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Notifications */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: 'text.secondary' }}><FiBell size={20} /></Box>
                      <Box>
                        <Typography fontWeight={500}>Notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receive updates about your expenses
                        </Typography>
                      </Box>
                    </Box>
                    <Switch checked={notifications} onChange={toggleNotifications} color="primary" />
                  </Box>

                  <Divider />

                  {/* Dark Mode */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: 'text.secondary' }}><FiMoon size={20} /></Box>
                      <Box>
                        <Typography fontWeight={500}>Dark Mode</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Switch between light and dark themes
                        </Typography>
                      </Box>
                    </Box>
                    <Switch checked={isDarkMode} onChange={toggleDarkMode} color="primary" />
                  </Box>

                  <Divider />

                  {/* Currency */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: 'text.secondary' }}><FiGlobe size={20} /></Box>
                      <Box>
                        <Typography fontWeight={500}>Currency</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Used globally across all totals
                        </Typography>
                      </Box>
                    </Box>
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as string)}
                        size="small"
                      >
                        {currencyOptions.map((option) => (
                          <MenuItem key={option.code} value={option.code}>
                            {option.code}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Categories */}
        <Grid size={{ xs: 12 }}>
          {loading ? (
            <SettingSkeleton />
          ) : (
            <Card sx={{ backgroundColor: isDarkMode ? '#1E293B' : undefined, color: isDarkMode ? '#F8FAFC' : undefined, border: isDarkMode ? '1px solid #334155' : undefined }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    <FiTag size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    Categories
                  </Typography>
                </Box>
                <CategoryManager />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Personal Expense Tracker v0.1.0
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Built with Next.js and Firebase
        </Typography>
      </Box>
    </Box>
  );
}
