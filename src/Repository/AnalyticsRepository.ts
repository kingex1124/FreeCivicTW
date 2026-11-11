import { sendGAEvent } from '@next/third-parties/google';
import { SiteConfig } from '@/Config/SiteConfig';
import type { AnalyticsEvent, AnalyticsParameters, Consent } from '@/Model/AnalyticsModel';
let inMemoryConsent: Consent | undefined;
let previousLocation = '';
export const AnalyticsRepository = {
  readConsent(): Consent {
    if (inMemoryConsent) return inMemoryConsent;
    try {
      const value = localStorage.getItem('fc-consent');
      return value === 'accepted' || value === 'rejected' ? value : 'unknown';
    } catch {
      return 'unknown';
    }
  },
  writeConsent(value: Consent) {
    inMemoryConsent = value;
    try {
      localStorage.setItem('fc-consent', value);
    } catch {
      /* Consent is also held in the current component. */
    }
  },
  applyConsent(value: Consent) {
    if (typeof window === 'undefined') return;
    Reflect.set(window, `ga-disable-${SiteConfig.gaId}`, value !== 'accepted');
    window.gtag?.('consent', 'update', {
      analytics_storage: value === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    if (value !== 'accepted') {
      const domains = location.hostname.split('.').map((_, i, parts) => parts.slice(i).join('.'));
      const paths = new Set(['/', SiteConfig.basePath || '/']);
      for (const item of document.cookie.split(';')) {
        const name = item.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const path of paths) {
          document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
          for (const domain of domains)
            document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}; SameSite=Lax`;
        }
      }
    }
  },
  prepare() {
    window.dataLayer ??= [];
    const locationSafe = location.origin + location.pathname;
    previousLocation = locationSafe;
    let referrerSafe = '';
    try {
      const url = new URL(document.referrer);
      referrerSafe = url.origin + url.pathname;
    } catch {
      /* Direct visit. */
    }
    window.dataLayer.push([
      'set',
      {
        page_location: locationSafe,
        page_referrer: referrerSafe,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    ]);
    window.dataLayer.push([
      'consent',
      'default',
      {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    ]);
  },
  routeChanged() {
    const current = location.origin + location.pathname;
    if (current === previousLocation) return;
    window.dataLayer ??= [];
    window.dataLayer.push(['set', { page_location: current, page_referrer: previousLocation }]);
    previousLocation = current;
  },
  send(event: AnalyticsEvent, parameters: AnalyticsParameters) {
    sendGAEvent('event', event, parameters);
  },
};
