import { z } from 'zod';

const text = z.string().min(1);
const link = z.url().refine((value) => new URL(value).protocol === 'https:', '僅收錄 HTTPS 入口');
export const ResourceCategorySchema = z.enum([
  'health',
  'justice',
  'politics',
  'money',
  'housing',
  'transport',
  'environment',
  'services',
]);
export const PublicResourceSchema = z.object({
  id: text,
  title: text,
  agency: text,
  category: ResourceCategorySchema,
  level: z.enum(['central', 'local', 'judicial', 'representative']),
  region: z.string(),
  kind: z.enum(['tool', 'agency']).default('tool'),
  summary: text,
  canFind: z.array(text).min(2),
  howToUse: z.array(text).min(2),
  limitations: z.array(text).min(1),
  url: link,
  verificationUrl: link,
  checkedAt: z.iso.date(),
  keywords: z.array(text),
});
export const PublicResourcesSchema = z.object({
  schemaVersion: z.literal(1),
  title: text,
  description: text,
  checkedAt: z.iso.date(),
  categories: z.array(z.object({ id: ResourceCategorySchema, label: text })),
  entries: z.array(PublicResourceSchema).min(1),
});
export type PublicResource = z.infer<typeof PublicResourceSchema>;
export type PublicResources = z.infer<typeof PublicResourcesSchema>;
export type ResourceFilter = {
  query: string;
  category: 'all' | PublicResource['category'];
  level: 'all' | PublicResource['level'];
  region: string;
  kind: 'all' | PublicResource['kind'];
};
export type PublicResourcesViewProps = { data: PublicResources; regions: string[] };
