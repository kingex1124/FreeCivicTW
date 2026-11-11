import raw from '@data/justice-system.json';
import { JusticeSchema } from '@/Model/JusticeModel';

const data = JusticeSchema.parse(raw);
export const JusticeRepository = { get: () => data };
