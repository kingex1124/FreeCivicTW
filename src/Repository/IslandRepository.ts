import raw from '@data/civic-island.json';
import { IslandSchema } from '@/Model/IslandModel';
const data = IslandSchema.parse(raw);
export const IslandRepository = { get: () => data };
