/**
 * Desktop-widget themes.
 *
 * The shell/panel colors are painted over a blurred snapshot of the actual
 * wallpaper, so the widget keeps the desktop's colors even though the Electron
 * window itself stays opaque (layered child windows do not render inside
 * SHELLDLL_DefView).
 */
export const DESKTOP_THEMES = [
  {
    id: "frosted-white",
    name: "白雾玻璃",
    dark: false,
    shell: "#eef2f8",
    panel: "#ffffff",
    text: "#111827",
    muted: "#4b5563",
    border: "#ffffff",
    accent: "#3b82f6",
    shadow: "rgba(15, 23, 42, 0.28)",
  },
  {
    id: "liquid-glass",
    name: "液态玻璃",
    dark: false,
    shell: "#f3f5f8",
    panel: "#ffffff",
    text: "#111827",
    muted: "#374151",
    border: "#ffffff",
    accent: "#5b7cfa",
    shadow: "rgba(15, 23, 42, 0.28)",
    liquidGlass: true,
  },
  {
    id: "liquid-glass-white",
    name: "液态玻璃·浅白",
    dark: false,
    shell: "#f8f9fb",
    panel: "#ffffff",
    text: "#111827",
    muted: "#374151",
    border: "#ffffff",
    accent: "#5b7cfa",
    shadow: "rgba(15, 23, 42, 0.24)",
    liquidGlass: true,
    glassTint: "white",
  },
  {
    id: "liquid-glass-dark",
    name: "液态玻璃·暗色",
    dark: true,
    shell: "#111923",
    panel: "#202a38",
    text: "#f2f7ff",
    muted: "#b8c7d9",
    border: "#ffffff",
    accent: "#7dd3fc",
    shadow: "rgba(0, 0, 0, 0.55)",
    liquidGlass: true,
  },
  {
    id: "frosted-gray",
    name: "灰雾玻璃",
    dark: false,
    shell: "#d8dbe2",
    panel: "#f4f5f8",
    text: "#111827",
    muted: "#4b5563",
    border: "#ffffff",
    accent: "#6366f1",
    shadow: "rgba(15, 23, 42, 0.30)",
  },
  {
    id: "acrylic-blue",
    name: "蓝色亚克力",
    dark: false,
    shell: "#cfe4ff",
    panel: "#eaf3ff",
    text: "#0f2747",
    muted: "#365b86",
    border: "#ffffff",
    accent: "#2563eb",
    shadow: "rgba(15, 48, 90, 0.32)",
  },
  {
    id: "mint",
    name: "薄荷玻璃",
    dark: false,
    shell: "#d4f6e8",
    panel: "#e9fbf3",
    text: "#083b2a",
    muted: "#2c6b55",
    border: "#ffffff",
    accent: "#059669",
    shadow: "rgba(4, 56, 39, 0.30)",
  },
  {
    id: "rose",
    name: "樱粉玻璃",
    dark: false,
    shell: "#f8dce9",
    panel: "#fdebf3",
    text: "#4a1028",
    muted: "#7c3b55",
    border: "#ffffff",
    accent: "#db2777",
    shadow: "rgba(74, 16, 40, 0.28)",
  },
  {
    id: "violet",
    name: "紫罗兰",
    dark: false,
    shell: "#e6defb",
    panel: "#f3efff",
    text: "#2a1552",
    muted: "#5b4680",
    border: "#ffffff",
    accent: "#7c3aed",
    shadow: "rgba(42, 21, 82, 0.28)",
  },
  {
    id: "cream",
    name: "米杏奶油",
    dark: false,
    shell: "#f8e5d7",
    panel: "#fff4eb",
    text: "#3f2418",
    muted: "#7a5340",
    border: "#ffffff",
    accent: "#d97706",
    shadow: "rgba(63, 36, 24, 0.28)",
  },
  {
    id: "paper",
    name: "纸感浅白",
    dark: false,
    shell: "#f1e9d3",
    panel: "#fbf6ea",
    text: "#3b3324",
    muted: "#6b6049",
    border: "#fffdf5",
    accent: "#a16207",
    shadow: "rgba(59, 51, 36, 0.26)",
    texture: true,
  },
  {
    id: "caramel",
    name: "焦糖奶茶",
    dark: false,
    shell: "#e8cfb7",
    panel: "#f6e6d6",
    text: "#3d2515",
    muted: "#75523a",
    border: "#fff8f0",
    accent: "#b45309",
    shadow: "rgba(61, 37, 21, 0.30)",
  },
  {
    id: "beige-texture",
    name: "米色纹理",
    dark: false,
    shell: "#e8dfd1",
    panel: "#f5efe5",
    text: "#3d3428",
    muted: "#6f6250",
    border: "#fffaf2",
    accent: "#8a6f4a",
    shadow: "rgba(61, 52, 40, 0.26)",
    texture: true,
  },
  {
    id: "frosted-dark",
    name: "暗色磨砂",
    dark: true,
    shell: "#272b33",
    panel: "#343a45",
    text: "#f3f4f6",
    muted: "#c3c9d3",
    border: "#ffffff",
    accent: "#7dd3fc",
    shadow: "rgba(0, 0, 0, 0.42)",
  },
  {
    id: "graphite",
    name: "石墨深色",
    dark: true,
    shell: "#1a2233",
    panel: "#263149",
    text: "#eef2ff",
    muted: "#c7d2e5",
    border: "#ffffff",
    accent: "#60a5fa",
    shadow: "rgba(0, 0, 0, 0.48)",
  },
  {
    id: "walnut",
    name: "暖褐木色",
    dark: true,
    shell: "#2b2018",
    panel: "#3b2c21",
    text: "#fbeee1",
    muted: "#d7c2ae",
    border: "#ffffff",
    accent: "#f3b56b",
    shadow: "rgba(0, 0, 0, 0.45)",
  },
  {
    id: "terracotta",
    name: "陶土赭石",
    dark: true,
    shell: "#321a17",
    panel: "#482521",
    text: "#fff0eb",
    muted: "#e3c1b8",
    border: "#ffffff",
    accent: "#fb8a6b",
    shadow: "rgba(0, 0, 0, 0.45)",
  },
];

export function getDesktopTheme(id) {
  return DESKTOP_THEMES.find((theme) => theme.id === id) || DESKTOP_THEMES[0];
}

export function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}
