import { PageIntro } from '@/View/SiteView';
import { LearningIndexView } from '@/View/LearningView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '公民快速入門',
  description: '不需要公民基礎，從八篇白話筆記理解台灣民主、中央地方、選票與媒體識讀。',
  path: '/learn/',
});
export default function LearnPage() {
  return (
    <>
      <PageIntro
        eyebrow="公民入門 / YOUR FIRST CHAPTER"
        title="不必先懂政治，也能開始理解。"
        description="把複雜的制度拆成生活裡的小問題。先看重點，再照自己的步調往下讀。"
      />
      <LearningIndexView />
    </>
  );
}
