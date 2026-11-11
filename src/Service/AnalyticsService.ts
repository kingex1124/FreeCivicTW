import { AnalyticsRepository } from '@/Repository/AnalyticsRepository';
import { SiteConfig } from '@/Config/SiteConfig';
import type { AnalyticsEvent, AnalyticsParameters, Consent } from '@/Model/AnalyticsModel';
import { AnalyticsEvents } from '@/Model/AnalyticsModel';
export const AnalyticsService = {
  configured: () => SiteConfig.analyticsEnabled && /^G-[A-Z0-9]+$/.test(SiteConfig.gaId),
  gaId: () => SiteConfig.gaId,
  readConsent: AnalyticsRepository.readConsent,
  setConsent(value: Consent) {
    AnalyticsRepository.writeConsent(value);
    AnalyticsRepository.applyConsent(value);
  },
  prepare: AnalyticsRepository.prepare,
  routeChanged: AnalyticsRepository.routeChanged,
  track(event: AnalyticsEvent, parameters: AnalyticsParameters = {}) {
    if (
      typeof window === 'undefined' ||
      !AnalyticsEvents.includes(event) ||
      !AnalyticsService.configured() ||
      AnalyticsRepository.readConsent() !== 'accepted'
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
