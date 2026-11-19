import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { MediaLiteracyIndexView } from '@/View/MediaLiteracyView';
import { SeoService } from '@/Service/SeoService';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { SiteService } from '@/Service/SiteService';
export const metadata = SeoService.metadataFor('/media-literacy/');
export default function MediaPage() {
  return (
    <>
      <StructuredData
        path="/media-literacy/"
        details={{
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: MediaLiteracyService.getScenarios().length,
            itemListElement: MediaLiteracyService.getScenarios().map((scenario, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: scenario.title,
              url: SiteService.absolute(`/media-literacy/${scenario.slug}/`),
              description: '虛構教學情境，非真實事件。',
            })),
          },
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/media-literacy/" />}
        eyebrow="媒體識讀 / PAUSE BEFORE YOU SHARE"
        title="先停一下，再多看一眼。"
        description="每天遇見那麼多訊息，不必急著分真假。從找來源、看脈絡開始，練習用證據做判斷。"
      />
      <MediaLiteracyIndexView />
    </>
  );
}
