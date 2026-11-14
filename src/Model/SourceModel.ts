import { z } from 'zod';
export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  url: z.url(),
  publishedAt: z.string().nullable(),
  checkedAt: z.string(),
  scope: z.string(),
  note: z.string(),
});
export const SourcesSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(SourceSchema),
  corrections: z.array(
    z.object({ date: z.string(), previous: z.string(), correction: z.string(), scope: z.string() }),
  ),
});
export type Source = z.infer<typeof SourceSchema>;
export type SourceListProps = {
  sourceIds: string[];
  compact?: boolean;
  headingLevel?: 'h2' | 'h3' | 'h4';
  summary?: string;
  className?: string;
};
export type SourceLinkProps = { source: Source };
