import { CivicIslandView } from '@/View/CivicIslandView';
import { IslandService } from '@/Service/IslandService';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
import { SourceService } from '@/Service/SourceService';
const data = IslandService.get();
export const metadata = SeoService.metadata({
  title: '公民島',
  description:
    '探索五座制度島嶼：中央政府、地方政府、法院、檢察與警察。點建築認識職責，用任命、監督及刑事案件情境看懂機關之間的互動。',
  path: '/civic-island/',
  updatedAt: data.checkedAt,
});
export default function CivicIslandPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: SeoService.json({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: '公民島：用互動島嶼理解政府與司法',
            url: SiteService.absolute('/civic-island/'),
            inLanguage: 'zh-TW',
            isAccessibleForFree: true,
            dateModified: data.checkedAt,
            learningResourceType: '互動公民教育',
            about: data.groups.map((group) => group.name),
            citation: SourceService.resolve([
              ...new Set(data.nodes.flatMap((node) => node.sourceIds)),
            ]).map((source) => source.url),
          }),
        }}
      />
      <CivicIslandView data={data} />
    </>
  );
}
