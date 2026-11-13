'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnalyticsService } from '@/Service/AnalyticsService';

export function AnalyticsView() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function initialize() {
      if (!AnalyticsService.configured()) return;
      AnalyticsService.prepare();
      setReady(true);
    }
    initialize();
  }, []);
  useEffect(() => {
    if (ready) AnalyticsService.routeChanged();
  }, [pathname, ready]);
  return ready ? (
    <Script id="google-tag" src={AnalyticsService.scriptUrl()} strategy="afterInteractive" />
  ) : null;
}
