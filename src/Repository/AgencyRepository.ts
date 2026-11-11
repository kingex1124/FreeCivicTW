import raw from '@data/government-agencies.json';
import { AgencyDirectorySchema } from '@/Model/AgencyModel';

const data = AgencyDirectorySchema.parse(raw);
export const AgencyRepository = { get: () => data };
