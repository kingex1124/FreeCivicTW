import { OversightRepository } from '@/Repository/OversightRepository';
import type { OversightData, OversightFilter } from '@/Model/OversightModel';

const normalize = (value: string) =>
  value.normalize('NFKC').replaceAll('台', '臺').replace(/\s+/g, '').toLowerCase();

export const OversightService = {
  get: OversightRepository.get,
  filter(data: OversightData, filter: OversightFilter) {
    const query = normalize(filter.query);
    return data.organizations.filter(
      (organization) =>
        (filter.group === 'all' || organization.group === filter.group) &&
        (filter.scope === 'all' || organization.scope === filter.scope) &&
        (!query ||
          normalize(
            [
              organization.name,
              organization.shortName,
              organization.kind,
              organization.coverage,
              organization.summary,
              ...organization.watchTargets,
              ...organization.work.flatMap((item) => [item.title, item.text]),
              ...organization.resources.map((item) => item.label),
            ].join(' '),
          ).includes(query)),
    );
  },
  sourceIds(data: OversightData) {
    return [...new Set(data.organizations.flatMap((organization) => organization.sourceIds))];
  },
};
