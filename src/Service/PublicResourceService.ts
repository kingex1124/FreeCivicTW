import { PublicResourceRepository } from '@/Repository/PublicResourceRepository';
import { getAgencyDirectory } from '@/Service/AgencyService';
import { SourceService } from '@/Service/SourceService';
import type { PublicResource, PublicResources, ResourceFilter } from '@/Model/PublicResourceModel';

const normalize = (value: string) => value.normalize('NFKC').replaceAll('台', '臺').toLowerCase();
export const PublicResourceService = {
  get(): PublicResources {
    const data = PublicResourceRepository.get();
    const agencies = getAgencyDirectory();
    const homepages: PublicResource[] = agencies.entries
      .filter((item) => item.group === 'central')
      .map((item) => ({
        id: `homepage-${item.id}`,
        title: `${item.name}機關首頁`,
        agency: item.name,
        category: 'services',
        level: 'central',
        region: '',
        kind: 'agency',
        summary: item.summary,
        canFind: ['機關業務介紹與政策公告', '所屬機關及相關便民服務入口'],
        howToUse: [
          '先依業務介紹確認是否為主管機關。',
          '從網站導覽、資訊公開或便民服務，找要查詢的資料；也可轉往所屬機關。',
        ],
        limitations: [
          '這是機關首頁；特定查詢可能在所屬單位的另一個系統，資料範圍與更新時間請看該系統說明。',
        ],
        url: item.officialUrl,
        verificationUrl: SourceService.resolve(item.sourceIds)[0]?.url ?? item.officialUrl,
        checkedAt: agencies.checkedAt,
        keywords: [...item.aliases, item.category, ...item.lifeConnections],
      }));
    return { ...data, entries: [...data.entries, ...homepages] };
  },
  filter(data: PublicResources, filter: ResourceFilter) {
    const words = normalize(filter.query).trim().split(/\s+/).filter(Boolean);
    return data.entries.filter((item) => {
      if (filter.category !== 'all' && item.category !== filter.category) return false;
      if (filter.level !== 'all' && item.level !== filter.level) return false;
      if (filter.kind !== 'all' && item.kind !== filter.kind) return false;
      if (filter.region !== 'all' && normalize(item.region) !== normalize(filter.region))
        return false;
      const content = normalize(
        [
          item.title,
          item.agency,
          item.summary,
          item.region,
          ...item.canFind,
          ...item.keywords,
        ].join(' '),
      );
      return words.every((word) => content.includes(word));
    });
  },
  regions(data: PublicResources) {
    return [...new Set(data.entries.map((item) => item.region).filter(Boolean))];
  },
};
