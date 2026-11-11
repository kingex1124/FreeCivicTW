import { PageIntro } from '@/View/SiteView';
import { GovernmentView } from '@/View/GovernmentView';
import { CivicService } from '@/Service/CivicService';
import { SeoService } from '@/Service/SeoService';
import { getAgencyDirectory } from '@/Service/AgencyService';
export const metadata = SeoService.metadata({
  title: '政府怎麼運作',
  description:
    '用可搜尋、展開收合的機關職責總覽，認識中央地方機關、任用、質詢、選民服務與法定監督的分工。',
  path: '/government/',
});
export default function GovernmentPage() {
  return (
    <>
      <PageIntro
        eyebrow="政府怎麼運作 / CONNECT THE DOTS"
        title="把角色連起來，制度就清楚了。"
        description="誰由人民選出、誰經過任命、誰接受監督？點一個角色，慢慢看懂權力的來源與界線。"
      />
      <GovernmentView data={CivicService.get()} agencies={getAgencyDirectory()} />
    </>
  );
}
