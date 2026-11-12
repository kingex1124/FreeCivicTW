import { PageIntro } from '@/View/SiteView';
import { GovernmentView } from '@/View/GovernmentView';
import { CivicService } from '@/Service/CivicService';
import { SeoService } from '@/Service/SeoService';
import { getAgencyDirectory } from '@/Service/AgencyService';
import { LegislationService } from '@/Service/LegislationService';
import { SourceService } from '@/Service/SourceService';
import { SiteService } from '@/Service/SiteService';
import { TopicContentView } from '@/View/TopicContentView';

const legislation = LegislationService.get();
export const metadata = SeoService.metadata({
  title: '政府怎麼運作',
  description:
    '透過段落導覽、可搜尋的機關總覽，認識中央地方職責、人事任命、質詢與監督，並閱讀立法院與議會的完整立法、覆議、公布施行及憲法審查程序。',
  path: '/government/',
  updatedAt: legislation.checkedAt,
});
export default function GovernmentPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: SeoService.json({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: '政府怎麼運作：中央地方職責與完整立法程序',
            url: SiteService.absolute('/government/'),
            inLanguage: 'zh-TW',
            dateModified: legislation.checkedAt,
            isAccessibleForFree: true,
            learningResourceType: '政府制度與立法程序說明',
            about: [
              '中央與地方政府',
              '立法院立法程序',
              '地方議會立法程序',
              '行政院覆議',
              '自治條例',
              '憲法審查',
            ],
            citation: SourceService.resolve(LegislationService.sourceIds()).map(
              (source) => source.url,
            ),
          }),
        }}
      />
      <PageIntro
        eyebrow="政府怎麼運作 / CONNECT THE DOTS"
        title="把角色連起來，制度就清楚了。"
        description="誰由人民選出、誰經過任命、誰接受監督？點一個角色，慢慢看懂權力的來源與界線。"
      />
      <GovernmentView
        data={CivicService.get()}
        agencies={getAgencyDirectory()}
        legislation={legislation.topics.map((topic) => (
          <TopicContentView
            key={topic.id}
            topic={topic}
            checkedAt={legislation.checkedAt}
            returnLink={{ href: '#government-topics', label: '回到政府內容導覽 ↑' }}
          />
        ))}
      />
    </>
  );
}
