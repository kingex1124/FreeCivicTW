import raw from '@data/public-resources.json';
import { PublicResourcesSchema } from '@/Model/PublicResourceModel';

const data = PublicResourcesSchema.parse(raw);
export const PublicResourceRepository = { get: () => data };
