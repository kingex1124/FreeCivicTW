import { PageIntro } from '@/View/SiteView';
import { SupplementView } from '@/View/SupplementView';
import { SupplementService } from '@/Service/SupplementService';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
import { SourceService } from '@/Service/SourceService';

const data = SupplementService.get();
export const metadata = SeoService.metadata({
  title: data.title,
  description: data.description,
  path: '/more/',
  updatedAt: data.checkedAt,
});
export default function MorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: SeoService.json({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: data.title,
            description: data.description,
            url: SiteService.absolute('/more/'),
            inLanguage: 'zh-TW',
            dateModified: data.checkedAt,
            isAccessibleForFree: true,
            learningResourceType: '公民制度補充說明',
            about: [
              '原住民選舉',
              '政治攻防',
              '資訊查證',
              '憲法法庭',
              '人民權利救濟',
              '追訴權時效',
              '權力分立',
            ],
            citation: SourceService.resolve(SupplementService.sourceIds()).map(
              (source) => source.url,
            ),
          }),
        }}
      />
      <PageIntro
        eyebrow="看更多 / KEEP EXPLORING"
        title="多懂一點，公共議題就清楚一點。"
        description={data.description}
      />
      <SupplementView data={data} indigenous={SupplementService.indigenous()} />
    </>
  );
}
