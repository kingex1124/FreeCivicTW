import { ActionLink, PageIntro } from '@/View/SiteView';
export const metadata = { title: '找不到這頁', robots: { index: false, follow: false } };
export default function NotFound() {
  return (
    <>
      <PageIntro
        eyebrow="404 / 換一條路，一樣可以開始"
        title="這頁好像走遠了。"
        description="可能是網址有誤，或內容已經調整。回到入門筆記，繼續一起看懂一點。"
      />
      <div className="container section-bottom not-found-actions">
        <ActionLink href="/">回到首頁</ActionLink>
        <ActionLink href="/learn/" secondary>
          公民快速入門
        </ActionLink>
      </div>
    </>
  );
}
