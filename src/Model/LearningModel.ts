import { z } from 'zod';
export const QuizSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string(), explanation: z.string() })).min(2),
  correctOptionId: z.string(),
});
export const ArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  minutes: z.number(),
  order: z.number(),
  openingQuestion: z.string(),
  sections: z
    .array(z.object({ id: z.string(), title: z.string(), paragraphs: z.array(z.string()).min(1) }))
    .min(3),
  example: z.object({ title: z.string(), text: z.string() }),
  misconception: z.object({ claim: z.string(), correction: z.string() }),
  quiz: QuizSchema,
  terms: z.array(z.object({ term: z.string(), definition: z.string() })),
  sourceIds: z.array(z.string()).min(1),
  updatedAt: z.string(),
});
export const ArticlesSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.literal('published'),
  checkedAt: z.string(),
  articles: z.array(ArticleSchema),
});
export const PathsSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.string(),
  updatedAt: z.string(),
  notice: z.string(),
  paths: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      href: z.string(),
      estimatedMinutes: z.number(),
      format: z.string(),
      goal: z.string().optional(),
      moduleIds: z.array(z.string()).optional(),
      scenarioIds: z.array(z.string()).optional(),
      summarySteps: z
        .array(z.object({ id: z.string(), title: z.string(), moduleIds: z.array(z.string()) }))
        .optional(),
    }),
  ),
  modules: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      order: z.number(),
      estimatedMinutes: z.number(),
      openingQuestion: z.string(),
      learningGoals: z.array(z.string()),
      sectionOutline: z.array(z.string()),
      interaction: z.string(),
    }),
  ),
});
export type Article = z.infer<typeof ArticleSchema>;
export type ArticleViewProps = { article: Article };
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizProps = { quiz: Quiz; contentId: string; trackCompletion?: boolean };
export type QuizFeedback = { correct: boolean; explanation: string; correctText: string };
export type ArticleRouteProps = { params: Promise<{ slug: string }> };
