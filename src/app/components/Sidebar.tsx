'use client';

import React, { useMemo } from 'react';
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
} from '@mui/material';
import {
  FiGrid,
  FiBookOpen,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
} from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';

const menuItems = [
  { icon: FiGrid, name: 'Dashboard', path: '/' },
  { icon: FiBookOpen, name: 'My Books', path: '/books' },
  { icon: FiSettings, name: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed, sidebarWidth } = useSidebar();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Calculate active index based on pathname
  const activeIndex = useMemo(() => {
    return menuItems.findIndex(item => item.path === pathname);
  }, [pathname]);

  const drawerContent = (
    <>
      {/* Logo Section */}
      <Box
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

      {/* Mobile Bottom Navigation */}
      <Paper
        sx={{
          display: { xs: 'block', md: 'none' },
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
          value={activeIndex}
          showLabels
          sx={{
            bgcolor: 'background.paper',
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              py: 1,
              transition: 'all 150ms ease',
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: 600,
                },
              },
            },
          }}
        >
          {menuItems.map((item) => (
            <BottomNavigationAction
              key={item.name}
              label={item.name}
              icon={<item.icon size={22} />}
              component={Link}
              href={item.path}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
}
