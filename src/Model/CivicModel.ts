import { z } from 'zod';
import type { ReactNode } from 'react';
import type { AgencyDirectoryData } from './AgencyModel';
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(['central', 'county', 'town', 'village']),
  category: z.enum(['executive', 'representative', 'other']),
  scopes: z
    .array(z.enum(['central', 'local']))
    .min(1)
    .optional(),
  summary: z.string(),
  selection: z.string(),
  powers: z.array(z.string()),
  constituentServices: z
    .object({ items: z.array(z.string()).min(1), notice: z.string() })
    .optional(),
  performanceChecks: z.array(z.string()).min(1),
  limits: z.array(z.string()),
  oversight: z.string(),
  appointment: z.string(),
  example: z.string(),
  sourceIds: z.array(z.string()).min(1),
});
export const CivicSchema = z.object({
  schemaVersion: z.literal(1),
  contentStatus: z.literal('published'),
  checkedAt: z.string(),
  appointmentCatalogs: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        coverage: z.string(),
        relationSummary: z.string(),
        procedure: z.string(),
        notes: z.array(z.string()).min(1),
        offices: z
          .array(z.object({ id: z.string(), agency: z.string(), title: z.string() }))
          .min(1),
        sourceIds: z.array(z.string()).min(1),
      }),
    )
    .min(1),
  questioning: z.object({
    intro: z.string(),
    venues: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          questioner: z.string(),
          respondents: z.string(),
          scope: z.string(),
          example: z.string(),
          sourceIds: z.array(z.string()).min(1),
        }),
      )
      .min(1),
    notes: z
      .array(
        z.object({ title: z.string(), text: z.string(), sourceIds: z.array(z.string()).min(1) }),
      )
      .min(1),
  }),
  integrityGuide: z.object({
    title: z.string(),
    intro: z.string(),
    points: z.array(z.object({ title: z.string(), text: z.string() })).min(1),
    comparisons: z
      .array(z.object({ name: z.string(), work: z.string(), boundary: z.string() }))
      .min(1),
    reporting: z.object({
      title: z.string(),
      steps: z.array(z.string()).min(1),
      label: z.string(),
      url: z.url(),
    }),
    sourceIds: z.array(z.string()).min(1),
  }),
  roles: z.array(RoleSchema),
  relations: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      fromLabel: z.string().optional(),
      toLabel: z.string().optional(),
      officeCatalogId: z.string().optional(),
      label: z.string(),
      kind: z.enum(['election', 'appointment', 'consent', 'oversight', 'execution']),
    }),
  ),
  flows: z.array(
    z.object({
      id: z.enum(['appointment', 'law', 'budget']),
      title: z.string(),
      notice: z.string(),
      steps: z.array(z.object({ title: z.string(), actor: z.string(), text: z.string() })),
    }),
  ),
  situations: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      question: z.string(),
      answer: z.string(),
      steps: z.array(z.string()),
    }),
  ),
});
export type Role = z.infer<typeof RoleSchema>;
export type CivicPreviewMode = 'people' | 'execute' | 'oversee';
export type CivicPreviewProps = {
  groups: Record<
    CivicPreviewMode,
    (Pick<Role, 'id' | 'name' | 'summary'> & { scopeLabel: string; actions: string[] })[]
  >;
};
export type RoleDetailsProps = { role: Role };
export type CivicData = z.infer<typeof CivicSchema>;
export type RelationFilter = 'all' | CivicData['relations'][number]['kind'];
export type GovernmentProps = {
  data: CivicData;
  agencies: AgencyDirectoryData;
  legislation: ReactNode;
  participation: ReactNode;
};
