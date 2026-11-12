import { z } from 'zod';
import type { IndigenousElectionGuideProps } from './ElectionModel';

const text = z.string().min(1);
const sources = z.array(text).min(1);
export const SupplementTacticSchema = z.object({
  id: text,
  title: text,
  original: text,
  presentation: text,
  gap: text,
  check: text,
});
export const SupplementTopicSchema = z.object({
  id: z.enum(['political-debate', 'constitutional-court']),
  title: text,
  shortTitle: text,
  intro: text,
  takeaways: z.array(z.object({ title: text, text })).length(3),
  notice: z.object({ title: text, paragraphs: z.array(text).min(1), sourceIds: sources }),
  chapters: z
    .array(
      z.object({
        id: text,
        title: text,
        summary: text,
        paragraphs: z.array(text).min(1),
        points: z.array(z.object({ title: text, text })),
        example: z.object({ title: text, text }).optional(),
        tactics: z.array(SupplementTacticSchema).min(1).optional(),
        sourceIds: sources,
      }),
    )
    .min(3),
});
export const SupplementSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.iso.date(),
  title: text,
  description: text,
  topics: z.array(SupplementTopicSchema).length(2),
});
export type SupplementData = z.infer<typeof SupplementSchema>;
export type SupplementTopic = z.infer<typeof SupplementTopicSchema>;
export type SupplementTacticProps = { tactic: z.infer<typeof SupplementTacticSchema> };
export type SupplementTopicProps = { topic: SupplementTopic; checkedAt: string };
export type SupplementViewProps = {
  data: SupplementData;
  indigenous: IndigenousElectionGuideProps;
};
