import { z } from 'zod';
export const SiteSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.enum(['draft', 'published']),
  updatedAt: z.string(),
  name: z.string(),
  locale: z.string(),
  tagline: z.string(),
  description: z.string(),
  mission: z.string(),
  developerIntent: z.object({ title: z.string(), paragraphs: z.array(z.string()) }),
  contact: z.object({
    email: z.email(),
    label: z.string(),
    mailto: z.string(),
    correctionSubject: z.string(),
    correctionFields: z.array(z.string()),
  }),
  primaryEntries: z.array(
    z.object({ id: z.string(), label: z.string(), href: z.string(), learningPathId: z.string() }),
  ),
  editorialPrinciples: z.array(z.string()),
  notices: z.object({
    educationalPurpose: z.string(),
    ballotLookup: z.string(),
    fictionalScenario: z.string(),
    quickStartDuration: z.string(),
  }),
});
export type Site = z.infer<typeof SiteSchema>;
export type ColorTheme = 'light' | 'dark';
