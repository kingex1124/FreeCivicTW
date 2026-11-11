import { PageIntro } from '@/View/SiteView';
import { AboutView } from '@/View/AboutView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '關於與聯絡',
  description:
    'FreeCivicTW 的開發初衷：讓沒有公民基礎的人，也能理解台灣民主並學會查證。歡迎提供內容更正與建議。',
  path: '/about/',
});
export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="關於本站 / A SMALL START"
        title="從一個小小的想法開始。"
        description="希望每個人都能看懂一點、參與一點，也願意為眼前的訊息多找一份證據。"
      />
      <AboutView />
    </>
  );
}
