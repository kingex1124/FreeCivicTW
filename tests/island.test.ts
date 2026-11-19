import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IslandService } from '../src/Service/IslandService';
import { CivicService } from '../src/Service/CivicService';
import { JusticeService } from '../src/Service/JusticeService';
import { getAgencyDirectory } from '../src/Service/AgencyService';
import { SourceService } from '../src/Service/SourceService';
import * as THREE from 'three';
import { paintIslandBuilding } from '../src/View/CivicIslandBuildingView';
import { createIslandActivity } from '../src/View/CivicIslandActivityView';
test('公民島涵蓋中央地方既有角色、部會局處及三類司法機關，情境與連線沒有遺失目標', () => {
  const data = IslandService.get();
  const expected =
    ['central', 'local'].reduce(
      (count, scope) =>
        count +
        CivicService.forScope(CivicService.get(), scope as 'central' | 'local').length +
        getAgencyDirectory().entries.filter((entry) => entry.group === scope).length,
      0,
    ) +
    JusticeService.get().entities.filter((entity) =>
      ['courts', 'prosecution', 'police'].includes(entity.group),
    ).length;
  assert.equal(data.nodes.length, expected);
  assert.equal(new Set(data.nodes.map((n) => n.id)).size, expected);
  assert.equal(
    data.connections.find(
      (connection) =>
        connection.from === 'central-role-president' && connection.to === 'central-role-premier',
    )?.fromLabel,
    '總統',
  );
  assert(
    data.connections
      .find(
        (connection) =>
          connection.from === 'central-role-president' &&
          connection.to === 'central-role-judiciary' &&
          connection.kind === 'consent',
      )
      ?.toLabel?.includes('大法官'),
  );
  for (const node of data.nodes) {
    assert(node.duties.length > 0);
    assert(node.limits.length > 0);
    assert.equal(SourceService.resolve(node.sourceIds).length, node.sourceIds.length);
    assert(node.position.every(Number.isFinite));
  }
  assert.equal(new Set(data.districts.map((district) => district.id)).size, data.districts.length);
  assert.equal(
    data.districts.flatMap((district) => district.members).length,
    data.nodes.filter((node) => node.group === 'central' || node.group === 'local').length,
  );
  for (const district of data.districts) {
    for (const id of district.members) {
      const node = data.nodes.find((item) => item.id === id)!;
      assert.equal(node.districtId, district.id);
      assert.equal(node.group, district.group);
      assert(
        Math.hypot(
          node.position[0] - district.position[0],
          node.position[2] - district.position[1],
        ) <
          district.radius - 0.5,
      );
    }
    for (const other of data.districts.filter(
      (item) => item.group === district.group && item.id !== district.id,
    ))
      assert(
        Math.hypot(
          district.position[0] - other.position[0],
          district.position[1] - other.position[1],
        ) >
          district.radius + other.radius,
      );
  }
  for (const [index, group] of data.groups.entries()) {
    const members = data.nodes.filter((node) => node.group === group.id);
    for (const node of members) {
      assert(
        Math.hypot(node.position[0] - group.position[0], node.position[2] - group.position[1]) <
          group.radius * Math.cos(Math.PI / 6) - 0.5,
        `${node.name} must stay on land`,
      );
    }
    for (const other of data.groups.slice(index + 1)) {
      assert(
        Math.hypot(group.position[0] - other.position[0], group.position[1] - other.position[1]) >
          group.radius + other.radius,
        `${group.name} must not overlap ${other.name}`,
      );
    }
    if (group.id === 'central' || group.id === 'local') {
      for (let i = 0; i < members.length; i++) {
        for (const other of members.slice(i + 1)) {
          assert(
            Math.hypot(
              members[i].position[0] - other.position[0],
              members[i].position[2] - other.position[2],
            ) >= 1.5,
            `${members[i].name} and ${other.name} need building clearance`,
          );
        }
      }
    }
  }
  for (const connection of data.connections)
    for (const id of [connection.from, connection.to])
      assert(data.nodes.some((node) => node.id === id));
  for (const journey of data.journeys)
    for (const step of journey.steps) assert(data.nodes.some((node) => node.id === step.nodeId));
  assert(data.journeys.find((j) => j.id === 'cabinet')!.steps.at(-1)!.reverse);
  assert(
    data.connections.some(
      (c) =>
        c.from === 'prosecution-justice-prosecutors' &&
        c.to === 'police-justice-judicial-police' &&
        c.label.includes('不是一般行政隸屬'),
    ),
  );
});
test('每個機關都有建築，模型不超過點選範圍與標籤高度，且保留機關之間的間距', () => {
  for (const node of IslandService.get().nodes) {
    const bounds = new THREE.Box3();
    const result = paintIslandBuilding(
      {
        add(geometry, _color, x, y, z, sx = 1, sy = 1, sz = 1, rotation = 0) {
          geometry.computeBoundingBox();
          const matrix = new THREE.Matrix4().compose(
            new THREE.Vector3(x, y, z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation, 0)),
            new THREE.Vector3(sx, sy, sz),
          );
          bounds.union(geometry.boundingBox!.clone().applyMatrix4(matrix));
          geometry.dispose();
        },
      },
      node.building,
      0,
      0,
      1,
    );
    assert(!bounds.isEmpty(), node.id);
    assert(
      bounds.min.x >= -result.width / 2 - 0.01 && bounds.max.x <= result.width / 2 + 0.01,
      `${node.id} exceeds width`,
    );
    assert(
      bounds.min.z >= -result.depth / 2 - 0.01 && bounds.max.z <= result.depth / 2 + 0.01,
      `${node.id} exceeds depth`,
    );
    assert(
      bounds.max.y <= 0.98 + result.height + 0.01,
      `${node.id} exceeds label height: ${bounds.max.y}`,
    );
    assert(bounds.min.y >= 0.96, `${node.id} sinks into the ground`);
  }
});

