import { z } from 'zod';
import type * as THREE from 'three';
export const IslandBuildingStyleSchema = z.enum([
  'plaza',
  'presidential',
  'executive',
  'parliament',
  'council',
  'judicial-yuan',
  'court',
  'constitutional',
  'prosecutors',
  'police',
  'investigation',
  'watchdog',
  'examination',
  'city-hall',
  'community',
  'museum',
  'education',
  'medical',
  'care',
  'transport',
  'railway',
  'maritime',
  'defense',
  'finance',
  'technology',
  'agriculture',
  'environment',
  'water',
  'fire',
  'culture',
  'sports',
  'office',
  'tourism',
  'planning',
  'labor',
  'indigenous',
  'research',
  'election',
  'engineering',
  'international',
]);
export const IslandBuildingProfileSchema = z.object({
  nodeId: z.string().min(1),
  style: IslandBuildingStyleSchema,
  accent: z.string().regex(/^#[\da-fA-F]{6}$/),
  variant: z.number().int().min(0).max(3),
});
export type IslandBuildingStyle = z.infer<typeof IslandBuildingStyleSchema>;
export type IslandBuildingDesign = Omit<z.infer<typeof IslandBuildingProfileSchema>, 'nodeId'>;
export type IslandBuildingPainter = {
  add: (
    geometry: THREE.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    sx?: number,
    sy?: number,
    sz?: number,
    rotation?: number,
  ) => void;
};
export type IslandBuildingResult = { width: number; depth: number; height: number };
export const IslandGroupIdSchema = z.enum(['central', 'local', 'courts', 'prosecution', 'police']);
export const IslandSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: z.iso.date(),
  activity: z.object({
    harbors: z.array(z.object({ group: IslandGroupIdSchema, angle: z.number() })).length(5),
    ferries: z
      .array(
        z.object({
          id: z.string().min(1),
          from: IslandGroupIdSchema,
          to: IslandGroupIdSchema,
          via: z.array(z.tuple([z.number(), z.number()])),
          color: z.string(),
          speed: z.number().positive(),
          phase: z.number().nonnegative(),
        }),
      )
      .min(1),
  }),
  buildingProfiles: z.array(IslandBuildingProfileSchema).min(1),
  groups: z
    .array(
      z.object({
        id: IslandGroupIdSchema,
        name: z.string(),
        subtitle: z.string(),
        color: z.string(),
        position: z.tuple([z.number(), z.number()]),
        radius: z.number().min(6).max(30),
        landmark: z.enum(['palace', 'town', 'court', 'office', 'police']),
      }),
    )
    .length(5),
  districts: z
    .array(
      z.object({
        id: z.string().min(1),
        group: z.enum(['central', 'local']),
        name: z.string().min(1),
        color: z.string(),
        offset: z.tuple([z.number(), z.number()]),
        radius: z.number().min(3).max(7),
        members: z.array(z.string()).min(1).max(9),
      }),
    )
    .min(1),
  connections: z.array(
    z.object({ from: z.string(), to: z.string(), label: z.string(), kind: z.string() }),
  ),
  journeys: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        intro: z.string(),
        notice: z.string(),
        steps: z
          .array(
            z.object({
              nodeId: z.string(),
              title: z.string(),
              text: z.string(),
              connection: z.string().nullable(),
              reverse: z.boolean().optional(),
            }),
          )
          .min(3),
      }),
    )
    .min(1),
});
export type IslandGroupId = z.infer<typeof IslandGroupIdSchema>;
export type IslandConfig = z.infer<typeof IslandSchema>;
export type IslandNode = {
  id: string;
  group: IslandGroupId;
  name: string;
  kind: string;
  summary: string;
  context: string;
  duties: string[];
  life: string[];
  limits: string[];
  example: string;
  sourceIds: string[];
  href: string;
  position: [number, number, number];
  districtId?: string;
  building: IslandBuildingDesign;
};
export type IslandConnection = {
  from: string;
  to: string;
  label: string;
  kind: string;
  fromLabel?: string;
  toLabel?: string;
};
export type IslandDistrict = IslandConfig['districts'][number] & { position: [number, number] };
export type IslandActivityInput = {
  groups: IslandConfig['groups'];
  districts: IslandDistrict[];
  nodes: Pick<IslandNode, 'group' | 'position'>[];
  activity: IslandConfig['activity'];
};
export type IslandActivityPath = {
  points: [number, number][];
  distances: number[];
  length: number;
};
export type IslandPersonRole =
  'citizen' | 'official' | 'representative' | 'judge' | 'prosecutor' | 'police';
export type IslandWalker = {
  group: IslandGroupId;
  role: IslandPersonRole;
  path: IslandActivityPath;
  speed: number;
  phase: number;
  variant: number;
};
export type IslandHarbor = {
  group: IslandGroupId;
  position: [number, number];
  heading: number;
  berth: [number, number];
  approach: [number, number];
  color: string;
};
export type IslandFerry = {
  id: string;
  from: IslandGroupId;
  to: IslandGroupId;
  path: IslandActivityPath;
  speed: number;
  phase: number;
  color: string;
};
export type IslandActivityPlan = {
  harbors: IslandHarbor[];
  walkers: IslandWalker[];
  ferries: IslandFerry[];
};
export type IslandMotionPose = { x: number; z: number; heading: number; moving: boolean };
export type IslandData = Omit<IslandConfig, 'connections' | 'districts'> & {
  districts: IslandDistrict[];
  nodes: IslandNode[];
  connections: IslandConnection[];
};
export type IslandViewProps = { data: IslandData };
export type IslandNoteProps = { node: IslandNode };
export type IslandCameraCommand = {
  kind: 'reset' | 'in' | 'out' | 'top' | 'group' | 'district' | 'node';
  targetId?: string;
  sequence: number;
};
export type IslandSceneProps = {
  activity: IslandConfig['activity'];
  groups: IslandConfig['groups'];
  districts: IslandDistrict[];
  nodes: Pick<
    IslandNode,
    'id' | 'group' | 'name' | 'position' | 'kind' | 'districtId' | 'building'
  >[];
  selectedId: string;
  highlightSelected: boolean;
  activeGroup: IslandGroupId | 'all';
  connections: IslandConnection[];
  command: IslandCameraCommand;
  onSelect: (id: string) => void;
  onGroup: (id: IslandGroupId) => void;
  onDistrict: (id: string) => void;
  onStatus: (status: 'ready' | 'unavailable') => void;
};
