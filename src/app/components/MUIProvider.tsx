'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ThemeProvider, createTheme, Shadows } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme as useAppTheme } from '../context/ThemeContext';

const createShadows = (isDark: boolean): Shadows => {
  const shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.1)';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: isDarkMode ? '#818CF8' : '#6366F1',
            light: isDarkMode ? '#A5B4FC' : '#818CF8',
            dark: isDarkMode ? '#6366F1' : '#4F46E5',
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
            default: isDarkMode ? '#09090b' : '#FAFAFA',
            paper: isDarkMode ? '#18181b' : '#FFFFFF',
          },
          text: {
            primary: isDarkMode ? '#fafafa' : '#111827',
            secondary: isDarkMode ? '#a1a1aa' : '#6B7280',
            disabled: isDarkMode ? '#71717a' : '#9CA3AF',
          },
          divider: isDarkMode ? '#27272a' : '#E5E7EB',
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
                scrollbarColor: isDarkMode ? '#27272a transparent' : '#D1D5DB transparent',
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                  width: 8,
                  height: 8,
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                  borderRadius: 4,
                  backgroundColor: isDarkMode ? '#27272a' : '#D1D5DB',
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
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? '#27272a' : '#E5E7EB'}`,
                boxShadow: 'none',
                transition: 'box-shadow 200ms ease, transform 200ms ease',
                '&:hover': {
                  boxShadow: isDarkMode
                    ? '0 4px 6px rgba(0,0,0,0.6)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? '#27272a' : '#E5E7EB'}`,
                boxShadow: 'none',
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: 'outlined',
            },
            styleOverrides: {
              root: ({ theme }: any) => ({
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#18181b' : '#FFFFFF',
                  '& fieldset': {
                    borderColor: isDarkMode ? '#27272a' : '#E5E7EB',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }),
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 16,
                border: `1px solid ${isDarkMode ? '#27272a' : '#E5E7EB'}`,
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
              switchBase: ({ theme }: any) => ({
                padding: 2,
                '&.Mui-checked': {
                  transform: 'translateX(20px)',
                  color: '#FFFFFF',
                  '& + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.main,
                    opacity: 1,
                  },
                },
              }),
              thumb: {
                width: 20,
                height: 20,
              },
              track: {
                borderRadius: 12,
                backgroundColor: isDarkMode ? '#3f3f46' : '#D1D5DB',
                opacity: 1,
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    root.style.setProperty('--color-bg-primary', theme.palette.background.default);
    root.style.setProperty('--color-bg-secondary', theme.palette.background.paper);
    root.style.setProperty('--color-text-primary', theme.palette.text.primary as string);
    root.style.setProperty('--color-text-secondary', theme.palette.text.secondary as string);
    root.style.setProperty('--color-border-subtle', theme.palette.divider as string);
    root.style.setProperty('--color-primary', theme.palette.primary.main);
    
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [theme, isDarkMode, mounted]);

  // Prevent hydration mismatch by rendering nothing (or a skeleton) until mounted
  if (!mounted) {
    return null; 
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}