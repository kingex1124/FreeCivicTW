import { z } from 'zod';

const text = z.string().min(1);
export const OversightGroupSchema = z.enum([
  'councils',
  'transparency',
  'rights',
  'information',
  'environment',
]);
export const OversightOrganizationSchema = z.object({
  id: text,
  name: text,
  shortName: text,
  kind: text,
  group: OversightGroupSchema,
  scope: z.enum(['national', 'local']),
  coverage: text,
  summary: text,
  watchTargets: z.array(text).min(1),
  work: z.array(z.object({ title: text, text })).min(3),
  howToUse: z.array(text).min(2),
  participation: z.array(text).min(1),
  limits: z.array(text).min(2),
  resources: z.array(z.object({ label: text, url: z.url(), description: text })).min(1),
  officialUrl: z.url(),
  sourceIds: z.array(text).min(1),
});
export const OversightSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.literal('published'),
  checkedAt: z.iso.date(),
  title: text,
  description: text,
  intro: text,
  selection: z.object({ title: text, criteria: z.array(text).min(2), note: text }),
  groups: z.array(z.object({ id: OversightGroupSchema, label: text, description: text })).min(1),
  readingGuide: z.object({
    title: text,
    steps: z.array(text).min(3),
    boundaries: z.array(text).min(2),
  }),
  organizations: z.array(OversightOrganizationSchema).min(1),
});
export type OversightData = z.infer<typeof OversightSchema>;
export type OversightOrganization = z.infer<typeof OversightOrganizationSchema>;
export type OversightFilter = {
  group: 'all' | z.infer<typeof OversightGroupSchema>;
  scope: 'all' | OversightOrganization['scope'];
  query: string;
};
export type OversightViewProps = { data: OversightData };
