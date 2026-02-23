/**
 * Sidebar Component - Navigation sidebar with collapsible functionality.
 * Provides navigation to main sections of the app and logout functionality.
 * Features:
 * - Collapsible sidebar with smooth transitions
 * - Desktop: Permanent drawer on the left
 * - Mobile: Bottom navigation bar
 * - Active state highlighting for current page
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  FiGrid,
  FiBookOpen,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiTarget,
  FiTrendingUp,
  FiCreditCard,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';

/**
 * Navigation menu items configuration
 * Defines the available routes in the sidebar
 */
const menuItems = [
  { icon: FiGrid, name: 'Dashboard', path: '/' },
  { icon: FiBookOpen, name: 'My Books', path: '/books' },
  { icon: FiTarget, name: 'Budget', path: '/budget' },
  { icon: FiTrendingUp, name: 'Investments', path: '/investments' },
  { icon: FiCreditCard, name: 'Loans', path: '/loans' },
  { icon: FiSettings, name: 'Settings', path: '/settings' },
];

/**
 * Mobile navigation menu items - simplified for mobile view
 * Only shows Dashboard and Books for easier mobile navigation
 */
const mobileMenuItems = [
  { icon: FiGrid, name: 'Dashboard', path: '/' },
  { icon: FiBookOpen, name: 'Books', path: '/books' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed, sidebarWidth } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const drawerContent = (
    <>
      {/* Logo Section */}
      <Box
        onClick={() => router.push('/')}
        sx={{
          p: isCollapsed ? 1.5 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 0 : 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 72,
          transition: 'all 200ms ease',
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FaBook size={20} />
        </Box>
        {!isCollapsed && (
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            Expense Pilot
          </Typography>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={isCollapsed ? item.name : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  href={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: isCollapsed ? 1.5 : 2,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    transition: 'all 150ms ease',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? 0 : 40,
                      color: isActive ? 'inherit' : 'text.secondary',
                      justifyContent: 'center',
                    }}
                  >
                    <item.icon size={22} />
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Logout Button */}
      <List sx={{ px: 1.5, pb: 2 }}>
        <ListItem disablePadding>
          <Tooltip
            title={isCollapsed ? 'Logout' : ''}
            placement="right"
            arrow
          >
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: isCollapsed ? 1.5 : 2,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                  opacity: 0.8,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsed ? 0 : 40,
                  color: 'inherit',
                  justifyContent: 'center',
                }}
              >
                <FiLogOut size={22} />
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>

      {/* Collapse Toggle Button */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
        }}
      >
        <IconButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          size="small"
          sx={{
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </IconButton>
      </Box>
    </>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            transition: 'width 200ms ease',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Bottom Navigation - Shows on mobile and tablet (xs and sm) */}
      <Paper
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: '1px solid',
          borderColor: 'divider',
          // iOS Safe Area Support
          pb: 'env(safe-area-inset-bottom, 0)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={pathname === '/' ? 1 : mobileMenuItems.findIndex(item => item.path === pathname)}
          showLabels
          sx={{
            bgcolor: 'background.paper',
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              flex: 1,
              py: 1,
              transition: 'all 150ms ease',
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: 'rgba(99, 102, 241, 0.08)',
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: 700,
                },
              },
            },
          }}
        >
          {/* Hamburger Menu - Opens Full Navigation */}
          <BottomNavigationAction
            label="Menu"
            icon={<FiMenu size={24} />}
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          />
          {mobileMenuItems.map((item) => {
            const isActive = item.path === pathname;
            return (
              <BottomNavigationAction
                key={item.name}
                label={item.name}
                icon={
                  <Box sx={{ position: 'relative' }}>
                    <item.icon size={24} />
                    {isActive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          border: '2px solid',
                          borderColor: 'background.paper',
                        }}
                      />
                    )}
                  </Box>
                }
                component={Link}
                href={item.path}
                sx={{
                  color: isActive ? 'primary.main' : 'text.secondary',
                }}
              />
            );
          })}
        </BottomNavigation>
      </Paper>

      {/* Mobile Menu Drawer (Hamburger Menu) - Shows on mobile and tablet */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaBook size={20} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Expense Pilot
            </Typography>
          </Box>
          <IconButton onClick={() => setMobileMenuOpen(false)} size="small">
            <FiX size={20} />
          </IconButton>
        </Box>

        {/* Menu Items */}
        <List sx={{ py: 2 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  onClick={handleMobileNavClick}
                  selected={isActive}
                  sx={{
                    py: 2,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? 'inherit' : 'text.secondary',
                    }}
                  >
                    <item.icon size={22} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider />

        {/* Logout in Drawer */}
        <List sx={{ py: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 2,
                px: 2,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <FiLogOut size={22} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
