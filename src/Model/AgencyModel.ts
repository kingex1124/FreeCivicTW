import { z } from 'zod';

export const AgencyGroupSchema = z.enum(['central', 'local', 'oversight']);
export const AgencyEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  group: AgencyGroupSchema,
  category: z.string().min(1),
  aliases: z.array(z.string()),
  pickerName: z.string().optional(),
  summary: z.string().min(1),
  duties: z.array(z.string().min(1)).min(3),
  lifeConnections: z.array(z.string().min(1)).min(1),
  limits: z.array(z.string().min(1)).min(1),
  example: z.string().min(1),
  coverage: z.string().min(1),
  officialUrl: z.url(),
  sourceIds: z.array(z.string()).min(1),
});
const AgencyProfileSchema = AgencyEntrySchema.pick({
  summary: true,
  duties: true,
  lifeConnections: true,
  limits: true,
  example: true,
  coverage: true,
  officialUrl: true,
  sourceIds: true,
});
export const AgencyDirectorySchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.string(),
  title: z.string(),
  intro: z.string(),
  coverageNotes: z.array(z.string()).min(1),
  groups: z.array(z.object({ id: AgencyGroupSchema, label: z.string(), description: z.string() })),
  entries: z.array(AgencyEntrySchema).min(1),
  localInventories: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        title: z.string(),
        units: z
          .array(
            z.object({
              name: z.string(),
              kind: z.string().optional(),
              agencyIds: z.array(z.string()).min(1),
              profile: AgencyProfileSchema.optional(),
            }),
          )
          .min(1),
        sourceIds: z.array(z.string()).min(1),
      }),
    )
    .min(1),
  localDirectories: z.array(z.object({ name: z.string(), url: z.url() })).min(1),
});
export type AgencyGroup = z.infer<typeof AgencyGroupSchema>;
export type AgencyDirectoryData = z.infer<typeof AgencyDirectorySchema>;
export type AgencyFilter = { group: 'all' | AgencyGroup; query: string };
export type AgencyDirectoryProps = { data: AgencyDirectoryData };
export type AgencyOption = {
  id: string;
  name: string;
  summary: string;
  context: string;
  entryIds: string[];
  sourceIds: string[];
  keywords: string[];
  profile?: z.infer<typeof AgencyProfileSchema>;
};
export type AgencyInspection = {
  name: string;
  summary: string;
  context: string;
  coverages: string[];
  duties: string[];
  lifeConnections: string[];
  limits: string[];
  examples: string[];
  officialLinks: { label: string; url: string }[];
  sourceIds: string[];
  checkedAt: string;
};
export type AgencyDetailsProps = { inspection: AgencyInspection };
export type AgencyPickerProps = {
  open: boolean;
  onClose: () => void;
  scope: 'central' | 'local';
  options: AgencyOption[];
  selectedId: string | null;
  collectionId: string;
  collections: { id: string; name: string }[];
  onCollectionChange: (id: string) => void;
  onSelect: (id: string) => void;
};
