import * as THREE from 'three';
import type { IslandActivityPlan, IslandBuildingPainter } from '@/Model/IslandModel';
import { IslandService } from '@/Service/IslandService';

// Static harbor parts join the scene's material batches; moving miniatures use shared instances.
export function createIslandActivity(
  scene: THREE.Scene,
  painter: IslandBuildingPainter,
  plan: IslandActivityPlan,
) {
  for (const port of plan.harbors) {
    const cos = Math.cos(port.heading),
      sin = Math.sin(port.heading);
    const shape = (
      geometry: THREE.BufferGeometry,
      color: string,
      x: number,
      y: number,
      z: number,
      ry = 0,
    ) =>
      painter.add(
        geometry,
        color,
        port.position[0] + cos * x + sin * z,
        y,
        port.position[1] - sin * x + cos * z,
        1,
        1,
        1,
        port.heading + ry,
      );
    const box = (color: string, x: number, y: number, z: number, w: number, h: number, d: number) =>
      shape(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    const post = (color: string, x: number, y: number, z: number, r: number, h: number) =>
      shape(new THREE.CylinderGeometry(r, r, h, 8), color, x, y, z);
    const wood = '#b39268',
      stone = '#c7bd9f',
      white = '#f3eddc',
      dark = '#435c5c';
    // A broad quay sits across the shore, with two open slips beside a central jetty.
    box(stone, 0, -0.05, -0.55, 6.6, 1.85, 2.9);
    box('#e5d6b9', 0, 0.91, -0.55, 6.8, 0.16, 3);
    box(wood, 0, -0.05, 2.55, 1, 0.23, 4.5);
    box(wood, 0, -0.05, 0.9, 6.8, 0.23, 0.65);
    for (const x of [-3.1, 3.1]) box(wood, x, -0.05, 2.6, 0.65, 0.23, 4.2);
    for (let i = 0; i < 10; i++)
      box('#eee2c7', 0, 0.84 - i * 0.085, 1.02 + i * 0.13, 1.25, 0.15, 0.22);
    for (let z = 1.3; z < 4.8; z += 0.36) {
      box('#d0b187', 0, 0.08, z, 0.96, 0.025, 0.035);
      for (const x of [-3.1, 3.1]) box('#d0b187', x, 0.08, z, 0.62, 0.025, 0.035);
    }
    for (const x of [-3.1, 0, 3.1])
      for (const z of [1.3, 2.8, 4.5]) {
        post('#725b40', x, -0.7, z, 0.12, 1.7);
        post('#475650', x + (x === 0 ? 0.3 : -Math.sign(x) * 0.1), 0.17, z, 0.08, 0.2);
      }
    // Railings leave both water approaches open, rather than bridging over the slips.
    for (const x of [-3.36, 3.36]) {
      box(white, x, 0.62, 2.7, 0.055, 0.06, 3.5);
      for (const z of [1.1, 2.2, 3.3, 4.4]) post(white, x, 0.35, z, 0.04, 0.62);
    }
    // A sheltered waiting pavilion, glazed ticket counter, benches and a life ring.
    box(white, -1.65, 1.45, -1.25, 1.7, 0.92, 1.05);
    box('#6b9da7', -1.65, 1.52, -0.7, 1.33, 0.42, 0.045);
    box(port.color, -1.65, 1.99, -1.2, 2.15, 0.16, 1.65);
    for (const x of [-2.55, -0.75]) post(white, x, 1.47, -0.6, 0.045, 0.97);
    box(wood, 1.5, 1.22, -1, 1.55, 0.12, 0.4);
    box(wood, 1.5, 1.48, -1.2, 1.55, 0.38, 0.08);
    for (const x of [0.9, 2.1]) box(dark, x, 1.07, -1, 0.08, 0.28, 0.32);
    post(white, 0.65, 1.35, -1.48, 0.04, 0.78);
    shape(new THREE.TorusGeometry(0.2, 0.055, 5, 14), '#ce7950', 0.65, 1.35, -1.4);
    post('#d8d5c0', 3.05, 0.95, 4.55, 0.18, 1.75);
    post(port.color, 3.05, 1.1, 4.55, 0.19, 0.34);
    post('#f3ce83', 3.05, 1.9, 4.55, 0.18, 0.26);
    shape(new THREE.ConeGeometry(0.3, 0.23, 8), port.color, 3.05, 2.14, 4.55);
  }

  const activity = new THREE.Group();
  activity.name = 'island-activity';
  scene.add(activity);
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 });
  const pools: THREE.InstancedMesh[] = [];
  function pool(
    name: string,
    geometry: THREE.BufferGeometry,
    count: number,
    colors: string[],
    mat: THREE.Material = material,
  ) {
    const mesh = new THREE.InstancedMesh(geometry, mat, count);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    for (let i = 0; i < count; i++) mesh.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    activity.add(mesh);
    pools.push(mesh);
    return mesh;
  }
  const uniforms = {
    official: '#344d60',
    representative: '#9a6457',
    judge: '#343e42',
    prosecutor: '#425063',
    police: '#365c7f',
  };
  const clothing = plan.walkers.map((person) =>
    person.role === 'citizen'
      ? ['#c99a58', '#678c7b', '#bc775c', '#7f91a1'][person.variant % 4]
      : uniforms[person.role],
  );
  const skins = plan.walkers.map(
    (person) => ['#dfb38c', '#bc8966', '#edc9a3', '#cb9d77'][person.variant % 4],
  );
  const hairColors = plan.walkers.map(
    (person) => ['#3b3933', '#514034', '#8f8170', '#373b3e'][person.variant % 4],
  );
  const count = plan.walkers.length;
  const body = pool(
    'island-walkers-body',
    new THREE.CylinderGeometry(0.145, 0.17, 0.34, 6),
    count,
    clothing,
  );
  const heads = pool('island-walkers-head', new THREE.SphereGeometry(0.145, 8, 6), count, skins);
  const hair = pool(
    'island-walkers-hair',
    new THREE.SphereGeometry(0.15, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55),
    count,
    hairColors,
  );
  const legGeometry = new THREE.BoxGeometry(0.1, 0.27, 0.115).translate(0, -0.135, 0);
  const armGeometry = new THREE.BoxGeometry(0.09, 0.3, 0.1).translate(0, -0.15, 0);
  const leftLeg = pool('island-walkers-leg-left', legGeometry, count, [
    '#40515a',
    '#5e6358',
    '#354b59',
  ]);
  const rightLeg = pool('island-walkers-leg-right', legGeometry, count, [
    '#40515a',
    '#5e6358',
    '#354b59',
  ]);
  const leftArm = pool('island-walkers-arm-left', armGeometry, count, clothing);
  const rightArm = pool('island-walkers-arm-right', armGeometry, count, clothing);
  const collars = pool('island-walkers-collar', new THREE.BoxGeometry(0.1, 0.16, 0.025), count, [
    '#f2ebdb',
  ]);
  const bags = pool('island-walkers-bag', new THREE.BoxGeometry(0.15, 0.19, 0.09), count, [
    '#866347',
    '#b28c58',
    '#475c64',
  ]);
  const caps = pool('island-walkers-cap', new THREE.CylinderGeometry(0.16, 0.16, 0.085, 8), count, [
    '#334d66',
  ]);

  const boats = [
    ...plan.ferries.map((ferry) => ({ ferry, port: null, color: ferry.color })),
    ...plan.harbors.map((port) => ({ ferry: null, port, color: port.color })),
  ];
  const boatColors = boats.map((boat) => boat.color);
  const hullOutline = new THREE.Shape();
  hullOutline.moveTo(-0.55, -1.15);
  hullOutline.lineTo(0.55, -1.15);
  hullOutline.lineTo(0.61, 0.55);
  hullOutline.quadraticCurveTo(0.48, 1.05, 0, 1.42);
  hullOutline.quadraticCurveTo(-0.48, 1.05, -0.61, 0.55);
  hullOutline.closePath();
  const hullGeometry = new THREE.ExtrudeGeometry(hullOutline, {
    depth: 0.35,
    bevelEnabled: false,
    curveSegments: 4,
  });
  hullGeometry.rotateX(Math.PI / 2);
  hullGeometry.translate(0, 0.16, 0);
  const hulls = pool('island-ferries-hull', hullGeometry, boats.length, boatColors);
  const decks = pool(
    'island-ferries-deck',
    hullGeometry.clone().scale(0.91, 0.3, 0.9),
    boats.length,
    ['#e5dbc5'],
  );
  const cabins = pool(
    'island-ferries-cabin',
    new THREE.BoxGeometry(0.87, 0.56, 1.35),
    boats.length,
    ['#f5efdf'],
  );
  const roofs = pool(
    'island-ferries-roof',
    new THREE.BoxGeometry(1.05, 0.11, 1.7),
    boats.length,
    boatColors,
  );
  const windowsL = pool(
    'island-ferries-windows-left',
    new THREE.BoxGeometry(0.025, 0.27, 1.04),
    boats.length,
    ['#3e6676'],
  );
  const windowsR = pool(
    'island-ferries-windows-right',
    new THREE.BoxGeometry(0.025, 0.27, 1.04),
    boats.length,
    ['#3e6676'],
  );
  const windscreens = pool(
    'island-ferries-windscreen',
    new THREE.BoxGeometry(0.64, 0.24, 0.03),
    boats.length,
    ['#547f8c'],
  );
  const masts = pool(
    'island-ferries-mast',
    new THREE.CylinderGeometry(0.025, 0.025, 0.63, 5),
    boats.length,
    ['#c6c4af'],
  );
  const flags = pool(
    'island-ferries-flag',
    new THREE.BoxGeometry(0.26, 0.17, 0.025),
    boats.length,
    boatColors,
  );
  const sternRails = pool(
    'island-ferries-rail',
    new THREE.BoxGeometry(0.84, 0.065, 0.055),
    boats.length,
    ['#f5efdf'],
  );
  const wakeGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.55, 0, -1.15),
    new THREE.Vector3(-0.65, 0, -1.15),
    new THREE.Vector3(-1.1, 0, -3.5),
    new THREE.Vector3(0.55, 0, -1.15),
    new THREE.Vector3(1.1, 0, -3.5),
    new THREE.Vector3(0.65, 0, -1.15),
  ]);
  wakeGeometry.setIndex([0, 1, 2, 3, 4, 5]);
  const wakes = pool(
    'island-ferries-wake',
    wakeGeometry,
    boats.length,
    ['#ffffff'],
    new THREE.MeshBasicMaterial({
      color: '#d8f2f1',
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const dummy = new THREE.Object3D(),
    root = new THREE.Object3D(),
    matrix = new THREE.Matrix4();
  const walkerHeadings = plan.walkers.map(() => Number.NaN),
    boatHeadings = boats.map(() => Number.NaN);
  let previousTime = 0;
  function turn(previous: number, next: number, factor: number) {
    return Number.isNaN(previous)
      ? next
      : previous + Math.atan2(Math.sin(next - previous), Math.cos(next - previous)) * factor;
  }
  function place(
    mesh: THREE.InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    angle = 0,
    scale = 1,
  ) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(angle, 0, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    matrix.multiplyMatrices(root.matrix, dummy.matrix);
    mesh.setMatrixAt(i, matrix);
  }
  function update(seconds: number) {
    const delta = Math.min(0.1, Math.max(0, seconds - previousTime));
    previousTime = seconds;
    const turnFactor = 1 - Math.exp(-delta * 9);
    plan.walkers.forEach((walker, i) => {
      const pose = IslandService.activityPose(walker.path, seconds, walker.speed, walker.phase);
      walkerHeadings[i] = turn(walkerHeadings[i], pose.heading, turnFactor);
      const stride = pose.moving ? Math.sin((seconds + walker.phase) * 7.5) * 0.48 : 0;
      root.position.set(
        pose.x,
        1 + (pose.moving ? Math.abs(Math.sin((seconds + walker.phase) * 7.5)) * 0.018 : 0),
        pose.z,
      );
      root.rotation.set(0, walkerHeadings[i], 0);
      root.scale.setScalar(0.8 + (walker.variant % 3) * 0.04);
      root.updateMatrix();
      place(body, i, 0, 0.48, 0);
      place(heads, i, 0, 0.79, 0.01);
      place(hair, i, 0, 0.82, 0);
      place(leftLeg, i, -0.075, 0.3, 0, stride);
      place(rightLeg, i, 0.075, 0.3, 0, -stride);
      place(leftArm, i, -0.2, 0.61, 0, -stride * 0.75);
      place(rightArm, i, 0.2, 0.61, 0, stride * 0.75);
      place(collars, i, 0, 0.56, 0.14, 0, walker.role === 'citizen' ? 0 : 1);
      place(bags, i, 0.23, 0.26, 0, 0, walker.role === 'judge' || walker.role === 'police' ? 0 : 1);
      place(caps, i, 0, 0.93, 0.02, 0, walker.role === 'police' ? 1 : 0);
    });
    boats.forEach((boat, i) => {
      const ferry = boat.ferry;
      const port = boat.port;
      const pose = ferry
        ? IslandService.activityPose(ferry.path, seconds, ferry.speed, ferry.phase, 7)
        : {
            x: port!.position[0] + Math.sin(port!.heading) * 3.5 - Math.cos(port!.heading) * 1.6,
            z: port!.position[1] + Math.cos(port!.heading) * 3.5 + Math.sin(port!.heading) * 1.6,
            heading: port!.heading,
            moving: false,
          };
      boatHeadings[i] = turn(boatHeadings[i], pose.heading, turnFactor * 0.45);
      root.position.set(pose.x, -0.84 + Math.sin(seconds * 1.5 + i) * 0.027, pose.z);
      root.rotation.set(0, boatHeadings[i], Math.sin(seconds * 1.1 + i) * 0.018);
      root.scale.setScalar(ferry ? 0.78 : 0.65);
      root.updateMatrix();
      place(hulls, i, 0, 0, 0);
      place(decks, i, 0, 0.25, 0);
      place(cabins, i, 0, 0.56, -0.05);
      place(roofs, i, 0, 0.9, -0.05);
      place(windowsL, i, -0.45, 0.61, -0.05);
      place(windowsR, i, 0.45, 0.61, -0.05);
      place(windscreens, i, 0, 0.62, 0.64);
      place(masts, i, 0, 1.21, -0.5);
      place(flags, i, 0.14, 1.43, -0.5);
      place(sternRails, i, 0, 0.49, -1.02);
      place(wakes, i, 0, -0.09, 0, 0, pose.moving ? 1 : 0);
    });
    for (const mesh of pools) mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { update, dispose: () => pools.forEach((mesh) => mesh.dispose()) };
}
