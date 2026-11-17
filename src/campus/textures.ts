/** Procedural canvas textures (client only, created lazily). */
import * as THREE from "three";
import { seeded } from "./layout";

export type TexKind =
  | "grass"
  | "lawn"
  | "paving"
  | "plaza"
  | "brick"
  | "plaster"
  | "concrete"
  | "wood"
  | "stone"
  | "roofTiles"
  | "asphalt"
  | "gravel"
  | "hedge"
  | "soil"
  | "court"
  | "metalRoof";

/** Metres covered by one texture tile — used to scale UVs. */
export const TILE: Record<TexKind, number> = {
  grass: 8,
  lawn: 5,
  paving: 3,
  plaza: 4,
  brick: 2.2,
  plaster: 4,
  concrete: 3.2,
  wood: 2.4,
  stone: 2.4,
  roofTiles: 2.5,
  asphalt: 6,
  gravel: 3,
  hedge: 2,
  soil: 2,
  court: 1,
  metalRoof: 2,
};

const cache = new Map<TexKind, THREE.CanvasTexture>();

function makeCanvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function speckle(ctx: CanvasRenderingContext2D, size: number, count: number, colors: string[], r: () => number, maxR = 2) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)] ?? "#888888";
    ctx.globalAlpha = 0.25 + r() * 0.5;
    const s = 0.5 + r() * maxR;
    ctx.fillRect(r() * size, r() * size, s, s);
  }
  ctx.globalAlpha = 1;
}

