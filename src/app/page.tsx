import { HomeView } from '@/View/HomeView';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: SeoService.json({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'FreeCivicTW 公民自由課',
            url: SiteService.absolute('/'),
            inLanguage: 'zh-Hant',
            description: SiteService.get().description,
          }),
        }}
      />
      <HomeView />
    </>
  );
}
