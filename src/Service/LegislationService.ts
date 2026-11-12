import { LegislationRepository } from '@/Repository/LegislationRepository';

export const LegislationService = {
  get: LegislationRepository.get,
  sourceIds() {
    return [
      ...new Set(
        LegislationRepository.get().topics.flatMap((topic) => [
          ...topic.notice.sourceIds,
          ...topic.chapters.flatMap((chapter) => chapter.sourceIds),
        ]),
      ),
    ];
  },
};
