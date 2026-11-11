import { PageIntro } from '@/View/SiteView';
import { SourcesPage } from '@/View/SourceCatalogView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '來源與更正',
  description: '查閱 FreeCivicTW 使用的官方法規、選務、行政區與媒體素養資料，以及內容更正紀錄。',
  path: '/sources/',
});
export default function Sources() {
  return (
    <>
      <PageIntro
        eyebrow="來源與更正 / CHECK THE SOURCE"
        title="每一個解釋，都應該有依據。"
        description="我們盡力說清楚，也保留被修正的空間。你可以沿著來源，自己再看一次。"
      />
      <SourcesPage />
    </>
  );
}
