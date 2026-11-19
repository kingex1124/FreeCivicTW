import { StructuredData } from '@/View/SeoView';
import { CivicIslandView } from '@/View/CivicIslandView';
import { IslandService } from '@/Service/IslandService';
import { SeoService } from '@/Service/SeoService';
import { SourceService } from '@/Service/SourceService';
const data = IslandService.get();
export const metadata = SeoService.metadataFor('/civic-island/');
export default function CivicIslandPage() {
  return (
    <>
      <StructuredData
        path="/civic-island/"
        details={{
          name: '公民島：用互動島嶼理解政府與司法',
          learningResourceType: '互動公民教育',
          about: data.groups.map((group) => group.name),
          citation: SourceService.resolve([
            ...new Set(data.nodes.flatMap((node) => node.sourceIds)),
          ]).map((source) => source.url),
        }}
      />
      <CivicIslandView data={data} />
    </>
  );
}
