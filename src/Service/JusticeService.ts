import { JusticeRepository } from '@/Repository/JusticeRepository';
import type { JusticeData, JusticeFilter } from '@/Model/JusticeModel';

const normalize = (value: string) =>
  value.normalize('NFKC').replaceAll('台', '臺').replace(/\s+/g, '').toLowerCase();
export const JusticeService = {
  get: JusticeRepository.get,
  filter(data: JusticeData, filter: JusticeFilter) {
    const query = normalize(filter.query);
    return data.entities.filter(
      (entity) =>
        (filter.group === 'all' || entity.group === filter.group) &&
        (!query ||
          normalize(
            [entity.name, entity.kind, entity.summary, entity.position, ...entity.duties].join(' '),
          ).includes(query)),
    );
  },
  sourceIds(data: JusticeData) {
    return [
      ...new Set([
        ...data.principles.flatMap((item) => item.sourceIds),
        ...data.groups.flatMap((item) => item.sourceIds),
        ...data.cooperation.sourceIds,
        ...data.entities.flatMap((item) => item.sourceIds),
        ...data.courtPaths.flatMap((item) => item.sourceIds),
        ...data.criminalFlow.steps.flatMap((item) => item.sourceIds),
        ...data.custodyGuide.concepts.flatMap((item) => item.sourceIds),
        ...data.custodyGuide.conditions.flatMap((item) => item.sourceIds),
        ...data.custodyGuide.risk.sourceIds,
        ...data.custodyGuide.risk.consequences.flatMap((item) => item.sourceIds),
        ...data.custodyGuide.review.sourceIds,
        ...data.custodyGuide.review.steps.flatMap((item) => item.sourceIds),
        ...data.reporting.terms.flatMap((item) => item.sourceIds),
        ...data.reporting.channels.flatMap((item) => item.sourceIds),
        ...data.reporting.sourceIds,
        ...data.faq.flatMap((item) => item.sourceIds),
      ]),
    ];
  },
};
