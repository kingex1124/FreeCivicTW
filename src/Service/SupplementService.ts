import { SupplementRepository } from '@/Repository/SupplementRepository';
import { ElectionService } from './ElectionService';

export const SupplementService = {
  get: SupplementRepository.get,
  indigenous() {
    const rules = ElectionService.getRules();
    return {
      guide: rules.indigenousGuide,
      districts: ElectionService.autonomousDistricts(),
      checkedAt: rules.checkedAt,
    };
  },
  sourceIds() {
    const topics = SupplementRepository.get().topics;
    return [
      ...new Set([
        ...ElectionService.indigenousSourceIds(),
        ...topics.flatMap((topic) => [
          ...topic.notice.sourceIds,
          ...topic.chapters.flatMap((chapter) => chapter.sourceIds),
        ]),
      ]),
    ];
  },
};
