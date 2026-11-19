import { notFound } from 'next/navigation';
import { PageIntro } from '@/View/SiteView';
import { ArticleView } from '@/View/LearningView';
import { LearningService } from '@/Service/LearningService';
import { SeoService } from '@/Service/SeoService';
import { SourceService } from '@/Service/SourceService';
import { SiteService } from '@/Service/SiteService';
import { Breadcrumbs, StructuredData } from '@/View/SeoView';
import type { ArticleRouteProps } from '@/Model/LearningModel';
export const dynamicParams = false;
export function generateStaticParams() {
  return LearningService.getArticles().map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = LearningService.getArticle(slug);
  return article ? SeoService.metadataFor(`/learn/${article.slug}/`) : {};
}
export default async function ArticlePage({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = LearningService.getArticle(slug);
  if (!article) notFound();
  return (
    <>
      <StructuredData
        path={`/learn/${slug}/`}
        details={{
          headline: article.title,
          image: SiteService.absolute('/Images/Site/og-default.png'),
          timeRequired: `PT${article.minutes}M`,
          articleSection: '公民入門',
          citation: SourceService.resolve(article.sourceIds).map((source) => source.url),
          hasPart: article.sections.map((section) => ({
            '@type': 'WebPageElement',
            name: section.title,
            url: SiteService.absolute(`/learn/${slug}/#${section.id}`),
          })),
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path={`/learn/${slug}/`} />}
        eyebrow={`入門筆記 ${String(article.order).padStart(2, '0')} · 約 ${article.minutes} 分鐘`}
        title={article.title}
        description={article.summary}
      />
      <ArticleView article={article} />
    </>
  );
}
