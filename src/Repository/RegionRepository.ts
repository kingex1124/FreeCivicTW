import raw from '@data/regions.json';
import { RegionsSchema } from '@/Model/RegionModel';
const data = RegionsSchema.parse(raw);
export const RegionRepository = { get: () => data };
