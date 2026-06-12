'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  switchTheme: () => void;
  isAnimating: boolean;
  setAnimating: (v: boolean) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: 'dark',
  switchTheme: () => {},
  isAnimating: false,
  setAnimating: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isAnimating, setAnimating] = useState(false);

  const switchTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, switchTheme, isAnimating, setAnimating }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
