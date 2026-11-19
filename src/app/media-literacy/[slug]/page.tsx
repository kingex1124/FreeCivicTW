import { notFound } from 'next/navigation';
import { PageIntro } from '@/View/SiteView';
import { MediaExerciseView } from '@/View/MediaExerciseView';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { SeoService } from '@/Service/SeoService';
import { Breadcrumbs, StructuredData } from '@/View/SeoView';
import { SourceService } from '@/Service/SourceService';
import type { ArticleRouteProps } from '@/Model/LearningModel';
export const dynamicParams = false;
export function generateStaticParams() {
  return MediaLiteracyService.getScenarios().map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const scenario = MediaLiteracyService.getScenario(slug);
  return scenario ? SeoService.metadataFor(`/media-literacy/${slug}/`) : {};
}
export default async function PracticePage({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const scenario = MediaLiteracyService.getScenario(slug);
  if (!scenario) notFound();
  return (
    <>
      <StructuredData
        path={`/media-literacy/${slug}/`}
        details={{
          learningResourceType: '虛構媒體識讀練習',
          teaches: scenario.skill,
          genre: '虛構教學情境，非真實事件',
          citation: SourceService.resolve(['media-education']).map((source) => source.url),
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path={`/media-literacy/${slug}/`} />}
        eyebrow="媒體識讀練習 / FOLLOW THE EVIDENCE"
        title={scenario.title}
        description="先看訊息，再打開證據。你可以修正答案，也可以直接閱讀解析。"
      />
      <MediaExerciseView scenario={scenario} nextSlug={MediaLiteracyService.next(slug)} />
    </>
  );
}
