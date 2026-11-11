import { PageIntro } from '@/View/SiteView';
import { PrivacyView } from '@/View/AboutView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '隱私與分析設定',
  description: '了解本站查詢、作答與分析資料如何處理，並管理或撤回 Google Analytics 使用統計同意。',
  path: '/privacy/',
});
export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        eyebrow="隱私與選擇 / YOUR CHOICE"
        title="你的選擇，應該由你決定。"
        description="閱讀與學習不需要交換個人資料。對使用統計的選擇，也可以隨時更改。"
      />
      <PrivacyView />
    </>
  );
}
