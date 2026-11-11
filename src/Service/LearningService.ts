import { LearningRepository } from '@/Repository/LearningRepository';
export const LearningService = {
  getArticles: () => [...LearningRepository.getArticles()].sort((a, b) => a.order - b.order),
  getArticle: (slug: string) => LearningRepository.getArticles().find((a) => a.slug === slug),
  getPaths: LearningRepository.getPaths,
  getModules: LearningRepository.getModules,
  neighbors(slug: string) {
    const list = LearningService.getArticles();
    const i = list.findIndex((a) => a.slug === slug);
    return { previous: list[i - 1], next: list[i + 1] };
  },
  quickSteps() {
    return LearningService.getArticles().filter((a) =>
      [
        'central-government',
        'local-government',
        'election-basics',
        'media-literacy-basics',
      ].includes(a.id),
    );
  },
};
