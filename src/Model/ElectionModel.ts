import { z } from 'zod';
import type { Role } from './CivicModel';
export const BallotSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  roleId: z.string(),
});
export const ProfileIdSchema = z.enum([
  'municipality-district',
  'city-district',
  'county-city',
  'county-town',
  'county-township',
  'indigenous-district',
]);
const sourcedText = z.object({
  title: z.string(),
  text: z.string(),
  sourceIds: z.array(z.string()).min(1),
});
export const IndigenousElectionGuideSchema = z.object({
  title: z.string(),
  intro: z.string(),
  identityNote: z.string(),
  sharedBallots: z.array(sourcedText).min(2),
  comparisons: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        general: z.string(),
        plains: z.string(),
        mountain: z.string(),
        note: z.string(),
        sourceIds: z.array(z.string()).min(1),
      }),
    )
    .min(3),
  geography: sourcedText,
  councils: z.object({
    title: z.string(),
    intro: z.string(),
    terminology: z.string(),
    takeaways: z.array(sourcedText).length(3),
    snapshot: z.object({
      title: z.string(),
      electionDate: z.iso.date(),
      announcedAt: z.iso.date(),
      note: z.string(),
      sourceIds: z.array(z.string()).min(1),
      rows: z
        .array(
          z.object({
            countyId: z.string().regex(/^\d{5}$/),
            county: z.string(),
            plains: z.number().int().nonnegative(),
            mountain: z.number().int().nonnegative(),
            combined: z.number().int().nonnegative(),
          }),
        )
        .length(22),
    }),
    questions: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          answer: z.string(),
          paragraphs: z.array(z.string()).min(1),
          example: z.object({ title: z.string(), text: z.string() }).optional(),
          sourceIds: z.array(z.string()).min(1),
        }),
      )
      .min(3),
  }),
  polling: sourcedText,
  checklist: z.array(z.string()).min(3),
  scenarioSummaries: z.object({
    unspecified: z.string(),
    general: z.string(),
    plains: z.string(),
    mountain: z.string(),
  }),
  localNotes: z.object({
    countyCouncil: z.object({
      unspecified: z.string(),
      general: z.string(),
      plains: z.string(),
      mountain: z.string(),
    }),
    townCouncil: z.object({
      unspecified: z.string(),
      general: z.string(),
      plains: z.string(),
      mountain: z.string(),
    }),
    autonomousCouncil: z.string(),
  }),
});
export const ElectionRulesSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.literal('published'),
  checkedAt: z.string(),
  notice: z.string(),
  sourceIds: z.array(z.string()),
  national: z.array(BallotSchema),
  localProfiles: z.array(
    z.object({ id: ProfileIdSchema, label: z.string(), ballots: z.array(BallotSchema) }),
  ),
  indigenousGuide: IndigenousElectionGuideSchema,
});
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type IdentityScenario = 'unspecified' | 'general' | 'plains' | 'mountain';
export type Ballot = z.infer<typeof BallotSchema> & { role?: Role; electionNote?: string };
export type IndigenousElectionGuide = z.infer<typeof IndigenousElectionGuideSchema>;
export type IndigenousCouncilGuideProps = { guide: IndigenousElectionGuide['councils'] };
export type IndigenousElectionGuideProps = {
  guide: IndigenousElectionGuide;
  districts: string[];
  checkedAt: string;
};
export type BallotCardProps = { ballot: Ballot; index: number };
export type BallotResult = {
  location: string;
  profileId: ProfileId;
  profileLabel: string;
  national: Ballot[];
  local: Ballot[];
  checkedAt: string;
  sourceIds: string[];
  notice: string;
  stale: boolean;
  identitySummary: string;
};
