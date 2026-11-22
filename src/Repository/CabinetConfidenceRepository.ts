import raw from '@data/cabinet-confidence.json';
import { CabinetConfidenceSchema } from '@/Model/CabinetConfidenceModel';

const data = CabinetConfidenceSchema.parse(raw);
export const CabinetConfidenceRepository = { get: () => data };
