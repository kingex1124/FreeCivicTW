import { AnalyticsRepository } from '@/Repository/AnalyticsRepository';
import { SiteConfig } from '@/Config/SiteConfig';
import type { AnalyticsEvent, AnalyticsParameters } from '@/Model/AnalyticsModel';
import { AnalyticsEvents } from '@/Model/AnalyticsModel';
export const AnalyticsService = {
  configured: () =>
    SiteConfig.analyticsEnabled &&
    /^GTM-[A-Z0-9]+$/.test(SiteConfig.gtmId) &&
    /^G-[A-Z0-9]+$/.test(SiteConfig.gaId),
  gaId: () => SiteConfig.gaId,
  scriptUrl: () => `https://www.googletagmanager.com/gtm.js?id=${SiteConfig.gtmId}`,
  prepare: AnalyticsRepository.prepare,
  routeChanged: AnalyticsRepository.routeChanged,
  track(event: AnalyticsEvent, parameters: AnalyticsParameters = {}) {
    if (
      typeof window === 'undefined' ||
      !AnalyticsEvents.includes(event) ||
      !AnalyticsService.configured()
    )
      return;
    const allowed: AnalyticsParameters = {};
    if (parameters.content_id && /^[a-z0-9-]{1,80}$/.test(parameters.content_id))
      allowed.content_id = parameters.content_id;
    if (
      typeof parameters.step === 'number' &&
      Number.isInteger(parameters.step) &&
      parameters.step >= 0 &&
      parameters.step <= 100
    )
      allowed.step = parameters.step;
    AnalyticsRepository.send(event, allowed);
  },
};
