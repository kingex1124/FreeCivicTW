import raw from '@data/site.json';
import { SiteSchema } from '@/Model/SiteModel';
const site = SiteSchema.parse(raw);
export const SiteRepository = {
  get: () => site,
  copyEmail() {
    return navigator.clipboard.writeText(site.contact.email);
  },
  readMotion() {
    try {
      return localStorage.getItem('fc-reduced-motion') === 'true';
    } catch {
      return false;
    }
  },
  saveMotion(value: boolean) {
    try {
      localStorage.setItem('fc-reduced-motion', String(value));
    } catch {
      /* Preference remains usable in this visit. */
    }
  },
};
