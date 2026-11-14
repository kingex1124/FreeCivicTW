import raw from '@data/civic-participation.json';
import { ParticipationSchema } from '@/Model/ParticipationModel';

const data = ParticipationSchema.parse(raw);
export const ParticipationRepository = { get: () => data };
