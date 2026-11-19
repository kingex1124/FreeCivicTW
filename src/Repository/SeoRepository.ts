import raw from '@data/seo.json';
import { SeoCatalogSchema } from '@/Model/SeoModel';

const catalog = SeoCatalogSchema.parse(raw);
export const SeoRepository = { get: () => catalog };
