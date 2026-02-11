'use client';

import React, { useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, Shadows } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme as useAppTheme } from '../context/ThemeContext';

// Custom shadow definitions for minimalist design
const createShadows = (isDark: boolean): Shadows => {
  const shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)';
  return [
    'none',
    `0 1px 2px ${shadowColor}`, // 1
    `0 1px 3px ${shadowColor}`, // 2
    `0 4px 6px -1px ${shadowColor}`, // 3
    `0 4px 6px -1px ${shadowColor}, 0 2px 4px -1px ${shadowColor}`, // 4
    `0 10px 15px -3px ${shadowColor}`, // 5
    `0 10px 15px -3px ${shadowColor}, 0 4px 6px -2px ${shadowColor}`, // 6
    `0 20px 25px -5px ${shadowColor}`, // 7
    `0 20px 25px -5px ${shadowColor}, 0 10px 10px -5px ${shadowColor}`, // 8
    `0 25px 50px -12px ${shadowColor}`, // 9
    `0 25px 50px -12px ${shadowColor}`, // 10
    `0 25px 50px -12px ${shadowColor}`, // 11
    `0 25px 50px -12px ${shadowColor}`, // 12
    `0 25px 50px -12px ${shadowColor}`, // 13
    `0 25px 50px -12px ${shadowColor}`, // 14
    `0 25px 50px -12px ${shadowColor}`, // 15
    `0 25px 50px -12px ${shadowColor}`, // 16
    `0 25px 50px -12px ${shadowColor}`, // 17
    `0 25px 50px -12px ${shadowColor}`, // 18
    `0 25px 50px -12px ${shadowColor}`, // 19
    `0 25px 50px -12px ${shadowColor}`, // 20
    `0 25px 50px -12px ${shadowColor}`, // 21
    `0 25px 50px -12px ${shadowColor}`, // 22
    `0 25px 50px -12px ${shadowColor}`, // 23
    `0 25px 50px -12px ${shadowColor}`, // 24
  ] as Shadows;
};