function draw(kind: TexKind): HTMLCanvasElement {
  const r = seeded(kind.length * 977 + kind.charCodeAt(0));
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  switch (kind) {
    case "grass":
    case "lawn": {
      ctx.fillStyle = kind === "lawn" ? "#6a8545" : "#6b8449";
      ctx.fillRect(0, 0, S, S);
      // mowing stripes for campus lawns
      if (kind === "lawn") {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? "rgba(255,255,220,0.025)" : "rgba(0,30,0,0.025)";
          ctx.fillRect(0, (i * S) / 4, S, S / 4);
        }
      }
      for (let i = 0; i < 9000; i++) {
        const g = 90 + r() * 70;
        ctx.strokeStyle = `rgba(${g * 0.62},${g},${g * 0.42},${0.35 + r() * 0.4})`;
        ctx.lineWidth = 1;
        const x = r() * S;
        const y = r() * S;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4);
        ctx.stroke();
      }
      speckle(ctx, S, 600, ["#8a7a4a", "#506b30", "#9aae5a"], r, 3);
      break;
    }
    case "paving":
    case "plaza": {
      ctx.fillStyle = kind === "plaza" ? "#b9b2a6" : "#c9c1b2";
      ctx.fillRect(0, 0, S, S);
      const tw = kind === "plaza" ? S / 4 : S / 6;
      const th = kind === "plaza" ? S / 4 : S / 3;
      for (let y = 0; y < S; y += th) {
        for (let x = 0; x < S; x += tw) {
          const v = 180 + r() * 40;
          ctx.fillStyle = kind === "plaza" ? `rgb(${v * 0.95},${v * 0.92},${v * 0.86})` : `rgb(${v},${v * 0.95},${v * 0.87})`;
          ctx.fillRect(x + 2, y + 2, tw - 4, th - 4);
        }
      }
      speckle(ctx, S, 4000, ["#8f877a", "#e8e2d6", "#a39b8d"], r, 1.6);
      break;
    }
    case "brick": {
      ctx.fillStyle = "#cfc4b4";
      ctx.fillRect(0, 0, S, S);
      const bh = S / 16;
      const bw = S / 4;
      for (let row = 0; row < 16; row++) {
        const off = row % 2 ? bw / 2 : 0;
        for (let x = -bw; x < S + bw; x += bw) {
          const t = r();
          ctx.fillStyle = `rgb(${150 + t * 40},${70 + t * 22},${52 + t * 16})`;
          ctx.fillRect(x + off + 2, row * bh + 2, bw - 4, bh - 4);
        }
      }
      speckle(ctx, S, 3000, ["#5e2c20", "#c98a6c", "#8a4a36"], r, 1.5);
      break;
    }
    case "plaster":
    case "stone":
    case "concrete": {
      ctx.fillStyle = "#e9e6df";
      ctx.fillRect(0, 0, S, S);
      speckle(ctx, S, 14000, ["#d6d1c7", "#f6f4ef", "#cdc7bb"], r, 2);
      if (kind === "stone") {
        ctx.strokeStyle = "rgba(120,105,85,0.35)";
        ctx.lineWidth = 2;
        for (let y = 0; y <= S; y += S / 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(S, y);
          ctx.stroke();
          const off = (y / (S / 4)) % 2 ? S / 4 : 0;
          for (let x = off; x < S; x += S / 2) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + S / 4);
            ctx.stroke();
          }
        }
      }
      if (kind === "concrete") {
        ctx.strokeStyle = "rgba(90,85,78,0.25)";
        ctx.lineWidth = 2;
        for (let y = 0; y <= S; y += S / 3) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(S, y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(90,85,78,0.3)";
        for (let x = S / 6; x < S; x += S / 3) for (let y = S / 6; y < S; y += S / 3) ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      break;
    }
    case "wood": {
      const bw = S / 12;
      for (let i = 0; i < 12; i++) {
        const t = r();
        ctx.fillStyle = `rgb(${150 + t * 35},${102 + t * 25},${64 + t * 18})`;
        ctx.fillRect(i * bw, 0, bw, S);
        for (let k = 0; k < 40; k++) {
          ctx.strokeStyle = `rgba(80,50,25,${0.08 + r() * 0.12})`;
          ctx.beginPath();
          const x = i * bw + r() * bw;
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + 3, S * 0.3, x - 3, S * 0.6, x + 1, S);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(40,25,10,0.55)";
        ctx.fillRect(i * bw, 0, 2, S);
      }
      break;
    }
    case "roofTiles":
    case "metalRoof": {
      ctx.fillStyle = kind === "roofTiles" ? "#9a5540" : "#7b8186";
      ctx.fillRect(0, 0, S, S);
      if (kind === "roofTiles") {
        const rows = 10;
        for (let row = 0; row < rows; row++) {
          for (let x = 0; x < S; x += S / 10) {
            const t = r();
            ctx.fillStyle = `rgb(${135 + t * 35},${66 + t * 20},${48 + t * 14})`;
            const off = row % 2 ? S / 20 : 0;
            ctx.fillRect(x + off + 1, row * (S / rows) + 1, S / 10 - 2, S / rows - 2);
          }
          ctx.fillStyle = "rgba(40,15,10,0.35)";
          ctx.fillRect(0, (row + 1) * (S / rows) - 4, S, 4);
        }
      } else {
        for (let x = 0; x < S; x += S / 8) {
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fillRect(x, 0, 4, S);
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillRect(x + 4, 0, 3, S);
        }
      }
      break;
    }
    case "asphalt": {
      ctx.fillStyle = "#55585a";
      ctx.fillRect(0, 0, S, S);
      speckle(ctx, S, 16000, ["#3f4244", "#6d7072", "#4a4c4e"], r, 1.5);
      break;
    }
    case "gravel": {
      ctx.fillStyle = "#9a958c";
      ctx.fillRect(0, 0, S, S);
      speckle(ctx, S, 12000, ["#7d786f", "#bdb8ae", "#8c877e"], r, 2.5);
      break;
    }
    case "hedge": {
      ctx.fillStyle = "#3e5b2a";
      ctx.fillRect(0, 0, S, S);
      speckle(ctx, S, 9000, ["#2b4420", "#5a7d39", "#476a2f", "#6b8f45"], r, 5);
      break;
    }
    case "soil": {
      ctx.fillStyle = "#5b4330";
      ctx.fillRect(0, 0, S, S);
      speckle(ctx, S, 9000, ["#3f2e20", "#77593f", "#4b3727"], r, 2.5);
      for (let y = S / 8; y < S; y += S / 4) {
        for (let x = 20; x < S; x += 40) {
          ctx.fillStyle = "#5f8a3a";
          ctx.beginPath();
          ctx.arc(x + r() * 8, y + r() * 8, 8 + r() * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "court": {
      const [cc, cx] = makeCanvas(512, 1024);
      cx.fillStyle = "#6d9a8a";
      cx.fillRect(0, 0, 512, 1024);
      cx.fillStyle = "#b3664a";
      cx.fillRect(30, 30, 452, 964);
      cx.strokeStyle = "#f3efe6";
      cx.lineWidth = 6;
      cx.strokeRect(30, 30, 452, 964);
      cx.beginPath();
      cx.moveTo(30, 512);
      cx.lineTo(482, 512);
      cx.stroke();
      cx.beginPath();
      cx.arc(256, 512, 60, 0, Math.PI * 2);
      cx.stroke();
      for (const y of [30, 994]) {
        const dir = y === 30 ? 1 : -1;
        cx.strokeRect(186, dir > 0 ? 30 : 994 - 190, 140, 190);
        cx.beginPath();
        cx.arc(256, y, 230, dir > 0 ? 0 : Math.PI, dir > 0 ? Math.PI : Math.PI * 2);
        cx.stroke();
      }
      return cc;
    }
  }
  return c;
}

function base(kind: TexKind) {
  let t = cache.get(kind);
  if (!t) {
    t = new THREE.CanvasTexture(draw(kind));
    t.wrapS = t.wrapT = kind === "court" ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    cache.set(kind, t);
  }
  return t;
}

/** A texture whose repeat is `rx` × `ry`; repeat 1 is used with world-scaled geometry UVs. */
export function getTexture(kind: TexKind, rx = 1, ry = rx) {
  const b = base(kind);
  if (rx === 1 && ry === 1) return b;
  const t = b.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

/** Box geometry whose UVs are scaled so one texture tile spans `tile` metres on every face. */
export function scaledBox(w: number, h: number, d: number, tile: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes['uv'] as THREE.BufferAttribute;
  const dims: Array<[number, number]> = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      const [du, dv] = dims[f] ?? [1, 1];
      uv.setXY(i, (uv.getX(i) * du) / tile, (uv.getY(i) * dv) / tile);
    }
  }
  uv.needsUpdate = true;
  return g;
}

const FONT = `"Manrope", "Segoe UI", system-ui, sans-serif`;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawSign(c: HTMLCanvasElement, number: number, name: string, accent: string) {
  const ctx = c.getContext("2d")!;
  const W = c.width;
  const H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#1f2b27";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - H * 0.06, W, H * 0.06);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  // number badge
  const pad = H * 0.14;
  const r = (H - pad * 2) * 0.42;
  const bx = pad + r;
  const by = H / 2 - H * 0.02;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fbf7ef";
  ctx.font = `800 ${Math.round(r * 1.15)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), bx, by + r * 0.06);

  // full name — auto-sized, at most two lines, never abbreviated
  const left = bx + r + pad * 0.8;
  const maxW = W - left - pad;
  let size = Math.round(H * 0.42);
  let lines: string[] = [];
  for (; size > 20; size -= 4) {
    ctx.font = `800 ${size}px ${FONT}`;
    lines = wrapLines(ctx, name, maxW);
    const tall = lines.length * size * 1.12 <= H - pad * 1.6;
    if (lines.length <= 2 && tall && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#fbf7ef";
  const total = lines.length * size * 1.1;
  lines.forEach((l, i) => ctx.fillText(l, left, by - total / 2 + size * 0.55 + i * size * 1.1));
}

export function makeSignTexture(number: number, name: string, accent: string, aspect: number) {
  const W = 2048;
  const H = Math.round(W / aspect);
  const [c] = makeCanvas(W, H);
  drawSign(c, number, name, accent);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // redraw once the web font is available
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts
      .load(`800 64px "Manrope"`)
      .then(() => {
        drawSign(c, number, name, accent);
        t.needsUpdate = true;
      })
      .catch(() => {});
  }
  return t;
}

export function makeCampusSignTexture() {
  const [c, ctx] = makeCanvas(2048, 512);
  const paint = () => {
    ctx.fillStyle = "#1f2b27";
    ctx.fillRect(0, 0, 2048, 512);
    ctx.fillStyle = "#c2573a";
    ctx.fillRect(0, 470, 2048, 42);
    ctx.fillStyle = "#fbf7ef";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 230px "Fraunces", Georgia, serif`;
    ctx.fillText("SCHOOL AI WORLD", 1024, 240);
  };
  paint();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  document.fonts
    ?.load(`600 64px "Fraunces"`)
    .then(() => {
      paint();
      t.needsUpdate = true;
    })
    .catch(() => {});
  return t;
}
