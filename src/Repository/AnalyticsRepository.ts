import type { AnalyticsEvent, AnalyticsParameters } from '@/Model/AnalyticsModel';
let previousLocation = '';
let initialized = false;
export const AnalyticsRepository = {
  prepare() {
    window.dataLayer ??= [];
    window.gtag ??= function () {
      // Google tag uses IArguments for commands; a rest-parameter array changes that format.
      // eslint-disable-next-line prefer-rest-params -- Preserve the official gtag command format.
      window.dataLayer!.push(arguments);
    };
    const locationSafe = location.origin + location.pathname;
    previousLocation = locationSafe;
    let referrerSafe = '';
    try {
      const url = new URL(document.referrer);
      referrerSafe = url.origin + url.pathname;
    } catch {
      /* Direct visit. */
    }
    if (!initialized) {
      window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
    window.gtag('set', {
      page_location: locationSafe,
      page_referrer: referrerSafe,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    if (!initialized) {
      window.gtag('js', new Date());
      initialized = true;
    }
  },
  routeChanged() {
    const current = location.origin + location.pathname;
    if (current === previousLocation) return;
    window.gtag?.('set', { page_location: current, page_referrer: previousLocation });
    previousLocation = current;
  },
  send(event: AnalyticsEvent, parameters: AnalyticsParameters) {
    window.gtag?.('event', event, parameters);
  },
};
