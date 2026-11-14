import { PageIntro } from '@/View/SiteView';
import { GovernmentView } from '@/View/GovernmentView';
import { CivicService } from '@/Service/CivicService';
import { SeoService } from '@/Service/SeoService';
import { getAgencyDirectory } from '@/Service/AgencyService';
import { LegislationService } from '@/Service/LegislationService';
import { ParticipationService } from '@/Service/ParticipationService';
import { SourceService } from '@/Service/SourceService';
import { SiteService } from '@/Service/SiteService';
import { TopicContentView } from '@/View/TopicContentView';

const legislation = LegislationService.get();
const participation = ParticipationService.get();
export const metadata = SeoService.metadata({
  title: '政府怎麼運作',
  description:
    '認識中央地方政府職責、立法、人事與監督，以及全國和地方公投、立委與地方公職罷免、總統副總統罷免的資格、程序與效果。',
  path: '/government/',
  updatedAt: participation.checkedAt,
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
            name: '政府怎麼運作：中央地方職責、立法、公投與罷免',
            url: SiteService.absolute('/government/'),
            inLanguage: 'zh-TW',
            dateModified: participation.checkedAt,
            isAccessibleForFree: true,
            learningResourceType: '政府制度與立法程序說明',
            about: [
              '中央與地方政府',
              '立法院立法程序',
              '地方議會立法程序',
              '行政院覆議',
              '自治條例',
              '憲法審查',
              '全國性公民投票',
              '地方性公民投票',
              '公職人員罷免',
              '總統副總統罷免',
            ],
            citation: SourceService.resolve([
              ...new Set([...LegislationService.sourceIds(), ...ParticipationService.sourceIds()]),
            ]).map((source) => source.url),
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
            returnLink={{ href: '#government-topics', label: '↑ 回到目錄' }}
          />
        ))}
        participation={participation.topics.map((topic) => (
          <TopicContentView
            key={topic.id}
            topic={topic}
            checkedAt={participation.checkedAt}
            returnLink={{ href: '#government-topics', label: '↑ 回到目錄' }}
          />
        ))}
      />
    </>
  );
}
