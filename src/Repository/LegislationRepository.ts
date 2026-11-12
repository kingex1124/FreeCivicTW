import raw from '@data/legislation.json';
import { LegislationSchema } from '@/Model/LegislationModel';

const data = LegislationSchema.parse(raw);
export const LegislationRepository = { get: () => data };
