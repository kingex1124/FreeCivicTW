import { PageIntro } from '@/View/SiteView';
import { ElectionView } from '@/View/ElectionView';
import { SeoService } from '@/Service/SeoService';
import { ElectionService } from '@/Service/ElectionService';
export const metadata = SeoService.metadata({
  title: '我能選哪些職務',
  description:
    '依戶籍地認識中央與地方的民選職務、能做的事情與權力界線。原住民選舉的完整比較另收錄於「看更多」。',
  path: '/my-ballots/',
  updatedAt: ElectionService.getRules().checkedAt,
});
export default function BallotsPage() {
  return (
    <>
      <PageIntro
        eyebrow="我的選票指南 / FIND YOUR VOICE"
        title="我的一張票，選出了什麼？"
        description="從戶籍地出發，分開看中央與地方的民選職務。這是制度指南，實際投票資格仍依當次選務公告。"
      />
      <ElectionView />
    </>
  );
}
