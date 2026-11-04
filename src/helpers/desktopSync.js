const CHANNEL_NAME = "weektodo-desktop-sync";

let channel = null;

function getChannel() {
  if (channel) return channel;
  if (typeof BroadcastChannel === "undefined") return null;
  channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function notifyTodoListChanged(todoListId) {
  const ch = getChannel();
  if (!ch || !todoListId) return;
  try {
    ch.postMessage({ type: "todo-list", id: todoListId });
  } catch (error) {
    // Cross-window sync is best-effort; the data is already in IndexedDB.
    console.warn("Desktop sync failed", error);
  }
}

export function notifyDataChanged() {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage({ type: "all" });
  } catch (error) {
    console.warn("Desktop sync failed", error);
  }
}

export function notifyConfigChanged(config) {
  if (!config) return;
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: "config", config });
    } catch (error) {
      console.warn("Desktop config sync failed", error);
    }
  }

  // BroadcastChannel covers Chromium windows that share a session, but the
  // Electron IPC broadcast is kept as a second path because a settings change
  // must reach the embedded widget even if the channel is unavailable.
  try {
    if (typeof require !== "undefined" && typeof window !== "undefined") {
      const { ipcRenderer } = require("electron");
      if (ipcRenderer) ipcRenderer.send("desktop-config-changed", config);
    }
  } catch (error) {
    // Plain browser builds do not have Electron.
  }
}

export function onDesktopSync(callback) {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event) => {
    const data = event.data || {};
    callback(data);
  };

  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
