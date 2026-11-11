'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { AnalyticsService } from '@/Service/AnalyticsService';
import type { Consent } from '@/Model/AnalyticsModel';
export function AnalyticsView() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>('unknown');
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (ready && consent === 'accepted' && AnalyticsService.configured())
      AnalyticsService.routeChanged();
  }, [pathname, consent, ready]);
  useEffect(() => {
    const load = () => {
      const value = AnalyticsService.readConsent();
      setConsent(value);
      setShow(AnalyticsService.configured() && value === 'unknown');
      if (value === 'accepted' && AnalyticsService.configured()) AnalyticsService.prepare();
      setReady(true);
    };
    load();
    const open = () => setShow(true);
    window.addEventListener('fc-open-consent', open);
    return () => window.removeEventListener('fc-open-consent', open);
  }, []);
  function choose(value: Consent) {
    AnalyticsService.setConsent(value);
    setConsent(value);
    setShow(false);
  }
  return (
    <>
      {ready && consent === 'accepted' && AnalyticsService.configured() && (
        <Script id="google-tag" src={AnalyticsService.scriptUrl()} strategy="afterInteractive" />
      )}{' '}
      {show && (
        <section className="consent-panel" aria-label="使用統計設定">
          <ShieldCheck size={24} />
          <div>
            <h2>一起讓這堂公民課更好</h2>
            <p>
              {AnalyticsService.configured()
                ? '允許使用統計，幫助我們改善教學。不記錄戶籍地、身分情境或答題答案；拒絕也能使用全部功能。'
                : '目前未啟用使用統計。若日後啟用，你仍可以隨時拒絕或撤回同意。'}
            </p>
            <Link href="/privacy/">閱讀隱私說明</Link>
            <div className="consent-actions">
              <button className="button-secondary" onClick={() => choose('rejected')}>
                拒絕／撤回
              </button>
              <button className="button-primary" onClick={() => choose('accepted')}>
                允許使用統計
              </button>
              <button className="quiet-button" onClick={() => setShow(false)}>
                稍後再說
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
export function ConsentSettingsButton() {
  return (
    <button
      className="button-secondary"
      onClick={() => window.dispatchEvent(new Event('fc-open-consent'))}
    >
      管理分析同意
      <ShieldCheck size={17} />
    </button>
  );
}
