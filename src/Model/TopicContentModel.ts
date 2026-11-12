import { z } from 'zod';

const text = z.string().min(1);
const sources = z.array(text).min(1);
export const TopicTacticSchema = z.object({
  id: text,
  title: text,
  original: text,
  presentation: text,
  gap: text,
  check: text,
});
export const TopicContentSchema = z.object({
  id: text,
  title: text,
  shortTitle: text,
  navDescription: text,
  intro: text,
  takeaways: z.array(z.object({ title: text, text })).length(3),
  notice: z.object({ title: text, paragraphs: z.array(text).min(1), sourceIds: sources }),
  flowOverview: z
    .array(z.object({ label: text, target: text }))
    .min(1)
    .optional(),
  relatedLinks: z.array(z.object({ href: text.startsWith('/'), label: text })).min(1),
  chapters: z
    .array(
      z.object({
        id: text,
        title: text,
        summary: text,
        paragraphs: z.array(text).min(1),
        points: z.array(z.object({ title: text, text })),
        example: z.object({ title: text, text }).optional(),
        tactics: z.array(TopicTacticSchema).min(1).optional(),
        terms: z
          .array(z.object({ term: text, meaning: text }))
          .min(1)
          .optional(),
        sourceIds: sources,
      }),
    )
    .min(3),
});
export type TopicTacticProps = { tactic: z.infer<typeof TopicTacticSchema> };
export type TopicContentProps = {
  topic: z.infer<typeof TopicContentSchema>;
  checkedAt: string;
  returnLink: { href: string; label: string };
};
