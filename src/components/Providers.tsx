'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getThemeOptions } from '@/lib/theme';
import { LanguageProvider } from './LanguageProvider';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Load theme preference from localStorage
    const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark';
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      // Optional: follow system preference
      // setMode('light');
    }
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme-mode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = useMemo(() => createTheme(getThemeOptions(mode)), [mode]);

  return (
    <AppRouterCacheProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}
