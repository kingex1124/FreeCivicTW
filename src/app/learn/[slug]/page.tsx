import { notFound } from 'next/navigation';
import { PageIntro } from '@/View/SiteView';
import { ArticleView } from '@/View/LearningView';
import { LearningService } from '@/Service/LearningService';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
import type { ArticleRouteProps } from '@/Model/LearningModel';
export const dynamicParams = false;
export function generateStaticParams() {
  return LearningService.getArticles().map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = LearningService.getArticle(slug);
  return article
    ? SeoService.metadata({
        title: article.title,
        description: article.summary,
        path: `/learn/${article.slug}/`,
        type: 'article',
        updatedAt: article.updatedAt,
      })
    : {};
}
export default async function ArticlePage({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = LearningService.getArticle(slug);
  if (!article) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: SeoService.json({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.summary,
            inLanguage: 'zh-Hant',
            dateModified: article.updatedAt,
            mainEntityOfPage: SiteService.absolute(`/learn/${slug}/`),
          }),
        }}
      />
      <PageIntro
        eyebrow={`入門筆記 ${String(article.order).padStart(2, '0')} · 約 ${article.minutes} 分鐘`}
        title={article.title}
        description={article.summary}
      />
      <ArticleView article={article} />
    </>
  );
}
