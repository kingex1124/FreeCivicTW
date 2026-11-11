import { RegionRepository } from '@/Repository/RegionRepository';
import type { RegionMatch } from '@/Model/RegionModel';
export const RegionService = {
  get: RegionRepository.get,
  normalize: (value: string) => value.trim().replaceAll('台', '臺').replaceAll(/\s+/g, ''),
  getCounty: (id: string) => RegionRepository.get().counties.find((c) => c.id === id),
  resolve(countyId: string, townId: string): RegionMatch | undefined {
    const county = RegionService.getCounty(countyId);
    const town = county?.towns.find((t) => t.id === townId);
    return county && town ? { county, town } : undefined;
  },
  search(query: string): RegionMatch[] {
    const q = RegionService.normalize(query);
    if (!q) return [];
    return RegionRepository.get().counties.flatMap((county) =>
      county.towns
        .filter((town) => RegionService.normalize(county.name + town.name).includes(q))
        .map((town) => ({ county, town })),
    );
  },
};
