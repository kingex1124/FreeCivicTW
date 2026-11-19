import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { SupplementView } from '@/View/SupplementView';
import { SupplementService } from '@/Service/SupplementService';
import { SeoService } from '@/Service/SeoService';
import { SourceService } from '@/Service/SourceService';

const data = SupplementService.get();
export const metadata = SeoService.metadataFor('/more/');
export default function MorePage() {
  return (
    <>
      <StructuredData
        path="/more/"
        details={{
          name: data.title,
          description: data.description,
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
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/more/" />}
        eyebrow="看更多 / KEEP EXPLORING"
        title="多懂一點，公共議題就清楚一點。"
        description={data.description}
      />
      <SupplementView data={data} indigenous={SupplementService.indigenous()} />
    </>
  );
}
