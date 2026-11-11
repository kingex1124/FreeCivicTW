import { z } from 'zod';
export const TownSchema = z.object({
  id: z.string().regex(/^\d{8}$/),
  name: z.string(),
  type: z.enum(['district', 'city', 'town', 'township']),
  autonomous: z.boolean(),
});
export const CountySchema = z.object({
  id: z.string().regex(/^\d{5}$/),
  name: z.string(),
  type: z.enum(['municipality', 'county', 'city']),
  towns: z.array(TownSchema),
});
export const RegionsSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.literal('published'),
  checkedAt: z.string(),
  source: z.object({
    title: z.string(),
    publisher: z.string(),
    url: z.url(),
    publishedAt: z.string().nullable(),
    license: z.string(),
  }),
  counties: z.array(CountySchema),
});
export type Town = z.infer<typeof TownSchema>;
export type County = z.infer<typeof CountySchema>;
export type RegionMatch = { county: County; town: Town };
