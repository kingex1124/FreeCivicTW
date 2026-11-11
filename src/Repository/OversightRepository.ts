import raw from '@data/civil-oversight.json';
import { OversightSchema } from '@/Model/OversightModel';

const data = OversightSchema.parse(raw);
export const OversightRepository = { get: () => data };
