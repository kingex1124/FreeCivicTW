'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { IslandSceneProps, IslandBuildingResult } from '@/Model/IslandModel';
import { paintIslandBuilding } from './CivicIslandBuildingView';
import { createIslandActivity } from './CivicIslandActivityView';
import { IslandService } from '@/Service/IslandService';

export default function CivicIslandSceneView(props: IslandSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const districtLabelsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const buildingLabelsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const labelLinesRef = useRef<(SVGLineElement | null)[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const live = useRef(props);
  const actions = useRef<((command: IslandSceneProps['command']) => void) | null>(null);
  useEffect(() => {
    live.current = props;
  }, [props]);
  const { groups, districts, nodes, activity, onSelect, onGroup, onDistrict, onStatus } = props;
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      });
    } catch {
      onStatus('unavailable');
      return;
    }
    const nativePixelRatio = Math.min(
      window.devicePixelRatio,
      window.innerWidth < 700 ? 1.25 : 1.75,
    );
    let renderQuality = 1;
    renderer.setPixelRatio(nativePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    const canvas = renderer.domElement;
    canvas.setAttribute(
      'aria-label',
      '公民島立體場景：滑鼠左鍵拖曳移動、右鍵拖曳旋轉，滾輪縮放；也可使用旁邊的機關清單操作',
    );
    canvas.setAttribute('role', 'img');
    canvas.dataset.islandCanvas = 'true';
    mount.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-30, 30, 22, -22, 0.1, 5000);
    const target = new THREE.Vector3(1, 0, 1);
    // An orthographic camera can sit farther away without changing the island scale.
    // This keeps the surrounding hills inside the clipping range at low viewing angles.
    const home = target.clone().add(new THREE.Vector3(35, 43, 42).multiplyScalar(12));
    camera.position.copy(home);
    camera.lookAt(target);
    const controls = new OrbitControls(camera, canvas);
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.65;
    controls.maxZoom = 28;
    controls.zoomToCursor = true;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI * 0.38;
    controls.enablePan = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let flight: {
      started: number;
      fromPosition: THREE.Vector3;
      toPosition: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
      fromZoom: number;
      toZoom: number;
    } | null = null;
    const cancelFlight = () => {
      flight = null;
      mount!.dataset.cameraMoving = 'false';
    };
    controls.addEventListener('start', cancelFlight);
    function fly(toTarget: THREE.Vector3, toZoom: number, toPosition?: THREE.Vector3) {
      mount!.dataset.cameraMoving = 'true';
      const destination = toPosition ?? camera.position.clone().sub(controls.target).add(toTarget);
      if (reduced) {
        camera.position.copy(destination);
        controls.target.copy(toTarget);
        camera.zoom = toZoom;
        camera.updateProjectionMatrix();
        controls.update();
        mount!.dataset.cameraMoving = 'false';
        return;
      }
      flight = {
        started: performance.now(),
        fromPosition: camera.position.clone(),
        toPosition: destination.clone(),
        fromTarget: controls.target.clone(),
        toTarget: toTarget.clone(),
        fromZoom: camera.zoom,
        toZoom,
      };
    }
    scene.add(new THREE.HemisphereLight('#fff9e7', '#6b8f79', 2.4));
    const sun = new THREE.DirectionalLight('#fff3d5', 3.1);
    sun.position.set(-18, 40, 22);
    scene.add(sun);
    const buckets = new Map<
      string,
      { material: THREE.MeshStandardMaterial; geometries: THREE.BufferGeometry[] }
    >();
    function add(
      geometry: THREE.BufferGeometry,
      color: string,
      x: number,
      y: number,
      z: number,
      sx = 1,
      sy = 1,
      sz = 1,
      ry = 0,
    ) {
      const shape = geometry.index ? geometry.toNonIndexed() : geometry;
      if (shape !== geometry) geometry.dispose();
      shape.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, y, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
          new THREE.Vector3(sx, sy, sz),
        ),
      );
      if (!buckets.has(color))
        buckets.set(color, {
          material: new THREE.MeshStandardMaterial({ color, roughness: 0.88 }),
          geometries: [],
        });
      buckets.get(color)!.geometries.push(shape);
    }
    function box(
      color: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      rotation = 0,
    ) {
      add(new THREE.BoxGeometry(w, h, d), color, x, y, z, 1, 1, 1, rotation);
    }
    function cylinder(
      color: string,
      x: number,
      y: number,
      z: number,
      radius: number,
      height: number,
      segments = 10,
    ) {
      add(new THREE.CylinderGeometry(radius, radius, height, segments), color, x, y, z);
    }
    const outlines: THREE.LineLoop[] = [];
    for (const group of groups) {
      const [x, z] = group.position;
      const landScale = group.radius / 6.7;
      cylinder('#8f9369', x, -0.14, z, group.radius, 1.3, 6);
      cylinder('#d6c39b', x, 0.42, z, 6.82 * landScale, 0.35, 6);
      cylinder('#a8bf8c', x, 0.67, z, 6.66 * landScale, 0.26, 6);
      cylinder('#b7cc9e', x, 0.83, z, 6.38 * landScale, 0.08, 6);
      cylinder('#e5d9b8', x, 0.9, z, 1.2, 0.06, 32);
      const perimeter = new THREE.BufferGeometry().setFromPoints(
        Array.from(
          { length: 6 },
          (_, index) =>
            new THREE.Vector3(
              x + Math.sin((index * Math.PI) / 3) * 6.9 * landScale,
              0.88,
              z + Math.cos((index * Math.PI) / 3) * 6.9 * landScale,
            ),
        ),
      );
      const outline = new THREE.LineLoop(
        perimeter,
        new THREE.LineBasicMaterial({ color: group.color, transparent: true, opacity: 0.65 }),
      );
      scene.add(outline);
      outlines.push(outline);
      for (let index = 0; index < Math.round(16 * landScale); index++) {
        const angle = index * 2.39996,
          radius = (5.4 + (index % 3) * 0.23) * landScale;
        const tx = x + Math.cos(angle) * radius,
          tz = z + Math.sin(angle) * radius;
        cylinder('#927a54', tx, 1.12, tz, 0.09, 0.65, 6);
        add(new THREE.ConeGeometry(0.35, 0.95, 7), index % 2 ? '#487b55' : '#6c9562', tx, 1.68, tz);
      }
    }
    for (const district of districts) {
      const [x, z] = district.position;
      const group = groups.find((item) => item.id === district.group)!;
      cylinder(district.color, x, 0.94, z, district.radius, 0.035, 32);
      const dx = x - group.position[0],
        dz = z - group.position[1];
      const distance = Math.hypot(dx, dz);
      if (distance > 0)
        box(
          '#e9dfc7',
          (x + group.position[0]) / 2,
          0.96,
          (z + group.position[1]) / 2,
          0.55,
          0.025,
          distance,
          Math.atan2(dx, dz),
        );
      // A planted edge makes each learning neighbourhood visible without adding labels.
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3 + 0.5;
        const tx = x + Math.cos(angle) * (district.radius - 0.25);
        const tz = z + Math.sin(angle) * (district.radius - 0.25);
        cylinder('#927a54', tx, 1.12, tz, 0.08, 0.5, 6);
        add(new THREE.ConeGeometry(0.3, 0.85, 7), '#6c9562', tx, 1.62, tz);
      }
    }
    const pickGeometry = new THREE.BoxGeometry(1.1, 2.5, 1.1);
    const pickMaterial = new THREE.MeshBasicMaterial();
    const targets: THREE.Mesh[] = [];
    const buildingSizes = new Map<string, IslandBuildingResult>();
    for (const node of nodes) {
      const [x, , z] = node.position;
      const scale =
        node.building.style === 'presidential'
          ? 0.95
          : node.group === 'courts'
            ? 0.84
            : node.group === 'central' || node.group === 'local'
              ? 0.9
              : 0.96;
      const size = paintIslandBuilding({ add }, node.building, x, z, scale);
      buildingSizes.set(node.id, size);
      const proxy = new THREE.Mesh(pickGeometry, pickMaterial);
      proxy.position.set(x, 0.98 + size.height / 2, z);
      proxy.scale.set((size.width + 0.08) / 1.1, size.height / 2.5, (size.depth + 0.08) / 1.1);
      proxy.userData.nodeId = node.id;
      proxy.updateMatrixWorld();
      targets.push(proxy);
    }
    // A continuous coast surrounds the teaching islands, leaving the inner bay open.
    const coastBase = Math.ceil(
      Math.max(...groups.map((group) => Math.hypot(...group.position) + group.radius)) + 24,
    );
    const coastRadius = (angle: number) =>
      coastBase +
      Math.sin(angle * 3 + 0.4) * 5 +
      Math.sin(angle * 7 - 0.8) * 3 +
      Math.cos(angle * 11) * 1.5;
    const bands = [
      0, 3, 8, 18, 32, 48, 72, 104, 145, 185, 230, 285, 350, 430, 520, 630, 760, 920, 1120, 1380,
      1700, 2100, 2600, 3200,
    ];
    const elevations = [
      -0.96, -0.65, 0.5, 4, 10, 18, 28, 35, 44, 48, 52, 56, 60, 64, 68, 72, 74, 78, 80, 82, 84, 86,
      88, 90,
    ];
    const landHeight = (distance: number, angle: number) => {
      const nextBand = bands.findIndex((edge) => edge > distance);
      const band = nextBand < 0 ? bands.length - 2 : Math.max(0, nextBand - 1);
      const t = THREE.MathUtils.clamp(
        (distance - bands[band]) / (bands[band + 1] - bands[band]),
        0,
        1,
      );
      const base = THREE.MathUtils.lerp(elevations[band], elevations[band + 1], t);
      const ridge =
        0.68 +
        0.25 * Math.sin(angle * 5 + 0.7 + distance * 0.017) +
        0.17 * Math.cos(angle * 9 - 0.6 - distance * 0.011);
      return base <= 0.5 ? base : base * ridge;
    };
    const landPoint = (distance: number, angle: number) => {
      angle += 0.012 * Math.sin(angle * 9 + distance * 0.07) * Math.min(1, distance / 18);
      const radius = coastRadius(angle) + distance;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        landHeight(distance, angle),
        Math.sin(angle) * radius,
      );
    };
    const terrainPositions: number[] = [],
      terrainColors: number[] = [];
    const segments = 112;
    const landPalette = ['#b1a881', '#a9ad7c', '#8ea365', '#7f985c', '#708951', '#617b48'];
    for (let sector = 0; sector < segments; sector++) {
      const a = (sector * Math.PI * 2) / segments,
        b = ((sector + 1) * Math.PI * 2) / segments;
      for (let band = 0; band < bands.length - 1; band++) {
        const p = landPoint(bands[band], a),
          q = landPoint(bands[band], b);
        const r = landPoint(bands[band + 1], a),
          s = landPoint(bands[band + 1], b);
        const color = new THREE.Color(
          landPalette[Math.min(landPalette.length - 1, Math.floor(band * 0.7))],
        );
        color.offsetHSL(0, 0, (((sector * 13 + band * 7) % 9) - 4) * 0.006);
        for (const vertex of [p, q, r, q, s, r]) {
          terrainPositions.push(...vertex.toArray());
          terrainColors.push(color.r, color.g, color.b);
        }
      }
    }
    const terrainGeometry = new THREE.BufferGeometry();
    terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(terrainPositions, 3));
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
    terrainGeometry.computeVertexNormals();
    const terrain = new THREE.Mesh(
      terrainGeometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
    );
    scene.add(terrain);
    const seed = (n: number) => {
      const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let n = 0; n < 950; n++) {
      const angle = n * 2.399963;
      const distance = 8 + seed(n + 1) ** 2 * 125;
      const position = landPoint(distance, angle);
      const height = 1.8 + seed(n + 29) * 2;
      cylinder(
        '#756545',
        position.x,
        position.y + height * 0.22,
        position.z,
        0.12,
        height * 0.44,
        5,
      );
      const color = ['#315e43', '#416b49', '#527b4e', '#3b6443'][n % 4];
      if (n % 3)
        add(
          new THREE.ConeGeometry(height * 0.29, height * 0.82, 6),
          color,
          position.x,
          position.y + height * 0.69,
          position.z,
        );
      else
        add(
          new THREE.IcosahedronGeometry(height * 0.34, 0),
          color,
          position.x,
          position.y + height * 0.72,
          position.z,
          1,
          1.12,
          1,
        );
    }
    for (let n = 0; n < 150; n++) {
      const angle = n * 2.399963 + 0.8;
      const position = landPoint(1.5 + seed(n + 203) * 13, angle);
      const size = 0.45 + seed(n + 411) * 0.9;
      add(
        new THREE.IcosahedronGeometry(size, 0),
        n % 2 ? '#938e74' : '#a29b7e',
        position.x,
        position.y + size * 0.35,
        position.z,
        1.3,
        0.7,
        0.9,
        angle,
      );
    }
    const activityPlan = IslandService.planActivity({ groups, districts, nodes, activity });
    const islandActivity = createIslandActivity(scene, { add }, activityPlan);
    canvas.dataset.harborCount = String(activityPlan.harbors.length);
    canvas.dataset.walkerCount = String(activityPlan.walkers.length);
    canvas.dataset.ferryCount = String(activityPlan.ferries.length);
    // Merge static objects by material: scenery adds only a few draw calls.
    for (const bucket of buckets.values()) {
      const geometry = mergeGeometries(bucket.geometries, false);
      if (geometry) scene.add(new THREE.Mesh(geometry, bucket.material));
      for (const shape of bucket.geometries) shape.dispose();
    }
    const waterMaterial = new THREE.MeshBasicMaterial({
      color: '#64acc8',
      toneMapped: false,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), waterMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -1;
    scene.add(sea);
    const waves = new THREE.Group();
    const waveMaterial = new THREE.LineBasicMaterial({
      color: '#d6f0f7',
      transparent: true,
      opacity: 0.38,
    });
    for (let n = 0; n < 220; n++) {
      const x = Math.sin(n * 74.23) * 83,
        z = Math.cos(n * 19.43) * 83;
      if (Math.hypot(x, z) > coastRadius(Math.atan2(z, x)) - 4) continue;
      const points = Array.from(
        { length: 9 },
        (_, i) => new THREE.Vector3(x + i * 0.16, -0.91, z + Math.sin(i * 0.5) * 0.1),
      );
      waves.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), waveMaterial));
    }
    scene.add(waves);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.045, 6, 48),
      new THREE.MeshBasicMaterial({ color: '#c19136' }),
    );
    halo.rotation.x = -Math.PI / 2;
    scene.add(halo);
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 3.8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffe8a6', transparent: true, opacity: 0.65 }),
    );
    scene.add(beacon);
    const links = new THREE.Group();
    scene.add(links);
    let linkKey = '';
    let curves: THREE.CatmullRomCurve3[] = [];
    const travellers: THREE.Mesh[] = [];
    function disposeGroup(group: THREE.Group) {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      group.clear();
    }
    function refreshLinks() {
      const key = JSON.stringify(live.current.connections);
      if (key === linkKey) return;
      linkKey = key;
      disposeGroup(links);
      curves = [];
      travellers.length = 0;
      for (const link of live.current.connections) {
        const from = nodes.find((node) => node.id === link.from),
          to = nodes.find((node) => node.id === link.to);
        if (!from || !to) continue;
        const a = new THREE.Vector3(...from.position),
          b = new THREE.Vector3(...to.position);
        a.y += 1.1;
        b.y += 1.1;
        const mid = a.clone().lerp(b, 0.5);
        mid.y += Math.min(5, a.distanceTo(b) * 0.23 + 1.2);
        const curve = new THREE.CatmullRomCurve3([a, mid, b]);
        curves.push(curve);
        const color =
          link.kind === 'oversight'
            ? '#477ea0'
            : link.kind === 'appointment'
              ? '#b37c35'
              : link.kind === 'consent'
                ? '#916994'
                : '#357c66';
        links.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(curve, 28, 0.055, 5, false),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
          ),
        );
        const arrow = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 0.45, 7),
          new THREE.MeshBasicMaterial({ color }),
        );
        arrow.position.copy(curve.getPoint(0.92));
        arrow.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          curve.getTangent(0.92).normalize(),
        );
        links.add(arrow);
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 7, 6),
          new THREE.MeshBasicMaterial({ color: '#fff6d4' }),
        );
        links.add(dot);
        travellers.push(dot);
      }
    }
    const theme = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      const color = dark ? '#163c58' : '#64acc8';
      scene.background = new THREE.Color(color);
      waterMaterial.color.set(color);
      waveMaterial.opacity = dark ? 0.16 : 0.38;
      sun.intensity = dark ? 1.5 : 3.1;
    };
    theme();
    const themeObserver = new MutationObserver(theme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    // Fit the whole archipelago at any aspect ratio, including a collapsed search panel.
    camera.updateMatrixWorld();
    const horizontal = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const vertical = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const halfWidth = Math.max(
      ...groups.map((group) => {
        const offset = new THREE.Vector3(group.position[0], 1, group.position[1]).sub(target);
        return Math.abs(offset.dot(horizontal)) + group.radius * 1.04;
      }),
    );
    const halfHeight = Math.max(
      ...groups.map((group) => {
        const offset = new THREE.Vector3(group.position[0], 1, group.position[1]).sub(target);
        return (
          Math.abs(offset.dot(vertical)) + group.radius * Math.hypot(vertical.x, vertical.z) + 3
        );
      }),
    );
    function resize() {
      const width = mount!.clientWidth,
        height = mount!.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const span = Math.max((halfWidth * 2) / 0.9, (((halfHeight * 2) / 0.78) * width) / height),
        heightSpan = span / (width / height);
      camera.left = -span / 2;
      camera.right = span / 2;
      camera.top = heightSpan / 2;
      camera.bottom = -heightSpan / 2;
      camera.updateProjectionMatrix();
    }
    // A sliding sidebar changes width on every animation frame. Allocate the WebGL
    // drawing buffer once it settles instead of reallocating it dozens of times.
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    });
    resizeObserver.observe(mount);
    resize();
    mount.dataset.cameraMoving = 'false';
    mount.dataset.renderQuality = '1.00';
    const groupZoom = (group: IslandSceneProps['groups'][number]) =>
      THREE.MathUtils.clamp(
        Math.min(
          (camera.right - camera.left) / (group.radius * 2.55),
          (camera.top - camera.bottom) / (group.radius * 2.55),
        ),
        1.7,
        controls.maxZoom,
      );
    const districtZoom = (district: IslandSceneProps['districts'][number]) =>
      Math.min(
        controls.maxZoom,
        Math.min(camera.right - camera.left, camera.top - camera.bottom) / (district.radius * 2.8),
      );
    actions.current = (command) => {
      const kind = command.kind;
      if (kind === 'in')
        fly(controls.target.clone(), Math.min(controls.maxZoom, camera.zoom * 1.3));
      if (kind === 'out')
        fly(controls.target.clone(), Math.max(controls.minZoom, camera.zoom / 1.3));
      if (kind === 'reset') fly(target.clone(), 1, home.clone());
      if (kind === 'top')
        fly(
          controls.target.clone(),
          camera.zoom,
          controls.target.clone().add(new THREE.Vector3(0, 860, 0.02)),
        );
      if (kind === 'group') {
        const group = groups.find((item) => item.id === command.targetId);
        if (group)
          fly(new THREE.Vector3(group.position[0], 0, group.position[1]), groupZoom(group));
      }
      if (kind === 'district') {
        const district = districts.find((item) => item.id === command.targetId);
        if (district)
          fly(
            new THREE.Vector3(district.position[0], 0, district.position[1]),
            districtZoom(district),
          );
      }
      if (kind === 'node') {
        const node = nodes.find((item) => item.id === command.targetId);
        if (!node) return;
        const group = groups.find((item) => item.id === node.group)!;
        const district = districts.find((item) => item.id === node.districtId);
        const zoom = district
          ? districtZoom(district)
          : Math.max(groupZoom(group), Math.min(5, camera.zoom));
        const center = district?.position ?? group.position;
        const aim = new THREE.Vector3(center[0], 0, center[1]);
        if (window.innerWidth > 1000) {
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
          aim.addScaledVector(right, (-(camera.right - camera.left) / zoom) * 0.15);
        }
        fly(aim, zoom);
      }
    };
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    function hit(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const selected = raycaster.intersectObjects(targets, false)[0];
      if (!selected) return undefined;
      const land = raycaster.intersectObject(terrain, false)[0];
      if (land && land.distance < selected.distance) return undefined;
      return selected.object.userData.nodeId as string;
    }
    let down: [number, number] = [0, 0];
    const pointerDown = (event: PointerEvent) => {
      down = [event.clientX, event.clientY];
      hoveredIdRef.current = null;
    };
    const pointerUp = (event: PointerEvent) => {
      if (event.button === 0 && Math.hypot(event.clientX - down[0], event.clientY - down[1]) < 7) {
        const id = hit(event);
        if (id) onSelect(id);
      }
    };
    const pointerMove = (event: PointerEvent) => {
      const id = event.buttons === 0 ? hit(event) : undefined;
      hoveredIdRef.current = id ?? null;
      canvas.style.cursor = event.buttons ? 'grabbing' : id ? 'pointer' : 'grab';
    };
    const pointerLeave = (event: PointerEvent) => {
      if (!(
        event.relatedTarget instanceof Element &&
        event.relatedTarget.closest('.island-building-label')
      ))
        hoveredIdRef.current = null;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerleave', pointerLeave);
    let raf = 0,
      disposed = false,
      visible = true,
      last = 0,
      activitySeconds = 0,
      slowFrames = 0;
    const projection = new THREE.Vector3();
    let lastLabelLayout = '';
    function positionLabels() {
      const width = mount!.clientWidth,
        height = mount!.clientHeight;
      const noteIsOpen = mount!.closest('.island-map')?.getAttribute('data-note-open') === 'true';
      const journeyIsActive = live.current.connections.some(
        (connection) => connection.kind === 'journey',
      );
      const layoutKey =
        [
          ...camera.position.toArray(),
          ...camera.quaternion.toArray(),
          camera.zoom,
          camera.left,
          camera.right,
          camera.top,
          camera.bottom,
        ]
          .map((value) => value.toFixed(4))
          .join(',') +
        `:${width}:${height}:${live.current.activeGroup}:${noteIsOpen}:${journeyIsActive}:${document.documentElement.style.fontSize}:${hoveredIdRef.current}:${live.current.highlightSelected}:${live.current.selectedId}`;
      if (layoutKey === lastLabelLayout) return;
      lastLabelLayout = layoutKey;
      const nearest = groups.reduce(
        (best, group) => {
          const distance = Math.hypot(
            group.position[0] - controls.target.x,
            group.position[1] - controls.target.z,
          );
          return distance < best.distance ? { id: group.id, distance } : best;
        },
        { id: groups[0].id, distance: Infinity },
      );
      const nearestGroup = groups.find((group) => group.id === nearest.id)!;
      const detailGroup = camera.zoom >= groupZoom(nearestGroup) * 0.72 ? nearest.id : null;
      const eligibleDistricts = districts.filter((district) => district.group === detailGroup);
      const nearestDistrict = eligibleDistricts.reduce<
        IslandSceneProps['districts'][number] | null
      >((best, district) => {
        const distance = (item: IslandSceneProps['districts'][number]) =>
          Math.hypot(item.position[0] - controls.target.x, item.position[1] - controls.target.z);
        return !best || distance(district) < distance(best) ? district : best;
      }, null);
      const detailDistrict =
        nearestDistrict &&
        camera.zoom >= districtZoom(nearestDistrict) * 0.7 &&
        Math.hypot(
          nearestDistrict.position[0] - controls.target.x,
          nearestDistrict.position[1] - controls.target.z,
        ) <
          nearestDistrict.radius * 1.65
          ? nearestDistrict
          : null;
      mount!.dataset.detailGroup = detailGroup ?? 'all';
      mount!.dataset.detailDistrict = detailDistrict?.id ?? 'all';
      const placements: {
        element: HTMLButtonElement;
        line: SVGLineElement | null;
        anchorX: number;
        anchorY: number;
        x: number;
        y: number;
        w: number;
        h: number;
      }[] = [];
      function addLabel(
        element: HTMLButtonElement | null,
        line: SVGLineElement | null,
        world: THREE.Vector3,
        show: boolean,
      ) {
        if (!element) return;
        projection.copy(world).project(camera);
        const inFrame = Math.abs(projection.x) < 1.1 && Math.abs(projection.y) < 1.1;
        const hidden = !show || !inFrame;
        if (element.hidden !== hidden) element.hidden = hidden;
        if (line) line.style.display = element.hidden ? 'none' : 'block';
        if (element.hidden) return;
        const anchorX = (projection.x + 1) * 0.5 * width,
          anchorY = (-projection.y + 1) * 0.5 * height;
        placements.push({
          element,
          line,
          anchorX,
          anchorY,
          x: anchorX,
          y: anchorY - 14,
          w: element.offsetWidth,
          h: element.offsetHeight,
        });
      }
      groups.forEach((group, index) =>
        addLabel(
          labelsRef.current[index],
          null,
          new THREE.Vector3(group.position[0], 0.9, group.position[1] + group.radius * 0.79),
          !detailDistrict &&
            (!detailGroup || (group.id === detailGroup && !eligibleDistricts.length)),
        ),
      );
      districts.forEach((district, index) =>
        addLabel(
          districtLabelsRef.current[index],
          null,
          new THREE.Vector3(district.position[0], 1, district.position[1] + district.radius * 0.85),
          district.group === detailGroup && (!detailDistrict || detailDistrict.id === district.id),
        ),
      );
      nodes.forEach((node, index) =>
        addLabel(
          buildingLabelsRef.current[index],
          labelLinesRef.current[index],
          new THREE.Vector3(
            node.position[0],
            Math.max(2.2, 0.98 + (buildingSizes.get(node.id)?.height ?? 1.4) + 0.25),
            node.position[2],
          ),
          (node.districtId ? node.districtId === detailDistrict?.id : node.group === detailGroup) ||
            node.id === hoveredIdRef.current ||
            (live.current.highlightSelected && node.id === live.current.selectedId),
        ),
      );
      const lower = height - (journeyIsActive ? 140 : 68);
      const intro = mount!.closest('.island-map')?.querySelector('.island-map-intro');
      const introBottom = intro
        ? intro.getBoundingClientRect().bottom - mount!.getBoundingClientRect().top + 8
        : 140;
      const top = noteIsOpen ? 62 : Math.min(introBottom, height * 0.45);
      for (let pass = 0; pass < 26; pass++) {
        for (let i = 0; i < placements.length; i++)
          for (let j = i + 1; j < placements.length; j++) {
            const a = placements[i],
              b = placements[j];
            const dx = b.x - a.x,
              dy = b.y - a.y;
            const overlapX = (a.w + b.w) / 2 + 7 - Math.abs(dx),
              overlapY = (a.h + b.h) / 2 + 7 - Math.abs(dy);
            if (overlapX > 0 && overlapY > 0) {
              if (overlapX / ((a.w + b.w) / 2) < overlapY / ((a.h + b.h) / 2)) {
                const push = overlapX * 0.51 * (dx >= 0 ? 1 : -1);
                a.x -= push;
                b.x += push;
              } else {
                const push = overlapY * 0.51 * (dy >= 0 ? 1 : -1);
                a.y -= push;
                b.y += push;
              }
            }
          }
        for (const point of placements) {
          const rightGap = Math.abs(point.y - height * 0.5) < point.h / 2 + 55 ? 52 : 8;
          point.x = Math.max(point.w / 2 + 8, Math.min(width - point.w / 2 - rightGap, point.x));
          point.y = Math.max(top + point.h / 2, Math.min(lower - point.h / 2, point.y));
        }
      }
      // Long names and enlarged text need a firmer layout on narrow screens.
      // Keep the leader lines attached to buildings while moving labels into free space.
      if (width < 700 && !noteIsOpen) {
        const overlaps = (
          a: { x: number; y: number; w: number; h: number },
          b: { x: number; y: number; w: number; h: number },
          gap = 6,
        ) =>
          Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap &&
          Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;
        const mountRect = mount!.getBoundingClientRect();
        const obstacles = Array.from(
          mount!
            .closest('.island-map')
            ?.querySelectorAll('.island-panel-toggle,.island-map-controls,.island-map-intro') ?? [],
        ).map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.x - mountRect.x + rect.width / 2,
            y: rect.y - mountRect.y + rect.height / 2,
            w: rect.width,
            h: rect.height,
          };
        });
        const crowded = placements.some(
          (point, index) =>
            obstacles.some((obstacle) => overlaps(point, obstacle)) ||
            placements.slice(index + 1).some((other) => overlaps(point, other, 1)),
        );
        if (crowded) {
          const placed: typeof placements = [];
          const order = [...placements].sort((a, b) => b.h - a.h || b.w - a.w);
          for (const point of order) {
            let best: { x: number; y: number; cost: number } | null = null;
            for (const x of [point.w / 2 + 8, width - point.w / 2 - 8]) {
              for (let y = top + point.h / 2; y <= lower - point.h / 2; y += 4) {
                const candidate = { x, y, w: point.w, h: point.h };
                if (
                  obstacles.some((obstacle) => overlaps(candidate, obstacle)) ||
                  placed.some((other) => overlaps(candidate, other))
                )
                  continue;
                const cost = (x - point.anchorX) ** 2 + (y - point.anchorY + 14) ** 2;
                if (!best || cost < best.cost) best = { x, y, cost };
              }
            }
            if (best) {
              point.x = best.x;
              point.y = best.y;
            }
            placed.push(point);
          }
        }
      }
      for (const point of placements) {
        point.element.style.transform = `translate(-50%, -50%) translate(${Math.round(point.x)}px,${Math.round(point.y)}px)`;
        if (point.line) {
          point.line.setAttribute('x1', String(point.anchorX));
          point.line.setAttribute('y1', String(point.anchorY));
          point.line.setAttribute('x2', String(point.x));
          point.line.setAttribute('y2', String(point.y));
        }
      }
    }
    function render(time: number) {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      raf = requestAnimationFrame(render);
      // Leave main-thread time for labels, search, keyboard and pointer input.
      // Animation uses elapsed time, so a 30fps render budget does not slow walking or sailing.
      if (time - last < 1000 / 30) return;
      const frameInterval = time - last;
      if (last && frameInterval > 70 && frameInterval < 1000) slowFrames++;
      else if (frameInterval < 50) slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames >= 8 && renderQuality > 0.6) {
        renderQuality = Math.max(0.6, renderQuality * 0.8);
        renderer.setPixelRatio(Math.max(0.6, nativePixelRatio * renderQuality));
        slowFrames = 0;
        mount!.dataset.renderQuality = renderQuality.toFixed(2);
      }
      // Advance only visible frames, avoiding a jump after a hidden tab resumes.
      const delta = last ? Math.min(0.1, (time - last) / 1000) : 0;
      last = time;
      activitySeconds += delta;
      islandActivity.update(reduced ? 0 : activitySeconds);
      if (flight) {
        const progress = Math.min(1, (time - flight.started) / 850),
          eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
        controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
        camera.zoom = THREE.MathUtils.lerp(flight.fromZoom, flight.toZoom, eased);
        camera.updateProjectionMatrix();
        if (progress === 1) {
          flight = null;
          mount!.dataset.cameraMoving = 'false';
        }
      }
      controls.update();
      refreshLinks();
      const selected = nodes.find((node) => node.id === live.current.selectedId);
      if (selected) {
        const size = buildingSizes.get(selected.id)!;
        halo.position.set(selected.position[0], 1.09, selected.position[2]);
        beacon.position.set(
          selected.position[0],
          0.98 + Math.max(3.8, size.height) / 2,
          selected.position[2],
        );
        beacon.scale.y = Math.max(1, size.height / 3.8);
        halo.scale.setScalar(
          Math.max(1, size.width * 0.62) * (reduced ? 1 : 1 + Math.sin(time * 0.003) * 0.1),
        );
      }
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        (outlines[i].material as THREE.LineBasicMaterial).opacity =
          live.current.activeGroup === 'all' || group.id === live.current.activeGroup ? 1 : 0.25;
      }
      camera.updateMatrixWorld();
      positionLabels();
      if (!reduced) {
        waves.position.x = Math.sin(time * 0.0002) * 0.3;
      }
      travellers.forEach((dot, index) =>
        dot.position.copy(
          curves[index].getPoint(reduced ? 0.55 : (time * 0.0002 + index * 0.17) % 1),
        ),
      );
      renderer.render(scene, camera);
    }
    const start = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(render);
    };
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    });
    intersection.observe(mount);
    const visibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener('visibilitychange', visibility);
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
      disposed = true;
      onStatus('unavailable');
    };
    canvas.addEventListener('webglcontextlost', lost);
    onStatus('ready');
    start();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('webglcontextlost', lost);
      controls.dispose();
      controls.removeEventListener('start', cancelFlight);
      islandActivity.dispose();
      actions.current = null;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(
            (material) => materials.add(material),
          );
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      pickGeometry.dispose();
      pickMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [groups, districts, nodes, activity, onSelect, onGroup, onStatus]);
  useEffect(() => {
    actions.current?.(props.command);
  }, [props.command]);
  return (
    <div className="island-three-layer">
      <div className="island-three-canvas" ref={mountRef} />
      <div className="island-world-labels">
        <svg className="island-label-lines" aria-hidden="true">
          {nodes.map((node, index) => (
            <line
              key={node.id}
              ref={(element) => {
                labelLinesRef.current[index] = element;
              }}
            />
          ))}
        </svg>
        {groups.map((group, index) => (
          <button
            ref={(element) => {
              labelsRef.current[index] = element;
            }}
            type="button"
            key={group.id}
            className="island-world-label"
            data-group-id={group.id}
            aria-pressed={props.activeGroup === group.id}
            onClick={() => onGroup(group.id)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{group.name}</strong>
          </button>
        ))}
        {districts.map((district, index) => (
          <button
            key={district.id}
            ref={(element) => {
              districtLabelsRef.current[index] = element;
            }}
            type="button"
            hidden
            className="island-district-label"
            data-district-id={district.id}
            title={`拉近${district.name}分區`}
            onClick={() => onDistrict(district.id)}
          >
            <strong>{district.name}</strong>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
        {nodes.map((node, index) => (
          <button
            key={node.id}
            ref={(element) => {
              buildingLabelsRef.current[index] = element;
            }}
            type="button"
            className="island-building-label"
            data-node-id={node.id}
            aria-label={node.name}
            title={node.name}
            aria-pressed={props.selectedId === node.id}
            hidden
            onPointerEnter={() => {
              hoveredIdRef.current = node.id;
            }}
            onPointerLeave={() => {
              hoveredIdRef.current = null;
            }}
            onFocus={() => {
              hoveredIdRef.current = node.id;
            }}
            onBlur={() => {
              hoveredIdRef.current = null;
            }}
            onClick={() => onSelect(node.id)}
          >
            <span className="island-building-dot" aria-hidden="true" />
            <strong>{node.name}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
