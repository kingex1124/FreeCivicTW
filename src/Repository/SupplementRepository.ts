import raw from '@data/supplementary-topics.json';
import { SupplementSchema } from '@/Model/SupplementModel';

const data = SupplementSchema.parse(raw);
export const SupplementRepository = { get: () => data };
