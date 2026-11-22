import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { GovernmentView } from '@/View/GovernmentView';
import { CivicService } from '@/Service/CivicService';
import { SeoService } from '@/Service/SeoService';
import { getAgencyDirectory } from '@/Service/AgencyService';
import { LegislationService } from '@/Service/LegislationService';
import { ParticipationService } from '@/Service/ParticipationService';
import { CabinetConfidenceService } from '@/Service/CabinetConfidenceService';
import { SourceService } from '@/Service/SourceService';
import { TopicContentView } from '@/View/TopicContentView';

const legislation = LegislationService.get();
const participation = ParticipationService.get();
const confidence = CabinetConfidenceService.get();
export const metadata = SeoService.metadataFor('/government/');
export default function GovernmentPage() {
  return (
    <>
      <StructuredData
        path="/government/"
        details={{
          name: '政府怎麼運作：中央地方職責、立法、倒閣與公民參與',
          learningResourceType: '政府制度與立法程序說明',
          about: [
            '中央與地方政府',
            '立法院立法程序',
            '地方議會立法程序',
            '行政院覆議',
            '不信任案與倒閣',
            '解散立法院與國會重選',
            '中央與地方政治責任',
            '自治條例',
            '憲法審查',
            '全國性公民投票',
            '地方性公民投票',
            '公職人員罷免',
            '總統副總統罷免',
          ],
          citation: SourceService.resolve([
            ...new Set([
              ...CivicService.get().roles.flatMap((role) => role.sourceIds),
              ...getAgencyDirectory().entries.flatMap((entry) => entry.sourceIds),
              ...LegislationService.sourceIds(),
              ...ParticipationService.sourceIds(),
              ...CabinetConfidenceService.sourceIds(),
            ]),
          ]).map((source) => source.url),
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/government/" />}
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
        confidence={
          <TopicContentView
            topic={confidence.topic}
            checkedAt={confidence.checkedAt}
            returnLink={{ href: '#government-topics', label: '↑ 回到目錄' }}
          />
        }
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
