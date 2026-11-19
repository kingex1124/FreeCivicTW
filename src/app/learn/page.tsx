import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { LearningIndexView } from '@/View/LearningView';
import { SeoService } from '@/Service/SeoService';
import { LearningService } from '@/Service/LearningService';
import { SiteService } from '@/Service/SiteService';
export const metadata = SeoService.metadataFor('/learn/');
export default function LearnPage() {
  return (
    <>
      <StructuredData
        path="/learn/"
        details={{
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: LearningService.getArticles().length,
            itemListElement: LearningService.getArticles().map((article, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: article.title,
              url: SiteService.absolute(`/learn/${article.slug}/`),
            })),
          },
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/learn/" />}
        eyebrow="公民入門 / YOUR FIRST CHAPTER"
        title="不必先懂政治，也能開始理解。"
        description="把複雜的制度拆成生活裡的小問題。先看重點，再照自己的步調往下讀。"
      />
      <LearningIndexView />
    </>
  );
}
