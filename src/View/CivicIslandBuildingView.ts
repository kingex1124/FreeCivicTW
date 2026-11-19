import * as THREE from 'three';
import type {
  IslandBuildingDesign,
  IslandBuildingPainter,
  IslandBuildingResult,
} from '@/Model/IslandModel';

// Miniatures share a material palette and a footprint, while silhouettes describe their work.
export function paintIslandBuilding(
  painter: IslandBuildingPainter,
  design: IslandBuildingDesign,
  x: number,
  z: number,
  scale: number,
): IslandBuildingResult {
  const { style, accent, variant } = design;
  const ground = 0.98;
  const ivory = '#e9e1cf',
    white = '#f7f3e8',
    stone = '#c8c3b0';
  const glass = '#6c9ca5',
    darkGlass = '#334f5b',
    wood = '#9b7251',
    gold = '#ba995b';
  const shape = (
    geometry: THREE.BufferGeometry,
    color: string,
    px: number,
    py: number,
    pz: number,
    sx = 1,
    sy = 1,
    sz = 1,
    rotation = 0,
  ) =>
    painter.add(
      geometry,
      color,
      x + px * scale,
      ground + py * scale,
      z + pz * scale,
      sx * scale,
      sy * scale,
      sz * scale,
      rotation,
    );
  const box = (
    color: string,
    px: number,
    py: number,
    pz: number,
    w: number,
    h: number,
    d: number,
    rotation = 0,
  ) => shape(new THREE.BoxGeometry(w, h, d), color, px, py, pz, 1, 1, 1, rotation);
  const cylinder = (
    color: string,
    px: number,
    py: number,
    pz: number,
    radius: number,
    height: number,
    segments = 12,
  ) => shape(new THREE.CylinderGeometry(radius, radius, height, segments), color, px, py, pz);
  const hipRoof = (
    px: number,
    py: number,
    pz: number,
    w: number,
    d: number,
    h: number,
    color = accent,
  ) =>
    shape(
      new THREE.ConeGeometry(1, h, 4).rotateY(Math.PI / 4),
      color,
      px,
      py,
      pz,
      w / Math.SQRT2,
      1,
      d / Math.SQRT2,
    );
  const dome = (px: number, py: number, pz: number, radius: number, color = accent) =>
    shape(
      new THREE.SphereGeometry(radius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      color,
      px,
      py,
      pz,
    );
  const disc = (color: string, px: number, py: number, pz: number, radius: number) =>
    shape(
      new THREE.CylinderGeometry(radius, radius, 0.035, 12).rotateX(Math.PI / 2),
      color,
      px,
      py,
      pz,
    );
  const steps = (w = 1.0, front = 0.88) => {
    for (let i = 0; i < 3; i++)
      box(stone, 0, 0.04 + i * 0.045, front - i * 0.08, w - i * 0.08, 0.08, 0.32 - i * 0.04);
  };
  const flag = (px = 0, py = 1.8, pz = -0.15, base = py) => {
    cylinder('#8d8a78', px, (base + py + 0.64) / 2, pz, 0.018, py + 0.64 - base, 6);
    box('#b05c50', px + 0.15, py + 0.52, pz, 0.3, 0.18, 0.018);
    box('#35566f', px + 0.075, py + 0.555, pz + 0.012, 0.14, 0.09, 0.014);
    disc(white, px + 0.075, py + 0.555, pz + 0.025, 0.025);
  };
  const tree = (px: number, pz: number, size = 0.45) => {
    cylinder(wood, px, 0.16, pz, 0.035, 0.3, 5);
    shape(new THREE.IcosahedronGeometry(size * 0.45, 0), '#64856a', px, 0.35, pz, 1, 1.25, 1);
  };
  const windows = (
    px: number,
    py: number,
    pz: number,
    w: number,
    d: number,
    floors: number,
    columns = 4,
    color = darkGlass,
  ) => {
    for (let row = 0; row < floors; row++) {
      const y = py + 0.26 + row * 0.43;
      for (let col = 0; col < columns; col++)
        box(
          color,
          px + ((col - (columns - 1) / 2) * w) / (columns + 1),
          y,
          pz + d / 2 + 0.015,
          (w / (columns + 1)) * 0.52,
          0.22,
          0.025,
        );
      for (let col = 0; col < 3; col++)
        box(color, px + w / 2 + 0.015, y, pz + ((col - 1) * d) / 4, 0.025, 0.22, (d / 4) * 0.52);
    }
  };
  const office = (px = 0, pz = 0, w = 1.4, d = 1.05, floors = 2, color = ivory) => {
    const height = 0.16 + floors * 0.43;
    box(color, px, height / 2 + 0.12, pz, w, height, d);
    windows(px, 0.12, pz, w, d, floors);
    for (let floor = 1; floor <= floors; floor++)
      box(white, px, 0.17 + floor * 0.43, pz, w + 0.06, 0.055, d + 0.05);
    box(accent, px, height + 0.18, pz, w + 0.13, 0.1, d + 0.12);
    box(glass, px, 0.34, pz + d / 2 + 0.03, 0.29, 0.43, 0.045);
    return height + 0.24;
  };
  const portico = (w = 1.3, height = 0.86, front = 0.62) => {
    for (let col = 0; col < 4; col++)
      cylinder(white, ((col - 1.5) * w) / 3, height / 2 + 0.15, front, 0.055, height, 8);
    box(white, 0, height + 0.2, front, w + 0.23, 0.13, 0.35);
    hipRoof(0, height + 0.38, front, w + 0.28, 0.45, 0.3);
  };
  const balance = (py: number, front = 0.7) => {
    cylinder(gold, 0, py + 0.22, front, 0.025, 0.44, 6);
    box(gold, 0, py + 0.42, front, 0.55, 0.035, 0.035);
    for (const side of [-1, 1]) {
      cylinder(gold, side * 0.22, py + 0.29, front, 0.012, 0.22, 5);
      shape(
        new THREE.ConeGeometry(0.12, 0.065, 8).rotateX(Math.PI),
        gold,
        side * 0.22,
        py + 0.16,
        front,
      );
    }
  };
  const shield = (px: number, py: number, pz: number, color = gold) => {
    const outline = new THREE.Shape();
    outline.moveTo(-0.17, 0.16);
    outline.lineTo(0.17, 0.16);
    outline.lineTo(0.145, -0.07);
    outline.lineTo(0, -0.22);
    outline.lineTo(-0.145, -0.07);
    outline.closePath();
    shape(new THREE.ShapeGeometry(outline), color, px, py, pz);
  };
  const vehicle = (px: number, pz: number, color: string, bus = false) => {
    const length = bus ? 0.83 : 0.63;
    box(color, px, 0.18, pz, 0.42, 0.23, length);
    box(glass, px, 0.36, pz - 0.04, 0.36, 0.16, length * 0.67);
    box(color, px, 0.46, pz - 0.04, 0.41, 0.045, length * 0.7);
    for (const side of [-1, 1])
      for (const end of [-1, 1])
        shape(
          new THREE.CylinderGeometry(0.08, 0.08, 0.055, 8).rotateZ(Math.PI / 2),
          darkGlass,
          px + side * 0.22,
          0.12,
          pz + end * length * 0.29,
        );
  };
  let height: number;
  box('#c5beaa', 0, 0.055, 0, 2.12, 0.11, 1.92);
  box('#e8e2d1', 0, 0.12, 0.65, 1.95, 0.035, 0.46);

  switch (style) {
    case 'plaza': {
      cylinder('#c7bda0', 0, 0.08, 0, 0.92, 0.16, 24);
      cylinder('#eee5cc', 0, 0.18, 0, 0.81, 0.07, 24);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = Math.cos(angle) * 0.47,
          pz = Math.sin(angle) * 0.47;
        cylinder(i % 2 ? '#719482' : '#b97a5f', px, 0.39, pz, 0.065, 0.29, 6);
        shape(new THREE.SphereGeometry(0.09, 6, 5), '#dab28c', px, 0.59, pz);
      }
      for (const side of [-1, 1]) {
        box(wood, side * 0.7, 0.31, 0, 0.16, 0.09, 0.55);
        tree(side * 0.69, -0.63, 0.5);
      }
      flag(0, 0.96, 0, 0.16);
      height = 1.7;
      break;
    }
    case 'presidential': {
      office(0, -0.08, 2.0, 1.05, 3, '#a65d4c');
      for (const side of [-1, 1]) {
        box('#a65d4c', side * 0.88, 1.08, -0.06, 0.34, 1.9, 1.15);
        box(white, side * 0.88, 1.44, -0.06, 0.38, 0.07, 1.19);
        hipRoof(side * 0.88, 2.12, -0.06, 0.46, 1.28, 0.3, '#627865');
      }
      box('#a65d4c', 0, 1.81, -0.06, 0.49, 2.55, 0.49);
      for (const y of [1.1, 1.75, 2.38, 2.88]) box(white, 0, y, -0.06, 0.57, 0.09, 0.57);
      box(white, 0, 2.79, -0.06, 0.35, 0.2, 0.35);
      hipRoof(0, 3.0, -0.06, 0.52, 0.52, 0.27, '#5c766a');
      disc(white, 0, 2.57, 0.2, 0.095);
      box(darkGlass, 0, 0.43, 0.5, 0.3, 0.53, 0.08);
      steps(1.0, 0.87);
      flag(0, 3.14, -0.06);
      height = 3.83;
      break;
    }
    case 'executive': {
      office(0, -0.27, 1.94, 0.75, 3, ivory);
      for (const side of [-1, 1]) office(side * 0.78, 0.12, 0.37, 1.25, 2, ivory);
      for (let i = 0; i < 4; i++) cylinder(white, (i - 1.5) * 0.26, 0.57, 0.66, 0.045, 0.91, 8);
      box(white, 0, 1.08, 0.64, 1.06, 0.12, 0.4);
      steps(1.14, 0.88);
      flag(0, 1.88, -0.2);
      height = 2.55;
      break;
    }
    case 'parliament': {
      office(0, -0.14, 1.9, 1.12, 2, white);
      box(ivory, 0, 1.3, 0.02, 0.85, 0.5, 1.12);
      box(accent, 0, 1.62, 0.02, 1.01, 0.12, 1.28);
      for (let i = 0; i < 3; i++) box(wood, (i - 1) * 0.28, 0.39, 0.61, 0.19, 0.49, 0.04);
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++)
          box(stone, side * 0.76, 1.01 + i * 0.18, 0.45, 0.13, 0.05, 0.23);
      disc(gold, 0, 1.29, 0.6, 0.1);
      steps(1.4, 0.88);
      flag(0, 1.73, -0.1);
      height = 2.41;
      break;
    }
    case 'council': {
      office(0, -0.43, 1.5, 0.58, 2, ivory);
      cylinder(ivory, 0, 0.57, 0.1, 0.81, 0.85, 20);
      cylinder(accent, 0, 1.05, 0.1, 0.87, 0.12, 20);
      dome(0, 1.12, 0.1, 0.62);
      for (let i = 0; i < 7; i++) {
        const a = (i - 3) * 0.32;
        box(glass, Math.sin(a) * 0.79, 0.64, 0.1 + Math.cos(a) * 0.79, 0.13, 0.38, 0.035, a);
      }
      steps(1.1, 0.91);
      height = 1.85;
      break;
    }
    case 'judicial-yuan': {
      office(0, -0.13, 1.95, 1.18, 3, ivory);
      box(ivory, 0, 1.8, -0.08, 0.6, 1.3, 0.6);
      cylinder(white, 0, 2.48, -0.08, 0.43, 0.11, 8);
      shape(new THREE.ConeGeometry(0.49, 0.53, 8), accent, 0, 2.77, -0.08);
      cylinder(gold, 0, 3.08, -0.08, 0.035, 0.17, 6);
      for (const side of [-1, 1]) hipRoof(side * 0.76, 1.79, -0.13, 0.56, 1.28, 0.3);
      portico(1.0, 0.85, 0.63);
      steps(1.2, 0.91);
      height = 3.24;
      break;
    }
    case 'court':
    case 'constitutional': {
      office(0, -0.18, 1.8, 1.08, 2, ivory);
      if (style === 'constitutional') {
        cylinder(glass, 0, 1.12, -0.18, 0.58, 0.65, 16);
        dome(0, 1.48, -0.18, 0.65);
        height = 2.24;
      } else {
        hipRoof(0, 1.5, -0.18, 1.98, 1.26, 0.34);
        height = 2.1;
      }
      portico(1.18, 0.92, 0.66);
      steps(1.38, 0.94);
      balance(1.53, 0.36);
      break;
    }
    case 'prosecutors':
    case 'watchdog':
    case 'investigation': {
      const floors = style === 'investigation' ? 3 : 2 + (variant % 2);
      const top = office(
        0.05,
        -0.15,
        1.52,
        1.12,
        floors,
        style === 'prosecutors' ? '#bd9680' : ivory,
      );
      box(white, -0.54, 0.69, 0.43, 0.37, 1.13, 0.29);
      shield(-0.54, 0.86, 0.59);
      box(accent, 0.34, top + 0.1, -0.26, 0.58, 0.2, 0.52);
      if (style === 'investigation') {
        cylinder(stone, 0.34, top + 0.4, -0.26, 0.025, 0.55, 6);
        shape(
          new THREE.SphereGeometry(0.29, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
          white,
          0.34,
          top + 0.43,
          -0.26,
          1,
          0.5,
          1,
        );
      } else if (style === 'prosecutors') balance(top + 0.06, 0.28);
      else {
        disc(accent, 0.35, 0.84, 0.43, 0.23);
        shield(0.35, 0.85, 0.48, white);
      }
      steps(1.05, 0.9);
      height = top + 0.78;
      break;
    }
    case 'examination': {
      office(0, -0.16, 1.86, 1.1, 2, '#b28166');
      hipRoof(0, 1.58, -0.16, 2.05, 1.28, 0.4, '#686e60');
      box(ivory, 0, 1.5, 0.18, 0.57, 1.48, 0.42);
      hipRoof(0, 2.32, 0.18, 0.75, 0.61, 0.3);
      disc(white, 0, 1.93, 0.41, 0.13);
      steps(1.1, 0.92);
      height = 2.57;
      break;
    }
    case 'city-hall': {
      office(-0.39, -0.1, 0.83, 1.25, 3, white);
      office(0.5, -0.25, 0.7, 0.93, 4, ivory);
      box(glass, 0.04, 0.98, 0.1, 0.42, 1.5, 0.82);
      box(white, 0, 0.44, 0.7, 1.28, 0.12, 0.38);
      for (const side of [-1, 1]) cylinder(stone, side * 0.46, 0.25, 0.74, 0.045, 0.4, 8);
      flag(-0.82, 1.83, 0.1);
      steps(1.15, 0.95);
      height = 2.6;
      break;
    }
    case 'community':
    case 'indigenous': {
      const timber = style === 'indigenous';
      office(0, -0.1, 1.55, 1.08, variant === 2 ? 2 : 1, timber ? '#bb9471' : ivory);
      const top = variant === 2 ? 1.25 : 0.83;
      hipRoof(0, top + 0.22, -0.1, 1.82, 1.35, 0.42, timber ? '#9f6650' : accent);
      for (const side of [-1, 1])
        cylinder(timber ? wood : stone, side * 0.6, 0.46, 0.65, 0.055, 0.75, 8);
      box(timber ? wood : white, 0, 0.91, 0.65, 1.5, 0.11, 0.3);
      if (timber)
        for (let i = 0; i < 5; i++)
          box(white, (i - 2) * 0.22, 0.92, 0.82, 0.08, 0.075, 0.02, Math.PI / 4);
      else flag(0.69, 1.31, -0.4);
      steps(1.02, 0.94);
      height = timber ? top + 0.47 : 2.02;
      break;
    }
    case 'museum': {
      office(0, -0.1, 1.91, 1.2, 1, ivory);
      hipRoof(0, 1.09, -0.1, 2.13, 1.42, 0.38);
      box(ivory, 0, 1.35, -0.12, 0.78, 0.57, 0.76);
      hipRoof(0, 1.74, -0.12, 1.06, 1.04, 0.39);
      cylinder(gold, 0, 1.98, -0.12, 0.05, 0.12, 8);
      for (const side of [-1, 1]) hipRoof(side * 0.76, 0.97, -0.09, 0.55, 1.37, 0.28);
      steps(1.6, 0.95);
      height = 2.1;
      break;
    }
    case 'education': {
      office(-0.18, -0.15, 1.58, 0.95, 2, '#ba8971');
      box(ivory, 0.63, 0.94, -0.1, 0.46, 1.64, 0.92);
      hipRoof(0.63, 1.88, -0.1, 0.62, 1.09, 0.31);
      disc(white, 0.63, 1.41, 0.38, 0.13);
      box(accent, -0.15, 0.79, 0.61, 1.2, 0.09, 0.35);
      for (const side of [-1, 1]) cylinder(white, side * 0.58, 0.43, 0.67, 0.035, 0.69, 6);
      flag(-0.77, 1.4, -0.1);
      height = 2.1;
      break;
    }
    case 'medical':
    case 'care': {
      office(-0.25, -0.15, 1.16, 1.13, 2, white);
      office(0.63, -0.18, 0.52, 0.96, 1, style === 'care' ? '#d2b2a0' : ivory);
      box(accent, -0.25, 1.47, -0.15, 1.26, 0.13, 1.23);
      if (style === 'medical') {
        box('#408c73', -0.25, 1.07, 0.44, 0.39, 0.12, 0.035);
        box('#408c73', -0.25, 1.07, 0.45, 0.12, 0.39, 0.035);
        box(white, -0.2, 0.66, 0.69, 1.1, 0.09, 0.39);
        vehicle(0.64, 0.51, '#ecdfc8');
      } else {
        hipRoof(0.62, 0.97, -0.18, 0.66, 1.14, 0.3);
        tree(0.64, 0.64, 0.6);
        box(wood, -0.66, 0.31, 0.68, 0.42, 0.08, 0.16);
      }
      height = 1.7;
      break;
    }
    case 'transport':
    case 'railway': {
      office(0, -0.43, 1.84, 0.56, 1, ivory);
      box(glass, 0, 0.7, 0.05, 1.49, 0.7, 0.38);
      box(white, 0, 1.19, 0.12, 2.08, 0.12, 1.05);
      for (const side of [-1, 1]) cylinder(stone, side * 0.85, 0.58, 0.5, 0.035, 1.05, 6);
      if (style === 'railway') {
        for (const side of [-1, 1]) box('#5a686b', 0, 0.19, 0.57 + side * 0.11, 1.96, 0.035, 0.035);
        for (let i = 0; i < 8; i++) box(wood, (i - 3.5) * 0.24, 0.16, 0.57, 0.08, 0.025, 0.32);
        box(accent, 0.2, 0.43, 0.54, 0.98, 0.45, 0.42);
        box(glass, 0.2, 0.49, 0.765, 0.72, 0.17, 0.025);
      } else vehicle(0.32, 0.48, '#b99b59', true);
      disc(accent, 0, 1.13, 0.68, 0.12);
      height = 1.43;
      break;
    }
    case 'maritime':
    case 'water': {
      office(-0.38, -0.24, 0.97, 0.98, 2, ivory);
      cylinder(accent, 0.56, 0.31, 0.3, 0.49, 0.18, 20);
      cylinder('#74afbf', 0.56, 0.42, 0.3, 0.4, 0.08, 20);
      if (style === 'maritime') {
        cylinder(white, 0.59, 1.1, -0.23, 0.23, 1.86, 10);
        for (const y of [0.7, 1.1, 1.5]) cylinder(accent, 0.59, y, -0.23, 0.24, 0.14, 10);
        cylinder(glass, 0.59, 2.06, -0.23, 0.28, 0.25, 10);
        hipRoof(0.59, 2.29, -0.23, 0.7, 0.7, 0.25);
        height = 2.44;
      } else {
        cylinder(white, 0.58, 1.06, -0.27, 0.27, 1.1, 12);
        cylinder(accent, 0.58, 1.65, -0.27, 0.34, 0.13, 12);
        box(white, -0.25, 0.86, 0.5, 1.27, 0.1, 0.24);
        height = 1.83;
      }
      break;
    }
    case 'defense': {
      office(0, -0.14, 1.77, 1.13, 2, ivory);
      box(accent, -0.56, 1.55, -0.15, 0.55, 0.3, 0.78);
      box(accent, 0.56, 1.55, -0.15, 0.55, 0.3, 0.78);
      shield(0, 0.93, 0.47);
      flag(0, 1.61, -0.22);
      steps(1.1, 0.92);
      height = 2.32;
      break;
    }
    case 'finance': {
      office(0, -0.15, 1.7, 1.14, 2, ivory);
      portico(1.12, 0.88, 0.65);
      hipRoof(0, 1.53, -0.15, 1.93, 1.33, 0.33);
      disc(gold, 0, 1.54, 0.65, 0.16);
      box(white, 0, 1.54, 0.68, 0.16, 0.035, 0.025);
      steps(1.3, 0.94);
      height = 1.85;
      break;
    }
    case 'technology':
    case 'research':
    case 'international': {
      office(-0.28, -0.15, 1.03, 1.16, 3, glass);
      box(white, -0.28, 1.63, -0.15, 1.18, 0.13, 1.31);
      office(0.65, -0.23, 0.46, 0.93, 2, ivory);
      if (style === 'research') {
        cylinder(white, -0.28, 1.86, -0.22, 0.38, 0.28, 14);
        dome(-0.28, 2.01, -0.22, 0.42, white);
        height = 2.49;
      } else if (style === 'international') {
        shape(new THREE.IcosahedronGeometry(0.32, 1), '#789fa6', 0.52, 0.83, 0.58);
        cylinder(gold, 0.52, 0.43, 0.58, 0.08, 0.5, 8);
        shape(new THREE.TorusGeometry(0.34, 0.022, 4, 16), gold, 0.52, 0.83, 0.58);
        height = 1.91;
      } else {
        cylinder(stone, 0.63, 1.66, -0.23, 0.025, 0.92, 6);
        shape(new THREE.ConeGeometry(0.27, 0.13, 12).rotateZ(0.6), white, 0.63, 2.12, -0.23);
        for (let i = 0; i < 3; i++)
          box('#446f87', -0.56 + i * 0.29, 1.74, -0.15, 0.24, 0.025, 0.44);
        height = 2.35;
      }
      break;
    }
    case 'agriculture':
    case 'environment': {
      office(-0.44, -0.21, 0.89, 1.03, 2, ivory);
      if (style === 'agriculture') {
        box(glass, 0.48, 0.48, 0.11, 0.86, 0.57, 1.25);
        hipRoof(0.48, 0.9, 0.11, 1.0, 1.37, 0.3, '#8caf9a');
        for (let i = 0; i < 3; i++) box('#6e955b', 0.22 + i * 0.25, 0.23, 0.68, 0.16, 0.1, 0.42);
      } else {
        office(0.54, -0.23, 0.69, 0.92, 1, ivory);
        box('#6b925d', 0.54, 0.98, -0.23, 0.74, 0.05, 0.96);
        for (let i = 0; i < 3; i++)
          box('#4c7587', -0.71 + i * 0.25, 1.43, -0.23, 0.21, 0.025, 0.46);
        tree(0.57, 0.57, 0.72);
      }
      height = 1.61;
      break;
    }
    case 'fire': {
      office(-0.56, -0.1, 0.58, 1.19, 3, ivory);
      box(white, 0.33, 0.68, -0.03, 1.14, 1.14, 1.15);
      for (const px of [0.06, 0.61]) {
        box(accent, px, 0.5, 0.56, 0.47, 0.76, 0.05);
        for (let i = 0; i < 5; i++) box(white, px, 0.26 + i * 0.11, 0.59, 0.43, 0.018, 0.025);
      }
      box(accent, 0.33, 1.32, -0.03, 1.29, 0.16, 1.29);
      vehicle(0.38, 0.58, '#b45343', true);
      for (let i = 0; i < 6; i++) box(white, -0.55, 0.35 + i * 0.22, 0.52, 0.28, 0.035, 0.02);
      height = 1.87;
      break;
    }
    case 'culture':
    case 'tourism': {
      office(-0.26, -0.21, 1.26, 1.0, 1, ivory);
      if (style === 'culture') {
        hipRoof(-0.25, 1.14, -0.21, 1.53, 1.3, 0.53);
        box(accent, 0.62, 0.63, 0.02, 0.48, 1.02, 0.92);
        shape(new THREE.IcosahedronGeometry(0.27, 0), gold, 0.59, 0.57, 0.68, 1, 1.45, 1);
        height = 1.52;
      } else {
        hipRoof(-0.26, 1.12, -0.21, 1.55, 1.26, 0.5, wood);
        box(accent, 0.65, 0.57, 0.05, 0.45, 0.78, 0.87);
        box(white, 0.63, 0.72, 0.55, 0.42, 0.4, 0.04);
        box(glass, 0.63, 0.72, 0.58, 0.3, 0.28, 0.02);
        tree(-0.68, 0.66, 0.65);
        height = 1.44;
      }
      break;
    }
    case 'sports': {
      cylinder('#c7bda0', 0, 0.18, 0.1, 0.86, 0.12, 24);
      shape(
        new THREE.TorusGeometry(0.64, 0.13, 4, 24).rotateX(Math.PI / 2),
        accent,
        0,
        0.28,
        0.15,
        1.25,
        1,
        0.81,
      );
      shape(
        new THREE.CylinderGeometry(0.52, 0.52, 0.035, 24),
        '#75a47d',
        0,
        0.27,
        0.15,
        1.25,
        1,
        0.81,
      );
      box(white, 0, 0.3, 0.15, 0.025, 0.01, 0.65);
      box(white, 0, 0.31, 0.15, 1.0, 0.01, 0.02);
      box(ivory, 0, 0.57, -0.61, 1.65, 0.65, 0.35);
      box(white, 0, 0.99, -0.58, 1.95, 0.12, 0.62);
      for (const side of [-1, 1]) {
        cylinder(stone, side * 0.89, 1.04, 0.5, 0.02, 1.4, 6);
        box(white, side * 0.89, 1.76, 0.5, 0.24, 0.12, 0.12);
      }
      height = 1.88;
      break;
    }
    case 'election': {
      office(0, -0.23, 1.77, 1.01, 2, ivory);
      box(white, 0.56, 0.43, 0.66, 0.43, 0.45, 0.4);
      box(accent, 0.56, 0.68, 0.66, 0.47, 0.055, 0.44);
      box(darkGlass, 0.56, 0.71, 0.66, 0.23, 0.012, 0.04);
      box(white, 0.56, 0.88, 0.66, 0.18, 0.3, 0.035, -0.1);
      disc(accent, -0.39, 0.94, 0.3, 0.18);
      flag(-0.65, 1.42, -0.1);
      height = 2.13;
      break;
    }
    case 'engineering':
    case 'labor': {
      office(-0.35, -0.18, 1.1, 1.1, 2, style === 'labor' ? '#bb947a' : ivory);
      box(accent, 0.59, 0.62, -0.08, 0.63, 0.91, 1.09);
      box(white, 0.59, 1.16, -0.08, 0.78, 0.12, 1.23);
      for (let i = 0; i < 4; i++) box(glass, 0.6, 0.44 + i * 0.17, 0.49, 0.48, 0.08, 0.025);
      if (style === 'engineering') {
        cylinder(gold, 0.63, 1.62, -0.24, 0.035, 0.89, 6);
        box(gold, 0.34, 2.02, -0.24, 1.08, 0.055, 0.06);
        cylinder(wood, -0.15, 1.83, -0.24, 0.012, 0.35, 5);
        height = 2.13;
      } else {
        disc(white, -0.38, 1.07, 0.4, 0.15);
        box(wood, -0.38, 1.07, 0.43, 0.02, 0.19, 0.02);
        height = 1.7;
      }
      break;
    }
    case 'planning': {
      office(-0.38, -0.25, 0.97, 1.02, 3, ivory);
      office(0.61, -0.27, 0.56, 0.91, 2, glass);
      box('#a7b294', 0.14, 0.17, 0.66, 0.94, 0.05, 0.46);
      for (let i = 0; i < 3; i++)
        box(
          i % 2 ? accent : white,
          -0.12 + i * 0.26,
          0.3 + i * 0.05,
          0.66,
          0.17,
          0.2 + i * 0.1,
          0.23,
        );
      height = 1.86;
      break;
    }
    case 'police': {
      office(-0.25, -0.17, 1.19, 1.08, 2, white);
      box(accent, -0.25, 0.93, 0.39, 1.27, 0.25, 0.06);
      shield(-0.25, 1.08, 0.45, gold);
      box(accent, 0.65, 0.7, -0.16, 0.45, 1.14, 1.03);
      box(white, 0.65, 1.34, -0.16, 0.56, 0.1, 1.12);
      vehicle(0.57, 0.56, white);
      box('#547b9e', 0.48, 0.51, 0.52, 0.17, 0.07, 0.14);
      box('#b4655b', 0.66, 0.51, 0.52, 0.17, 0.07, 0.14);
      cylinder(stone, -0.62, 1.76, -0.26, 0.02, 0.56, 6);
      height = 2.1;
      break;
    }
    case 'office': {
      const top = office(-0.2, -0.18, 1.3, 1.12, 2 + (variant % 2), ivory);
      office(0.63, -0.26, 0.4, 0.9, 1, white);
      box(white, -0.18, 0.72, 0.54, 1.26, 0.1, 0.37);
      box(accent, -0.18, 0.81, 0.72, 0.68, 0.09, 0.03);
      tree(0.67, 0.62, 0.49);
      height = top + 0.08;
      break;
    }
    default: {
      const exhaustive: never = style;
      throw new Error(`Unknown island building: ${exhaustive}`);
    }
  }
  return { width: 2.24 * scale, depth: 2.24 * scale, height: height * scale };
}
