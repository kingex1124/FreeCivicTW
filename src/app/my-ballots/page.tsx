import { PageIntro } from '@/View/SiteView';
import { ElectionView } from '@/View/ElectionView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '我能選哪些職務',
  description: '依戶籍縣市與鄉鎮市區，認識總統、立委及地方選舉的職務種類，分清一般區與自治區。',
  path: '/my-ballots/',
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
