'use client';
import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

export const getThemeOptions = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#6366f1', // Indigo 500
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899', // Pink 500
    },
    background: {
      default: mode === 'dark' ? '#0a0a0c' : '#f8fafc',
      paper: mode === 'dark' ? '#141417' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
      secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            boxShadow: mode === 'dark' 
              ? '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
              : '0 4px 14px 0 rgba(99, 102, 241, 0.2)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 6px 20px rgba(99, 102, 241, 0.23)'
                : '0 6px 20px rgba(99, 102, 241, 0.15)',
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          boxShadow: mode === 'light' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.3),
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : 'none',
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
  },
});

const theme = createTheme(getThemeOptions('dark'));
export default theme;
