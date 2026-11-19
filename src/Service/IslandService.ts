import { IslandRepository } from '@/Repository/IslandRepository';
import { CivicService } from './CivicService';
import { JusticeService } from './JusticeService';
import { getAgencyDirectory, getScopedAgencyOptions, getAgencyInspection } from './AgencyService';
import type {
  IslandData,
  IslandNode,
  IslandGroupId,
  IslandActivityInput,
  IslandActivityPath,
  IslandActivityPlan,
  IslandMotionPose,
  IslandPersonRole,
} from '@/Model/IslandModel';
const normalize = (value: string) => value.normalize('NFKC').replaceAll('台', '臺').toLowerCase();
const hexNormals = Array.from({ length: 6 }, (_, i) => [
  Math.cos((i * Math.PI) / 3),
  Math.sin((i * Math.PI) / 3),
]);
function activityPath(points: [number, number][]): IslandActivityPath {
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(
      distances[i - 1] +
        Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  return { points, distances, length: distances.at(-1)! };
}
export const IslandService = {
  isOnIsland(group: IslandActivityInput['groups'][number], x: number, z: number, margin = 0) {
    const apothem = group.radius * (6.38 / 6.7) * Math.cos(Math.PI / 6) - margin;
    return hexNormals.every(
      ([nx, nz]) => (x - group.position[0]) * nx + (z - group.position[1]) * nz <= apothem,
    );
  },
  planActivity({ groups, districts, nodes, activity }: IslandActivityInput): IslandActivityPlan {
    const harbors = activity.harbors.map((config) => {
      const group = groups.find((item) => item.id === config.group)!;
      if (!group) throw new Error(`公民島港口不存在：${config.group}`);
      const angle = (config.angle * Math.PI) / 180;
      const dx = Math.cos(angle),
        dz = Math.sin(angle);
      const distance =
        (group.radius * (6.38 / 6.7) * Math.cos(Math.PI / 6)) /
        Math.max(...hexNormals.map(([nx, nz]) => nx * dx + nz * dz));
      const position: [number, number] = [
        group.position[0] + dx * distance,
        group.position[1] + dz * distance,
      ];
      return {
        group: group.id,
        position,
        heading: Math.atan2(dx, dz),
        color: group.color,
        berth: [position[0] + dx * 3.5 + dz * 1.6, position[1] + dz * 3.5 - dx * 1.6] as [
          number,
          number,
        ],
        approach: [position[0] + dx * 8 + dz * 1.6, position[1] + dz * 8 - dx * 1.6] as [
          number,
          number,
        ],
      };
    });
    if (new Set(harbors.map((item) => item.group)).size !== groups.length)
      throw new Error('每座公民島都需要自己的港口');
    const ferries = activity.ferries.map((config) => {
      const from = harbors.find((port) => port.group === config.from)!;
      const to = harbors.find((port) => port.group === config.to)!;
      if (!from || !to || from === to) throw new Error(`公民島航線不正確：${config.id}`);
      const path = activityPath([from.berth, from.approach, ...config.via, to.approach, to.berth]);
      return { ...config, path };
    });
    const walkers: IslandActivityPlan['walkers'] = [];
    for (const group of groups) {
      const trees: [number, number][] = [];
      const landScale = group.radius / 6.7;
      for (let i = 0; i < Math.round(16 * landScale); i++) {
        const radius = (5.4 + (i % 3) * 0.23) * landScale;
        trees.push([
          group.position[0] + Math.cos(i * 2.39996) * radius,
          group.position[1] + Math.sin(i * 2.39996) * radius,
        ]);
      }
      for (const district of districts.filter((item) => item.group === group.id))
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3 + 0.5;
          trees.push([
            district.position[0] + Math.cos(angle) * (district.radius - 0.25),
            district.position[1] + Math.sin(angle) * (district.radius - 0.25),
          ]);
        }
      // A four-neighbour grid keeps the whole walking segment clear of façades and trees.
      const members = nodes.filter((node) => node.group === group.id);
      const harbor = harbors.find((port) => port.group === group.id)!;
      const clearOfTerminal = (x: number, z: number) => {
        const dx = x - harbor.position[0],
          dz = z - harbor.position[1];
        const localX = Math.cos(harbor.heading) * dx - Math.sin(harbor.heading) * dz;
        const localZ = Math.sin(harbor.heading) * dx + Math.cos(harbor.heading) * dz;
        return Math.abs(localX + 1.65) > 1.3 || Math.abs(localZ + 1.25) > 1.05;
      };
      const clearance = group.id === 'courts' ? 1.15 : 1.28;
      const spacing = 0.5,
        size = Math.ceil((group.radius * 2) / spacing) + 1;
      const cells = new Map<number, [number, number]>();
      for (let row = 0; row < size; row++)
        for (let col = 0; col < size; col++) {
          const x = group.position[0] - group.radius + col * spacing;
          const z = group.position[1] - group.radius + row * spacing;
          if (
            IslandService.isOnIsland(group, x, z, 0.65) &&
            clearOfTerminal(x, z) &&
            members.every(
              (node) =>
                Math.abs(node.position[0] - x) > clearance ||
                Math.abs(node.position[2] - z) > clearance,
            ) &&
            trees.every(([tx, tz]) => Math.hypot(x - tx, z - tz) > 0.58)
          )
            cells.set(row * size + col, [x, z]);
        }
      const closest = (x: number, z: number) => {
        let best = -1,
          distance = Infinity;
        for (const [id, point] of cells) {
          const candidate = Math.hypot(point[0] - x, point[1] - z);
          if (candidate < distance) {
            best = id;
            distance = candidate;
          }
        }
        return best;
      };
      const anchors = districts.filter((item) => item.group === group.id);
      const neighborhoods = anchors.length
        ? anchors
        : [{ position: group.position, radius: group.radius * 0.78 }];
      const roles: IslandPersonRole[] =
        group.id === 'courts'
          ? ['citizen', 'judge', 'official']
          : group.id === 'prosecution'
            ? ['citizen', 'prosecutor', 'official']
            : group.id === 'police'
              ? ['citizen', 'police', 'official']
              : ['citizen', 'official', 'representative', 'citizen'];
      for (const [index, neighborhood] of neighborhoods.entries()) {
        const count = anchors.length ? 4 : 7;
        for (let i = 0; i < count; i++) {
          const angle = i * 2.39996 + index * 0.7;
          const r = neighborhood.radius * 0.68;
          const start = closest(
            neighborhood.position[0] + Math.cos(angle) * r,
            neighborhood.position[1] + Math.sin(angle) * r,
          );
          const end = closest(
            neighborhood.position[0] + Math.cos(angle + 1.9) * r,
            neighborhood.position[1] + Math.sin(angle + 1.9) * r,
          );
          const parents = new Map<number, number>([[start, -1]]),
            queue = [start];
          for (let n = 0; n < queue.length && !parents.has(end); n++) {
            const id = queue[n];
            for (const next of [
              id - size,
              id + size,
              ...(id % size ? [id - 1] : []),
              ...(id % size < size - 1 ? [id + 1] : []),
            ])
              if (cells.has(next) && !parents.has(next)) {
                parents.set(next, id);
                queue.push(next);
              }
          }
          // In a small courtyard, turn around within the connected space instead of crossing a building.
          const destination = parents.has(end)
            ? end
            : queue.reduce(
                (best, id) =>
                  Math.hypot(
                    cells.get(id)![0] - cells.get(start)![0],
                    cells.get(id)![1] - cells.get(start)![1],
                  ) >
                  Math.hypot(
                    cells.get(best)![0] - cells.get(start)![0],
                    cells.get(best)![1] - cells.get(start)![1],
                  )
                    ? id
                    : best,
                start,
              );
          if (start === destination) continue;
          const points: [number, number][] = [];
          for (let id = destination; id !== -1; id = parents.get(id)!) points.push(cells.get(id)!);
          points.reverse();
          const path = activityPath(points);
          walkers.push({
            group: group.id,
            role: roles[i % roles.length],
            path,
            speed: 0.38 + (i % 3) * 0.055,
            phase: (index * 7 + i * 13) % ((path.length * 2) / 0.4),
            variant: index + i,
          });
        }
      }
    }
    return { harbors, walkers, ferries };
  },
  activityPose(
    path: IslandActivityPath,
    seconds: number,
    speed: number,
    phase = 0,
    dwell = 2,
  ): IslandMotionPose {
    const duration = path.length / speed;
    const clock = (seconds + phase) % ((duration + dwell) * 2);
    const returning = clock >= duration + dwell;
    const elapsed = returning ? clock - duration - dwell : clock;
    const moving = elapsed < duration;
    const distance = returning
      ? path.length - Math.min(duration, elapsed) * speed
      : Math.min(duration, elapsed) * speed;
    let segment = 1;
    while (segment < path.distances.length - 1 && path.distances[segment] < distance) segment++;
    const a = path.points[segment - 1],
      b = path.points[segment];
    const portion =
      (distance - path.distances[segment - 1]) /
      (path.distances[segment] - path.distances[segment - 1]);
    const direction = returning ? -1 : 1;
    return {
      x: a[0] + (b[0] - a[0]) * portion,
      z: a[1] + (b[1] - a[1]) * portion,
      heading: Math.atan2((b[0] - a[0]) * direction, (b[1] - a[1]) * direction),
      moving,
    };
  },
  get(): IslandData {
    const config = IslandRepository.get();
    const civic = CivicService.get();
    const agencies = getAgencyDirectory();
    const justice = JusticeService.get();
    const nodes: Omit<IslandNode, 'building'>[] = [];
    const districts = config.districts.map((district) => {
      const group = config.groups.find((item) => item.id === district.group)!;
      return {
        ...district,
        position: [
          group.position[0] + district.offset[0],
          group.position[1] + district.offset[1],
        ] as [number, number],
      };
    });
    const connections: IslandData['connections'] = [...config.connections];
    for (const group of config.groups) {
      if (group.id === 'central' || group.id === 'local') {
        for (const role of CivicService.forScope(civic, group.id))
          nodes.push({
            id: `${group.id}-role-${role.id}`,
            group: group.id,
            name: role.name,
            kind: '角色',
            summary: role.summary,
            context: [...new Set([role.selection, role.appointment])].join(' '),
            duties: role.powers,
            life: [
              ...new Set([...(role.constituentServices?.items ?? []), ...role.performanceChecks]),
            ],
            limits: [
              ...new Set([
                ...role.limits,
                role.oversight,
                ...(role.constituentServices ? [role.constituentServices.notice] : []),
              ]),
            ],
            example: role.example,
            sourceIds: role.sourceIds,
            href: '/government/#government-agency-picker',
            position: [0, 0, 0],
          });
        for (const option of getScopedAgencyOptions(agencies, group.id)) {
          const inspection = getAgencyInspection(agencies, option);
          nodes.push({
            id: `${group.id}-agency-${option.id}`,
            group: group.id,
            name: inspection.name,
            kind: '機關與職能',
            summary: inspection.summary,
            context: [...new Set([inspection.context, ...inspection.coverages])].join(' '),
            duties: inspection.duties,
            life: inspection.lifeConnections,
            limits: inspection.limits,
            example: inspection.examples.join(' '),
            sourceIds: inspection.sourceIds,
            href: '/government/#agency-directory',
            position: [0, 0, 0],
          });
        }
        for (const relation of CivicService.related(civic, 'people', 'all', group.id)) {
          connections.push({
            from: `${group.id}-role-${relation.from}`,
            to: `${group.id}-role-${relation.to}`,
            label: relation.label,
            kind: relation.kind,
            fromLabel: relation.fromLabel,
            toLabel: relation.toLabel,
          });
        }
        for (const relation of civic.relations) {
          const from = `${group.id}-role-${relation.from}`,
            to = `${group.id}-role-${relation.to}`;
          if (
            nodes.some((n) => n.id === from) &&
            nodes.some((n) => n.id === to) &&
            !connections.some((r) => r.from === from && r.to === to && r.label === relation.label)
          )
            connections.push({
              from,
              to,
              label: relation.label,
              kind: relation.kind,
              fromLabel: relation.fromLabel,
              toLabel: relation.toLabel,
            });
        }
      } else {
        for (const entity of justice.entities.filter((e) => e.group === group.id))
          nodes.push({
            id: `${group.id}-justice-${entity.id}`,
            group: group.id,
            name: entity.name,
            kind: entity.kind,
            summary: entity.summary,
            context: entity.position,
            duties: entity.duties,
            life: [],
            limits: entity.limits,
            example: entity.example,
            sourceIds: entity.sourceIds,
            href: '/justice/#justice-directory',
            position: [0, 0, 0],
          });
      }
      const members = nodes.filter((n) => n.group === group.id);
      const groupDistricts = districts.filter((district) => district.group === group.id);
      if (groupDistricts.length) {
        for (const node of members) {
          const matches = groupDistricts.filter((district) => district.members.includes(node.id));
          if (matches.length !== 1) throw new Error(`公民島機關必須屬於一個分區：${node.id}`);
          const district = matches[0];
          const index = district.members.indexOf(node.id);
          const angle = ((index - 1) * Math.PI * 2) / Math.max(1, district.members.length - 1);
          const radius = index === 0 ? 0 : 3.25;
          node.districtId = district.id;
          node.position = [
            district.position[0] + Math.cos(angle) * radius,
            0.94,
            district.position[1] + Math.sin(angle) * radius,
          ];
        }
        for (const district of groupDistricts)
          for (const id of district.members)
            if (!members.some((node) => node.id === id))
              throw new Error(`公民島分區機關不存在：${id}`);
        continue;
      }
      // The smaller judicial islands retain a single, spacious neighbourhood.
      // Extra shoreline is a setback for the larger models, not more building density.
      const spread = Math.min(1, group.radius / 6.7);
      members.forEach((node, index) => {
        const radius =
          index === 0
            ? 0
            : (1.6 + 3.4 * Math.sqrt(index / Math.max(1, members.length - 1))) * spread;
        const angle = index * 2.399963;
        node.position = [
          group.position[0] + Math.cos(angle) * radius,
          0.94,
          group.position[1] + Math.sin(angle) * radius,
        ];
      });
    }
    for (const connection of connections) {
      if (
        !nodes.some((node) => node.id === connection.from) ||
        !nodes.some((node) => node.id === connection.to)
      )
        throw new Error(`公民島連線機關不存在：${connection.label}`);
    }
    for (const journey of config.journeys)
      for (const step of journey.steps) {
        if (!nodes.some((node) => node.id === step.nodeId))
          throw new Error(`公民島情境機關不存在：${step.nodeId}`);
      }
    const designs = new Map(config.buildingProfiles.map((profile) => [profile.nodeId, profile]));
    if (designs.size !== config.buildingProfiles.length) throw new Error('公民島建築設定 ID 重複');
    for (const id of designs.keys())
      if (!nodes.some((node) => node.id === id)) throw new Error(`公民島建築對應機關不存在：${id}`);
    const buildings: IslandNode[] = nodes.map((node) => {
      const design = designs.get(node.id);
      if (!design) throw new Error(`公民島缺少建築造型：${node.id}`);
      return {
        ...node,
        building: { style: design.style, accent: design.accent, variant: design.variant },
      };
    });
    return { ...config, districts, nodes: buildings, connections };
  },
  search(nodes: IslandNode[], query: string, group: IslandGroupId | 'all' = 'all') {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    return nodes.filter(
      (node) =>
        (group === 'all' || node.group === group) &&
        words.every((word) =>
          normalize([node.name, node.summary, node.kind, ...node.duties].join(' ')).includes(word),
        ),
    );
  },
};
