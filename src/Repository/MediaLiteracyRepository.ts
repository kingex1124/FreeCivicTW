import raw from '@data/media-literacy-scenarios.json';
import { MediaSchema } from '@/Model/MediaLiteracyModel';
const data = MediaSchema.parse(raw);
export const MediaLiteracyRepository = { get: () => data };
