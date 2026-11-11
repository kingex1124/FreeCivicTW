import { PageIntro } from '@/View/SiteView';
import { MediaLiteracyIndexView } from '@/View/MediaLiteracyView';
import { SeoService } from '@/Service/SeoService';
export const metadata = SeoService.metadata({
  title: '媒體識讀練習',
  description: '用六個虛構情境練習看標題、找日期、讀前後文、理解圖表與核對影像來源。',
  path: '/media-literacy/',
});
export default function MediaPage() {
  return (
    <>
      <PageIntro
        eyebrow="媒體識讀 / PAUSE BEFORE YOU SHARE"
        title="先停一下，再多看一眼。"
        description="每天遇見那麼多訊息，不必急著分真假。從找來源、看脈絡開始，練習用證據做判斷。"
      />
      <MediaLiteracyIndexView />
    </>
  );
}
