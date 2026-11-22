import { CabinetConfidenceRepository } from '@/Repository/CabinetConfidenceRepository';

export const CabinetConfidenceService = {
  get: CabinetConfidenceRepository.get,
  sourceIds() {
    const { topic } = CabinetConfidenceRepository.get();
    return [
      ...new Set([
        ...topic.notice.sourceIds,
        ...topic.chapters.flatMap((chapter) => chapter.sourceIds),
      ]),
    ];
  },
};
