'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { SiteService } from '@/Service/SiteService';
import type { ColorTheme } from '@/Model/SiteModel';

function displayTheme(theme: ColorTheme) {
  document.documentElement.dataset.theme = theme;
  const background = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ColorTheme>('light');
  useEffect(() => {
    const saved = SiteService.readTheme();
    displayTheme(saved);
    setTheme(saved);
  }, []);
  const label = theme === 'dark' ? '切換淺色模式' : '切換深色模式';
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        displayTheme(next);
        SiteService.saveTheme(next);
        setTheme(next);
      }}
    >
      {theme === 'dark' ? (
        <Sun size={19} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
