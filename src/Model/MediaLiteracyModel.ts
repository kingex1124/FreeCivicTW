import { z } from 'zod';
export const ScenarioSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  isFictional: z.literal(true),
  skill: z.string(),
  setup: z.string(),
  claimToCheck: z.string(),
  evidence: z.array(z.object({ id: z.string(), label: z.string(), text: z.string() })).min(2),
  question: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })),
  correctOptionId: z.string(),
  explanation: z.string(),
  optionExplanations: z.record(z.string(), z.string()),
  nextActions: z.array(z.string()),
});
export const MediaSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.enum(['draft', 'published']),
  updatedAt: z.string(),
  materialType: z.string(),
  disclaimer: z.string(),
  flow: z.array(z.string()),
  allowAnswerRevision: z.boolean(),
  allowExplanationWithoutAnswer: z.boolean(),
  persistResponses: z.literal(false),
  scenarios: z.array(ScenarioSchema),
});
export type Scenario = z.infer<typeof ScenarioSchema>;
export type ScenarioProps = { scenario: Scenario; nextSlug: string };