export default function MUIProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useAppTheme();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#6366F1',
            light: '#818CF8',
            dark: '#4F46E5',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#64748B',
            light: '#94A3B8',
            dark: '#475569',
            contrastText: '#FFFFFF',
          },
          error: {
            main: '#EF4444',
            light: '#FCA5A5',
            dark: '#DC2626',
            contrastText: '#FFFFFF',
          },
          warning: {
            main: '#F59E0B',
            light: '#FCD34D',
            dark: '#D97706',
            contrastText: '#FFFFFF',
          },
          success: {
            main: '#10B981',
            light: '#6EE7B7',
            dark: '#059669',
            contrastText: '#FFFFFF',
          },
          info: {
            main: '#3B82F6',
            light: '#93C5FD',
            dark: '#2563EB',
            contrastText: '#FFFFFF',
          },
          background: {
            default: isDarkMode ? '#0F172A' : '#FAFAFA',
            paper: isDarkMode ? '#1E293B' : '#FFFFFF',
          },
          text: {
            primary: isDarkMode ? '#F8FAFC' : '#111827',
            secondary: isDarkMode ? '#94A3B8' : '#6B7280',
            disabled: isDarkMode ? '#64748B' : '#9CA3AF',
          },
          divider: isDarkMode ? '#334155' : '#E5E7EB',
        },
        shadows: createShadows(isDarkMode),
        shape: {
          borderRadius: 8,
        },
        typography: {
          fontFamily: 'var(--font-body), system-ui, sans-serif',
          h1: {
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          },
          h2: {
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.33,
            letterSpacing: '-0.01em',
          },
          h3: {
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h4: {
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.44,
          },
          h5: {
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5,
          },
          h6: {
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.5,
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarColor: isDarkMode ? '#334155 transparent' : '#D1D5DB transparent',
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                  width: 8,
                  height: 8,
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                  borderRadius: 4,
                  backgroundColor: isDarkMode ? '#334155' : '#D1D5DB',
                },
                '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
              },
            },
          },
          MuiButton: {
            defaultProps: {
              disableElevation: true,
            },
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
                padding: '10px 20px',
                fontSize: '0.875rem',
                transition: 'all 150ms ease',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                },
              },
              outlined: {
                borderWidth: 1,
                '&:hover': {
                  borderWidth: 1,
                },
              },
              sizeLarge: {
                padding: '12px 24px',
                fontSize: '1rem',
              },
              sizeSmall: {
                padding: '6px 16px',
                fontSize: '0.8125rem',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`,
                boxShadow: 'none',
                transition: 'box-shadow 200ms ease, transform 200ms ease',
                '&:hover': {
                  boxShadow: isDarkMode
                    ? '0 4px 6px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`,
                boxShadow: 'none',
              },
              elevation1: {
                boxShadow: 'none',
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: 'outlined',
              size: 'medium',
            },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  '& fieldset': {
                    borderColor: isDarkMode ? '#334155' : '#E5E7EB',
                    transition: 'border-color 150ms ease',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366F1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366F1',
                    borderWidth: 2,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F9FAFB',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? '#94A3B8' : '#6B7280',
                  '&.Mui-focused': {
                    color: '#6366F1',
                  },
                },
                '& .MuiInputBase-input': {
                  '&::placeholder': {
                    color: isDarkMode ? '#64748B' : '#9CA3AF',
                    opacity: 1,
                  },
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 16,
                border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`,
                boxShadow: isDarkMode
                  ? '0 20px 25px -5px rgba(0,0,0,0.4)'
                  : '0 20px 25px -5px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          },
          MuiDialogContent: {
            styleOverrides: {
              root: {
                padding: '20px 24px',
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                padding: '16px 24px 24px',
                gap: 8,
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                transition: 'all 150ms ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                transition: 'all 150ms ease',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                fontWeight: 500,
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                border: 'none',
              },
              standardSuccess: {
                backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5',
                color: isDarkMode ? '#A7F3D0' : '#065F46',
              },
              standardError: {
                backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                color: isDarkMode ? '#FCA5A5' : '#991B1B',
              },
              standardWarning: {
                backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7',
                color: isDarkMode ? '#FCD34D' : '#92400E',
              },
              standardInfo: {
                backgroundColor: isDarkMode ? '#1E3A8A' : '#DBEAFE',
                color: isDarkMode ? '#93C5FD' : '#1E40AF',
              },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: {
                width: 44,
                height: 24,
                padding: 0,
              },
              switchBase: {
                padding: 2,
                '&.Mui-checked': {
                  transform: 'translateX(20px)',
                  color: '#FFFFFF', // ensure thumb is visible on dark backgrounds
                  '& + .MuiSwitch-track': {
                    backgroundColor: isDarkMode ? '#6E57F8' : '#6366F1',
                    opacity: 1,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : undefined,
                  },
                },
              },
              thumb: {
                width: 20,
                height: 20,
                boxShadow: 'none',
                backgroundColor: isDarkMode ? '#FFFFFF' : undefined,
              },
              track: {
                borderRadius: 12,
                backgroundColor: isDarkMode ? '#475569' : '#D1D5DB',
                opacity: 1,
                border: isDarkMode ? '1px solid rgba(255,255,255,0.03)' : undefined,
              },
            },
          },
          MuiCheckbox: {
            styleOverrides: {
              root: {
                padding: 8,
                '& .MuiSvgIcon-root': {
                  fontSize: 20,
                },
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 8,
                padding: '10px 16px',
                transition: 'all 150ms ease',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              },
            },
          },
          MuiToggleButtonGroup: {
            styleOverrides: {
              root: {
                gap: 8,
                '& .MuiToggleButtonGroup-grouped': {
                  margin: 0,
                  border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`,
                  borderRadius: 8,
                  '&.Mui-selected': {
                    borderColor: '#6366F1',
                  },
                },
              },
            },
          },
          MuiBottomNavigation: {
            styleOverrides: {
              root: {
                height: 64,
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderTop: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`,
              },
            },
          },
          MuiBottomNavigationAction: {
            styleOverrides: {
              root: {
                '&.Mui-selected': {
                  color: '#6366F1',
                },
              },
            },
          },
          MuiSnackbar: {
            styleOverrides: {
              root: {
                '& .MuiAlert-root': {
                  borderRadius: 8,
                  boxShadow: isDarkMode
                    ? '0 10px 15px -3px rgba(0,0,0,0.4)'
                    : '0 10px 15px -3px rgba(0,0,0,0.1)',
                },
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  // Keep CSS variables and color-scheme in sync with the MUI theme so global styles and Tailwind dark variants match.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Map important tokens to CSS variables used in globals.css
    root.style.setProperty('--color-bg-primary', theme.palette.background.default || (isDarkMode ? '#0F172A' : '#FAFAFA'));
    root.style.setProperty('--color-bg-secondary', theme.palette.background.paper || (isDarkMode ? '#1E293B' : '#FFFFFF'));
    root.style.setProperty('--color-text-primary', (theme.palette.text.primary as string) || (isDarkMode ? '#F8FAFC' : '#111827'));
    root.style.setProperty('--color-text-secondary', (theme.palette.text.secondary as string) || (isDarkMode ? '#94A3B8' : '#6B7280'));
    root.style.setProperty('--color-border-subtle', (theme.palette.divider as string) || (isDarkMode ? '#334155' : '#E5E7EB'));
    root.style.setProperty('--color-border-default', isDarkMode ? '#475569' : '#D1D5DB');
    root.style.setProperty('--color-primary', theme.palette.primary.main || '#6366F1');
    root.style.setProperty('--color-primary-bg', theme.palette.primary.light || '#EEF2FF');

    // Set color-scheme on the root for form controls and scrollbar defaults
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [theme, isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
