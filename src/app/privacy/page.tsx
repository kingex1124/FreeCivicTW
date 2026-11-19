import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { PrivacyView } from '@/View/AboutView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadataFor('/privacy/');
export default function PrivacyPage() {
  return (
    <>
      <StructuredData path="/privacy/" />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/privacy/" />}
        eyebrow="隱私與使用統計 / PRIVACY"
        title="了解你的資料如何使用。"
        description="閱讀與學習不需登入；這裡說明網站使用統計與資料處理方式。"
      />
      <PrivacyView />
    </>
  );
}
