import { z } from 'zod';
import { TopicContentSchema } from './TopicContentModel';

export const ParticipationTopicSchema = TopicContentSchema.extend({
  id: z.enum(['referendum', 'recall']),
});
export const ParticipationSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.iso.date(),
  topics: z.array(ParticipationTopicSchema).length(2),
});
export type ParticipationData = z.infer<typeof ParticipationSchema>;
