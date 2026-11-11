import { notFound } from 'next/navigation';
import { PageIntro } from '@/View/SiteView';
import { MediaExerciseView } from '@/View/MediaExerciseView';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { SeoService } from '@/Service/SeoService';
import type { ArticleRouteProps } from '@/Model/LearningModel';
export const dynamicParams = false;
export function generateStaticParams() {
  return MediaLiteracyService.getScenarios().map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const scenario = MediaLiteracyService.getScenario(slug);
  return scenario
    ? SeoService.metadata({
        title: scenario.title,
        description: scenario.claimToCheck + ' 透過虛構素材練習查證。',
        path: `/media-literacy/${slug}/`,
      })
    : {};
}
export default async function PracticePage({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const scenario = MediaLiteracyService.getScenario(slug);
  if (!scenario) notFound();
  return (
    <>
      <PageIntro
        eyebrow="媒體識讀練習 / FOLLOW THE EVIDENCE"
        title={scenario.title}
        description="先看訊息，再打開證據。你可以修正答案，也可以直接閱讀解析。"
      />
      <MediaExerciseView scenario={scenario} nextSlug={MediaLiteracyService.next(slug)} />
    </>
  );
}