test('每座島都有人物與港口，步行避開建築、航線全程留在海面且往返停靠', () => {
  const data = IslandService.get();
  const plan = IslandService.planActivity(data);
  assert.equal(plan.harbors.length, data.groups.length);
  for (const group of data.groups) {
    assert(plan.walkers.filter((walker) => walker.group === group.id).length >= 4, group.id);
    assert(
      plan.ferries.some((ferry) => ferry.from === group.id || ferry.to === group.id),
      group.id,
    );
  }
  for (const walker of plan.walkers) {
    const group = data.groups.find((item) => item.id === walker.group)!;
    const duration = (walker.path.length / walker.speed + 2) * 2;
    for (let t = 0; t <= duration; t += 0.23) {
      const point = IslandService.activityPose(walker.path, t, walker.speed, walker.phase);
      assert(
        IslandService.isOnIsland(group, point.x, point.z, 0.64),
        `${walker.group}: walking off the island`,
      );
      assert(
        data.nodes
          .filter((node) => node.group === walker.group)
          .every(
            (node) =>
              Math.abs(point.x - node.position[0]) >= (walker.group === 'courts' ? 1.14 : 1.27) ||
              Math.abs(point.z - node.position[2]) >= (walker.group === 'courts' ? 1.14 : 1.27),
          ),
        `${walker.group}: walking through a building`,
      );
    }
  }
  for (const ferry of plan.ferries) {
    const from = plan.harbors.find((port) => port.group === ferry.from)!;
    const to = plan.harbors.find((port) => port.group === ferry.to)!;
    const duration = ferry.path.length / ferry.speed;
    const start = IslandService.activityPose(ferry.path, 0, ferry.speed, 0, 7);
    const arrival = IslandService.activityPose(ferry.path, duration + 3, ferry.speed, 0, 7);
    const returned = IslandService.activityPose(ferry.path, duration * 2 + 10, ferry.speed, 0, 7);
    assert(Math.hypot(start.x - from.berth[0], start.z - from.berth[1]) < 0.001);
    assert(Math.hypot(arrival.x - to.berth[0], arrival.z - to.berth[1]) < 0.001);
    assert(Math.hypot(returned.x - from.berth[0], returned.z - from.berth[1]) < 0.001);
    assert.equal(arrival.moving, false);
    assert.equal(returned.moving, false);
    for (let t = 0; t < duration * 2 + 14; t += 0.15) {
      const point = IslandService.activityPose(ferry.path, t, ferry.speed, 0, 7);
      assert(
        data.groups.every((group) => !IslandService.isOnIsland(group, point.x, point.z, -1.3)),
        `${ferry.id}: crossing land`,
      );
    }
  }
});

test('人物與船隻實際更新共享模型矩陣，同一時間保持穩定且可釋放動畫資源', () => {
  const scene = new THREE.Scene();
  const plan = IslandService.planActivity(IslandService.get());
  let harborShapes = 0;
  const activity = createIslandActivity(
    scene,
    {
      add(geometry) {
        harborShapes++;
        geometry.dispose();
      },
    },
    plan,
  );
  assert(harborShapes > 200);
  const body = scene.getObjectByName('island-walkers-body') as THREE.InstancedMesh;
  const ferry = scene.getObjectByName('island-ferries-hull') as THREE.InstancedMesh;
  const legs = scene.getObjectByName('island-walkers-leg-left') as THREE.InstancedMesh;
  const before = [...body.instanceMatrix.array],
    boatsBefore = [...ferry.instanceMatrix.array],
    legsBefore = [...legs.instanceMatrix.array];
  activity.update(12);
  assert.notDeepEqual([...body.instanceMatrix.array], before);
  assert.notDeepEqual([...ferry.instanceMatrix.array], boatsBefore);
  assert.notDeepEqual([...legs.instanceMatrix.array], legsBefore);
  const still = [...body.instanceMatrix.array];
  activity.update(12);
  assert.deepEqual([...body.instanceMatrix.array], still);
  let released = 0;
  scene.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.addEventListener('dispose', () => released++);
  });
  activity.dispose();
  assert(released > 0);
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((mat) =>
        materials.add(mat),
      );
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
});

test('公民島搜尋保留台臺正規化、多字詞交集與分類範圍，查不到不回傳預設機關', () => {
  const { nodes } = IslandService.get();
  assert.deepEqual(
    IslandService.search(nodes, '交通部').map((n) => n.id),
    IslandService.search(nodes, '  交通部  ').map((n) => n.id),
  );
  assert.deepEqual(
    IslandService.search(nodes, '台灣').map((n) => n.id),
    IslandService.search(nodes, '臺灣').map((n) => n.id),
  );
  assert(IslandService.search(nodes, '交通', 'local').every((n) => n.group === 'local'));
  assert(
    IslandService.search(nodes, '地方 法院', 'courts').some(
      (n) => n.id === 'courts-justice-district-courts',
    ),
  );
  assert.equal(IslandService.search(nodes, '這是不存在的機關XYZ').length, 0);
});
