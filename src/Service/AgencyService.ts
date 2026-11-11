import { AgencyRepository } from '@/Repository/AgencyRepository';
import type {
  AgencyDirectoryData,
  AgencyFilter,
  AgencyGroup,
  AgencyOption,
  AgencyInspection,
} from '@/Model/AgencyModel';

export const getAgencyDirectory = AgencyRepository.get;
const normalize = (value: string) => value.normalize('NFKC').replaceAll('台', '臺').toLowerCase();

export function searchAgencyEntries(data: AgencyDirectoryData, filter: AgencyFilter) {
  const words = normalize(filter.query).trim().split(/\s+/).filter(Boolean);
  return data.entries.filter((entry) => {
    if (filter.group !== 'all' && entry.group !== filter.group) return false;
    const text = normalize(
      [
        entry.name,
        ...entry.aliases,
        entry.category,
        entry.summary,
        entry.coverage,
        ...entry.duties,
      ].join(' '),
    );
    return words.every((word) => text.includes(word));
  });
}

export function getScopedAgencyOptions(
  data: AgencyDirectoryData,
  scope: 'central' | 'local',
  collectionId = 'common',
): AgencyOption[] {
  if (scope === 'local' && collectionId !== 'common') {
    const inventory = data.localInventories.find((item) => item.id === collectionId);
    if (!inventory) return [];
    return inventory.units.map((unit) => ({
      id: `${inventory.id}:${unit.name}`,
      name: unit.name,
      summary: unit.agencyIds
        .map((id) => data.entries.find((entry) => entry.id === id)!.name)
        .join('、'),
      context: `${inventory.name}政府組織：${unit.name}${unit.kind ? `（${unit.kind}）` : ''}`,
      entryIds: unit.agencyIds,
      sourceIds: inventory.sourceIds,
      profile: unit.profile,
      keywords: [
        inventory.name,
        unit.name,
        ...unit.agencyIds.flatMap((id) => data.entries.find((entry) => entry.id === id)!.aliases),
      ],
    }));
  }
  return data.entries
    .filter((entry) => entry.group === scope)
    .map((entry) => ({
      id: entry.id,
      name: scope === 'local' ? (entry.pickerName ?? entry.aliases[0] ?? entry.name) : entry.name,
      summary: scope === 'local' ? entry.name : entry.category,
      context:
        scope === 'local'
          ? '地方常見職能與名稱範例；實際設置、名稱與權限依各地組織法規。'
          : entry.coverage,
      entryIds: [entry.id],
      sourceIds: [],
      keywords: [entry.name, ...entry.aliases, entry.summary, ...entry.duties],
    }));
}

export function filterAgencyOptions(options: AgencyOption[], query: string) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return options.filter((option) => {
    const text = normalize([option.name, option.summary, ...option.keywords].join(' '));
    return words.every((word) => text.includes(word));
  });
}

export function getAgencyInspection(
  data: AgencyDirectoryData,
  option: AgencyOption,
): AgencyInspection {
  const entries = option.entryIds.map((id) => data.entries.find((entry) => entry.id === id)!);
  const unique = (values: string[]) => [...new Set(values)];
  if (option.profile) {
    const profile = option.profile;
    return {
      name: option.name,
      summary: profile.summary,
      context: option.context,
      coverages: [profile.coverage],
      duties: profile.duties,
      lifeConnections: profile.lifeConnections,
      limits: profile.limits,
      examples: [profile.example],
      officialLinks: [{ label: option.name, url: profile.officialUrl }],
      sourceIds: unique([...option.sourceIds, ...profile.sourceIds]),
      checkedAt: data.checkedAt,
    };
  }
  const links = new Map(
    entries.map((entry) => [entry.officialUrl, { label: entry.name, url: entry.officialUrl }]),
  );
  return {
    name: option.name,
    summary: unique(entries.map((entry) => entry.summary)).join(' '),
    context: option.context,
    coverages: unique(entries.map((entry) => entry.coverage)).filter(
      (coverage) => coverage !== option.context,
    ),
    duties: unique(entries.flatMap((entry) => entry.duties)),
    lifeConnections: unique(entries.flatMap((entry) => entry.lifeConnections)),
    limits: unique(entries.flatMap((entry) => entry.limits)),
    examples: unique(entries.map((entry) => entry.example)),
    officialLinks: [...links.values()],
    sourceIds: unique([...option.sourceIds, ...entries.flatMap((entry) => entry.sourceIds)]),
    checkedAt: data.checkedAt,
  };
}

export function getAgencyCounts(data: AgencyDirectoryData): Record<AgencyGroup, number> {
  return data.entries.reduce(
    (counts, entry) => {
      counts[entry.group]++;
      return counts;
    },
    { central: 0, local: 0, oversight: 0 },
  );
}

export function getLocalAgencyInventories(data: AgencyDirectoryData) {
  return data.localInventories.map((inventory) => ({
    ...inventory,
    units: inventory.units.map((unit) => ({
      ...unit,
      topics: unit.agencyIds.map((id) => data.entries.find((entry) => entry.id === id)?.name ?? id),
    })),
  }));
}
