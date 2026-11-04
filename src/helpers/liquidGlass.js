/**
 * Liquid-glass edge refraction for the desktop widget.
 *
 * The displacement-map approach is adapted from Archis Vaze's MIT-licensed
 * "Liquid Glass for the Web" demo:
 * https://github.com/archisvaze/liquid-glass
 * Copyright (c) 2026 Archis Vaze. MIT License.
 *
 * Only the refraction map is generated here. The specular highlights and
 * glass tints are handled by CSS so the effect stays cheap enough for the
 * seven-column desktop widget.
 */

const SURFACE_FNS = {
  convex_squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
};

function calculateRefractionProfile(thickness, bezel, heightFn, ior, samples = 96) {
  const eta = 1 / ior;

  function refract(nx, ny) {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  }

  const profile = new Float64Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = i / samples;
    const y = heightFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const y2 = heightFn(x + dx);
    const derivative = (y2 - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const refracted = refract(-derivative / magnitude, -1 / magnitude);
    if (!refracted) {
      profile[i] = 0;
      continue;
    }
    profile[i] = refracted[0] * ((y * bezel + thickness) / refracted[1]);
  }
  return profile;
}

function generateDisplacementMap(width, height, radius, bezel, profile, maxDisp, mapWidth) {
  const ratio = Math.min(1, mapWidth / width);
  const w = Math.max(24, Math.round(width * ratio));
  const h = Math.max(24, Math.round(height * ratio));
  const r = Math.max(2, radius * ratio);
  const b = Math.max(1, bezel * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = ctx.createImageData(w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;
    data[i + 1] = 128;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  const innerRadiusSq = Math.max(r - b, 0) ** 2;
  const outerRadius = r + 1;
  const outerRadiusSq = outerRadius ** 2;
  const innerWidth = w - r * 2;
  const innerHeight = h - r * 2;
  const samples = profile.length;

  for (let y1 = 0; y1 < h; y1 += 1) {
    for (let x1 = 0; x1 < w; x1 += 1) {
      const x =
        x1 < r ? x1 - r : x1 >= w - r ? x1 - r - innerWidth : 0;
      const y =
        y1 < r ? y1 - r : y1 >= h - r ? y1 - r - innerHeight : 0;
      const distanceSq = x * x + y * y;
      if (distanceSq > outerRadiusSq || distanceSq < innerRadiusSq) continue;

      const distance = Math.sqrt(distanceSq);
      const fromSide = r - distance;
      const opacity =
        distanceSq < r * r
          ? 1
          : 1 -
            (distance - Math.sqrt(r * r)) /
              (Math.sqrt(outerRadiusSq) - Math.sqrt(r * r));
      if (opacity <= 0 || distance === 0) continue;

      const cos = x / distance;
      const sin = y / distance;
      const profileIndex = Math.min(
        Math.floor((fromSide / b) * samples),
        samples - 1
      );
      const displacement = profile[Math.max(0, profileIndex)] || 0;
      const dx = (-cos * displacement) / maxDisp;
      const dy = (-sin * displacement) / maxDisp;
      const index = (y1 * w + x1) * 4;
      data[index] = Math.round(128 + dx * 127 * opacity);
      data[index + 1] = Math.round(128 + dy * 127 * opacity);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function buildFilterMarkup(id, spec) {
  const width = Math.round(spec.width);
  const height = Math.round(spec.height);
  if (width < 60 || height < 20) return "";

  const radius = Math.max(2, Math.min(spec.radius || 20, width / 2, height / 2));
  const bezel = Math.max(
    1,
    Math.min(spec.bezel || 28, radius - 1, Math.min(width, height) / 2 - 1)
  );
  const thickness = Math.max(1, spec.thickness || 60);
  const ior = Math.max(1, spec.ior || 1.5);
  const scaleRatio = Math.max(0, spec.scaleRatio || 1);
  const heightFn = SURFACE_FNS[spec.surface || "convex_squircle"];

  const profile = calculateRefractionProfile(
    thickness,
    bezel,
    heightFn,
    ior
  );
  const maxDisp =
    Math.max(...Array.from(profile).map((value) => Math.abs(value))) || 1;
  const mapUrl = generateDisplacementMap(
    width,
    height,
    radius,
    bezel,
    profile,
    maxDisp,
    spec.mapWidth || 640
  );
  if (!mapUrl) return "";

  const scale = Math.max(1, maxDisp * scaleRatio);

  return `<filter id="${id}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${mapUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" result="disp_map" />
      <feDisplacementMap in="SourceGraphic" in2="disp_map" scale="${scale.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" />
    </filter>`;
}

export function buildLiquidGlassFilters(shell, header, columns) {
  const filters = [];
  if (shell && shell.width && shell.height) {
    filters.push(buildFilterMarkup("lg-shell", shell));
  }
  if (header && header.width && header.height) {
    filters.push(buildFilterMarkup("lg-header", header));
  }
  if (columns && columns.width && columns.height) {
    filters.push(buildFilterMarkup("lg-columns", columns));
  }
  return filters.filter(Boolean).join("\n");
}

export function isLiquidGlassSupported() {
  if (typeof document === "undefined") return false;
  return (
    typeof CSS !== "undefined" &&
    CSS.supports &&
    CSS.supports("filter", "url(#liquid-glass-test)")
  );
}
