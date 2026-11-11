export type Consent = 'unknown' | 'accepted' | 'rejected';
export const AnalyticsEvents = [
  'learning_path_start',
  'lesson_complete',
  'ballot_lookup_complete',
  'role_card_open',
  'media_exercise_complete',
  'source_link_open',
] as const;
export type AnalyticsEvent = (typeof AnalyticsEvents)[number];
export type AnalyticsParameters = { content_id?: string; step?: number };
export type AnalyticsCommand = [string, ...unknown[]];
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
