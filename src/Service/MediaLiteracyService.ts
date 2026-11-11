import { MediaLiteracyRepository } from '@/Repository/MediaLiteracyRepository';
export const MediaLiteracyService = {
  get: MediaLiteracyRepository.get,
  getScenarios: () => MediaLiteracyRepository.get().scenarios,
  getScenario: (slug: string) =>
    MediaLiteracyRepository.get().scenarios.find((s) => s.slug === slug),
  next(slug: string) {
    const list = MediaLiteracyService.getScenarios();
    return list[(list.findIndex((s) => s.slug === slug) + 1) % list.length].slug;
  },
};
