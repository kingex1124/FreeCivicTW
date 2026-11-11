import raw from '@data/sources.json';
import { SourcesSchema } from '@/Model/SourceModel';
const data = SourcesSchema.parse(raw);
export const SourceRepository = { get: () => data };
