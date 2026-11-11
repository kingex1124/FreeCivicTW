import type { Metadata, Viewport } from 'next';
import { SiteService } from '@/Service/SiteService';
import { SeoService } from '@/Service/SeoService';
import { NavigationView } from '@/View/NavigationView';
import { BackToTop, Footer } from '@/View/SiteView';
import { AnalyticsView } from '@/View/AnalyticsView';
import type { ChildrenProps } from '@/Model/UiModel';
import './globals.css';
const site = SiteService.get();
export const metadata: Metadata = {
  ...SeoService.metadata({
    title: '公民自由課｜從生活出發，看懂台灣民主',
    description: site.description,
    path: '/',
  }),
  title: {
    default: '公民自由課｜從生活出發，看懂台灣民主',
    template: '%s｜公民自由課 FreeCivicTW',
  },
  metadataBase: new URL(SiteService.absolute('/')),
  icons: { icon: [{ url: SiteService.asset('/Images/Site/favicon.svg'), type: 'image/svg+xml' }] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7f8f2' };
export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html
      lang="zh-Hant"
      data-scroll-behavior="smooth"
      data-motion="full"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-preference"
          dangerouslySetInnerHTML={{ __html: SiteService.themeInitializationScript() }}
        />
      </head>
      <body id="page-top" tabIndex={-1}>
        <a href="#main-content" className="skip-link">
          跳到主要內容
        </a>
        <NavigationView />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <BackToTop />
        <AnalyticsView />
      </body>
    </html>
  );
}
