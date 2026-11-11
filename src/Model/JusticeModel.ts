import { z } from 'zod';

export const JusticeGroupSchema = z.enum(['courts', 'prosecution', 'police', 'support']);
const sources = z.array(z.string().min(1)).min(1);
const paragraph = z.string().min(1);
const sourcedText = z.object({
  id: paragraph,
  title: paragraph,
  text: paragraph,
  sourceIds: sources,
});
export const JusticeEntitySchema = z.object({
  id: paragraph,
  name: paragraph,
  group: JusticeGroupSchema,
  kind: z.enum(['機關', '機關類型', '職務與制度', '協助服務']),
  summary: paragraph,
  position: paragraph,
  duties: z.array(paragraph).min(3),
  limits: z.array(paragraph).min(2),
  example: paragraph,
  officialUrl: z.url(),
  sourceIds: sources,
});
export const JusticeSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.literal('published'),
  checkedAt: z.iso.date(),
  title: paragraph,
  description: paragraph,
  principles: z.array(sourcedText).min(3),
  groups: z
    .array(
      z.object({
        id: JusticeGroupSchema,
        label: paragraph,
        title: paragraph,
        organizationPath: z.array(paragraph).min(1),
        note: paragraph,
        sourceIds: sources,
      }),
    )
    .min(4),
  cooperation: z.object({ text: paragraph, sourceIds: sources }),
  coverageNotes: z.array(paragraph).min(1),
  entities: z.array(JusticeEntitySchema).min(1),
  courtPaths: z
    .array(
      z.object({
        id: paragraph,
        title: paragraph,
        stages: z.array(paragraph).min(1),
        note: paragraph,
        sourceIds: sources,
      }),
    )
    .min(3),
  criminalFlow: z.object({
    title: paragraph,
    intro: paragraph,
    steps: z
      .array(
        z.object({
          id: paragraph,
          title: paragraph,
          actor: paragraph,
          text: paragraph,
          details: z.array(paragraph).min(1),
          outcomes: z.array(z.object({ label: paragraph, text: paragraph })).optional(),
          sourceIds: sources,
        }),
      )
      .min(4),
    notes: z.array(paragraph).min(1),
  }),
  reporting: z.object({
    intro: paragraph,
    terms: z.array(sourcedText).min(3),
    channels: z
      .array(
        z.object({
          id: paragraph,
          title: paragraph,
          where: paragraph,
          steps: z.array(z.object({ title: paragraph, text: paragraph })).min(3),
          notes: z.array(paragraph).min(2),
          officialUrl: z.url(),
          sourceIds: sources,
        }),
      )
      .min(2),
    prepare: z.array(paragraph).min(1),
    notice: paragraph,
    sourceIds: sources,
  }),
  faq: z.array(sourcedText).min(5),
});
export type JusticeData = z.infer<typeof JusticeSchema>;
export type JusticeEntity = z.infer<typeof JusticeEntitySchema>;
export type JusticeGroup = z.infer<typeof JusticeGroupSchema>;
export type JusticeFilter = { group: 'all' | JusticeGroup; query: string };
export type JusticeViewProps = { data: JusticeData };
export type JusticeDetailsProps = { entity: JusticeEntity };
