import { z } from 'zod';
import { TopicContentSchema } from './TopicContentModel';

export const LegislationTopicSchema = TopicContentSchema.extend({
  id: z.enum(['national-legislation', 'local-legislation']),
});
export const LegislationSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.iso.date(),
  topics: z.array(LegislationTopicSchema).length(2),
});
export type LegislationData = z.infer<typeof LegislationSchema>;
