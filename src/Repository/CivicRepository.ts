import raw from '@data/civic-roles.json';
import { CivicSchema } from '@/Model/CivicModel';
const data = CivicSchema.parse(raw);
export const CivicRepository = { get: () => data };
