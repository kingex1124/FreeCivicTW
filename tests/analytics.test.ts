import test from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsService } from '@/Service/AnalyticsService';
import { AnalyticsRepository } from '@/Repository/AnalyticsRepository';
import type { AnalyticsEvent, AnalyticsParameters } from '@/Model/AnalyticsModel';

test('分析事件只能在啟用且同意時發送，額外與敏感參數不會穿透', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const configured = AnalyticsService.configured;
  const consent = AnalyticsRepository.readConsent;
  const send = AnalyticsRepository.send;
  const sent: { event: AnalyticsEvent; params: AnalyticsParameters }[] = [];
  try {
    Reflect.set(globalThis, 'window', {});
    AnalyticsService.configured = () => true;
    AnalyticsRepository.readConsent = () => 'accepted';
    AnalyticsRepository.send = (event, params) => {
      sent.push({ event, params });
    };
    AnalyticsService.track(
      'ballot_lookup_complete',
      Object.assign(
        { content_id: 'public-lesson', step: 2 },
        { county: '苗栗縣', identity: 'mountain', email: 'private@example.test', answer: 'a' },
      ),
    );
    assert.deepEqual(sent, [
      { event: 'ballot_lookup_complete', params: { content_id: 'public-lesson', step: 2 } },
    ]);
    AnalyticsService.track('role_card_open', {
      content_id: 'hello?email=private@example.test',
      step: -1,
    });
    assert.deepEqual(sent[1].params, {});
    AnalyticsRepository.readConsent = () => 'rejected';
    AnalyticsService.track('lesson_complete');
    AnalyticsRepository.readConsent = () => 'unknown';
    AnalyticsService.track('lesson_complete');
    AnalyticsRepository.readConsent = () => 'accepted';
    AnalyticsService.configured = () => false;
    AnalyticsService.track('lesson_complete');
    AnalyticsService.configured = () => true;
    Reflect.apply(AnalyticsService.track, AnalyticsService, ['not-an-allowed-event', {}]);
    assert.equal(sent.length, 2);
  } finally {
    AnalyticsService.configured = configured;
    AnalyticsRepository.readConsent = consent;
    AnalyticsRepository.send = send;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
