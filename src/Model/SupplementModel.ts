import { z } from 'zod';
import type { IndigenousElectionGuideProps } from './ElectionModel';
import { TopicContentSchema } from './TopicContentModel';

export const SupplementTopicSchema = TopicContentSchema.extend({
  id: z.enum(['political-debate', 'constitutional-court']),
});
export const SupplementSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.iso.date(),
  title: z.string().min(1),
  description: z.string().min(1),
  topics: z.array(SupplementTopicSchema).length(2),
});
export type SupplementData = z.infer<typeof SupplementSchema>;
export type SupplementTopic = z.infer<typeof SupplementTopicSchema>;
export type SupplementViewProps = {
  data: SupplementData;
  indigenous: IndigenousElectionGuideProps;
};
