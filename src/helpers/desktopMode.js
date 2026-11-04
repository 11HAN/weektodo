const browserAvailable = typeof window !== "undefined";
const searchParams = browserAvailable
  ? new URLSearchParams(window.location.search)
  : null;

export const IS_DESKTOP_MODE =
  browserAvailable &&
  (searchParams.has("desktop") || window.location.hash === "#desktop");

export const IS_DESKTOP_SETTINGS_WINDOW =
  browserAvailable && searchParams.has("settings");

/**
 * The desktop widget reuses the normal weekly view, but it must always show
 * the calendar (not the custom-list panel) and a full seven-day window.
 */
export function applyDesktopConfig(store) {
  store.commit("updateConfig", { key: "calendar", val: true });
  store.commit("updateConfig", { key: "customList", val: false });
  store.commit("updateConfig", { key: "columns", val: 7 });
}
