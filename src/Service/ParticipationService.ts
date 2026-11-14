import { ParticipationRepository } from '@/Repository/ParticipationRepository';

export const ParticipationService = {
  get: ParticipationRepository.get,
  sourceIds() {
    return [
      ...new Set(
        ParticipationRepository.get().topics.flatMap((topic) => [
          ...topic.notice.sourceIds,
          ...topic.chapters.flatMap((chapter) => chapter.sourceIds),
        ]),
      ),
    ];
  },
};
