import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { JusticeView } from '@/View/JusticeView';
import { JusticeService } from '@/Service/JusticeService';
import { SeoService } from '@/Service/SeoService';
import { SourceService } from '@/Service/SourceService';

const data = JusticeService.get();
export const metadata = SeoService.metadataFor('/justice/');
export default function JusticePage() {
  return (
    <>
      <StructuredData
        path="/justice/"
        details={{
          name: data.title,
          description: data.description,
          learningResourceType: '司法制度與刑事程序入門',
          about: [
            '司法獨立',
            '法院',
            '檢察官',
            '警察',
            '刑事訴訟',
            '羈押',
            '交保',
            '抗告',
            '電子監控',
            '按鈴申告',
          ],
          citation: SourceService.resolve(JusticeService.sourceIds(data)).map(
            (source) => source.url,
          ),
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/justice/" />}
        eyebrow="司法與警檢 / JUSTICE & YOUR RIGHTS"
        title="誰來調查，誰來起訴，誰來判？"
        description={data.description}
      />
      <JusticeView data={data} />
    </>
  );
}
