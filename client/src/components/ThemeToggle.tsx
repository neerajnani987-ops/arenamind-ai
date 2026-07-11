import React, { useEffect, useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = React.memo(() => {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('arenamind_theme');
    if (theme === 'light') {
      setIsLight(true);
      document.body.classList.add('light');
      document.documentElement.classList.add('light');
    } else {
      setIsLight(false);
      document.body.classList.remove('light');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsLight((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('light');
        document.documentElement.classList.add('light');
        localStorage.setItem('arenamind_theme', 'light');
      } else {
        document.body.classList.remove('light');
        document.documentElement.classList.remove('light');
        localStorage.setItem('arenamind_theme', 'dark');
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full glass-panel hover:bg-white/10 text-indigo-400 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Toggle Theme"
      id="theme-toggler"
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
export default ThemeToggle;
