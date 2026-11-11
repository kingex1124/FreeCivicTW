import raw from '@data/election-rules.json';
import { ElectionRulesSchema } from '@/Model/ElectionModel';
const data = ElectionRulesSchema.parse(raw);
export const ElectionRepository = { get: () => data };
