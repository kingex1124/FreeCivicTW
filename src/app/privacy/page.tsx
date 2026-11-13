import { PageIntro } from '@/View/SiteView';
import { PrivacyView } from '@/View/AboutView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '隱私與使用統計',
  description: '了解本站查詢、作答及 Google Analytics 使用統計可能處理的資料。',
  path: '/privacy/',
});
export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        eyebrow="隱私與使用統計 / PRIVACY"
        title="了解你的資料如何使用。"
        description="閱讀與學習不需登入；這裡說明網站使用統計與資料處理方式。"
      />
      <PrivacyView />
    </>
  );
}
