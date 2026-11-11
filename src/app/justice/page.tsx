import { PageIntro } from '@/View/SiteView';
import { JusticeView } from '@/View/JusticeView';
import { JusticeService } from '@/Service/JusticeService';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
import { SourceService } from '@/Service/SourceService';

const data = JusticeService.get();
export const metadata = SeoService.metadata({
  title: data.title,
  description: data.description,
  path: '/justice/',
  updatedAt: data.checkedAt,
});
export default function JusticePage() {
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
            url: SiteService.absolute('/justice/'),
            inLanguage: 'zh-TW',
            dateModified: data.checkedAt,
            isAccessibleForFree: true,
            learningResourceType: '司法制度與刑事程序入門',
            about: ['司法獨立', '法院', '檢察官', '警察', '刑事訴訟', '按鈴申告'],
            citation: SourceService.resolve(JusticeService.sourceIds(data)).map(
              (source) => source.url,
            ),
            publisher: { '@type': 'Organization', name: 'FreeCivicTW 公民自由課' },
          }),
        }}
      />
      <PageIntro
        eyebrow="司法與警檢 / JUSTICE & YOUR RIGHTS"
        title="誰來調查，誰來起訴，誰來判？"
        description={data.description}
      />
      <JusticeView data={data} />
    </>
  );
}
