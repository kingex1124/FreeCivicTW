import raw from '@data/site.json';
import { SiteSchema } from '@/Model/SiteModel';
import type { ColorTheme } from '@/Model/SiteModel';
const site = SiteSchema.parse(raw);
const themeKey = 'fc-color-theme';
export const SiteRepository = {
  get: () => site,
  copyEmail() {
    return navigator.clipboard.writeText(site.contact.email);
  },
  readTheme(): ColorTheme {
    try {
      return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },
  saveTheme(value: ColorTheme) {
    try {
      localStorage.setItem(themeKey, value);
    } catch {
      /* Preference remains usable in this visit. */
    }
  },
  themeInitializationScript() {
    return `(function(){var theme='light';try{if(localStorage.getItem(${JSON.stringify(themeKey)})==='dark')theme='dark';}catch{}document.documentElement.dataset.theme=theme;})();`;
  },
};
