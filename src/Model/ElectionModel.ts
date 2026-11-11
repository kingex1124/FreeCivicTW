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
});
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type IdentityScenario = 'unspecified' | 'general' | 'plains' | 'mountain';
export type Ballot = z.infer<typeof BallotSchema> & { role?: Role };
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
};
