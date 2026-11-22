import { z } from 'zod';
import { TopicContentSchema } from './TopicContentModel';

export const CabinetConfidenceSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.iso.date(),
  topic: TopicContentSchema.extend({ id: z.literal('cabinet-confidence') }),
});
