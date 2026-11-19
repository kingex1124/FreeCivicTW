import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { AboutView } from '@/View/AboutView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadataFor('/about/');
export default function AboutPage() {
  return (
    <>
      <StructuredData path="/about/" />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/about/" />}
        eyebrow="關於本站 / A SMALL START"
        title="從一個小小的想法開始。"
        description="希望每個人都能看懂一點、參與一點，也願意為眼前的訊息多找一份證據。"
      />
      <AboutView />
    </>
  );
}
