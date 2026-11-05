"use strict";

import { app, protocol, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen, dialog } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

const Config = require("electron-config");
const config = new Config();
const desktopLayer = require("./desktopLayer");
const fs = require("fs");
const { execFile } = require("child_process");

const isDevelopment = process.env.NODE_ENV !== "production";
// The CSS card radius is 20px. The native region is slightly larger so the
// anti-aliased CSS edge is never clipped by the binary window region.
const DESKTOP_CARD_RADIUS = 20;
const DESKTOP_REGION_RADIUS = DESKTOP_CARD_RADIUS + 2;
const DESKTOP_MAX_WIDTH = 1250;
const gotTheLock = app.requestSingleInstanceLock();
const isServeMode = () => {
  return process.env.WEBPACK_DEV_SERVER_URL;
};

let mainWindow = null;
let desktopWindow = null;
let settingsWindow = null;
let desktopAttachment = null;
let desktopBackdropData = null;
let stopDesktopWatchdog = null;
let desktopRecreateTimer = null;
let desktopWidgetStopping = false;
let desktopTextEditing = false;
let desktopTopLevel = false;
let desktopShellTimer = null;
let desktopShellStableActive = null;
let desktopShellStableSince = 0;
let desktopMoveSession = null;
let desktopWidgetErrorShown = false;
var tray = null;
var trayContextMenu = null;
var trayMenuTemplate = null;
var SplashScreenIsHidden = true;
const path = require("path");

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true, stream: true } }]);

async function createWindow() {
  let opts = {
    minWidth: 1000,
    minHeight: 600,
    show: !config.get("runInBackground"),
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
    },
  };

  Object.assign(opts, config.get("winBounds"));

  mainWindow = new BrowserWindow(opts);
  mainWindow.removeMenu();

   mainWindow.webContents.setWindowOpenHandler((details) => {
    require("electron").shell.openExternal(details.url);
    return { action: 'deny' }
  })

  ipcMain.on("show-current-window", showCurrentWindow);
  ipcMain.on("is-windows-visible", isWindowsVisible);
  ipcMain.on("match-open-on-startup", matchOpenOnStartup);
  ipcMain.on("set-open-on-startup", setOpenOnStartup);
  ipcMain.on("set-run-in-background", setRunInBackground);
  ipcMain.on("set-tray-context-menu-label", setTrayContextMenuLabel);
  ipcMain.on("set-dark-tray-icon", setDarkTrayIcon);
  ipcMain.on("clear-config", clearConfig);
  ipcMain.on("desktop-widget-focus", focusDesktopWidget);
  ipcMain.on("desktop-backdrop-request", sendDesktopBackdrop);

  if (typeof config.get("runInBackground") == "undefined") {
    config.set("runInBackground", true);
  }

  if (typeof config.get("desktopWidget") == "undefined") {
    config.set("desktopWidget", process.platform === "win32");
  }

  mainWindow.on("close", function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      config.set("winBounds", mainWindow.getBounds());
      config.set("isMaximized", mainWindow.isMaximized());
      if (config.get("runInBackground")) {
        hideWindow(mainWindow);
      } else {
        closeApp();
      }
    }

    return false;
  });

  mainWindow.on("restore", function () {
    setTimeout(hideSplashScreen, 4500);
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol("app");
    mainWindow.loadURL("app://./index.html");
  }
}

let cachedSystemFonts = null;

function getSystemFonts() {
  if (process.platform !== "win32") return Promise.resolve([]);
  if (cachedSystemFonts) return Promise.resolve(cachedSystemFonts);

  return new Promise((resolve) => {
    const script = [
      "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;",
      "Add-Type -AssemblyName System.Drawing;",
      "(New-Object System.Drawing.Text.InstalledFontCollection).Families",
      "| ForEach-Object { $_.Name } | Sort-Object -Unique",
    ].join(" ");

    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024, encoding: "utf8" },
      (error, stdout) => {
        if (error && !stdout) {
          console.error("[fonts] could not enumerate system fonts:", error);
          resolve([]);
          return;
        }

        const fonts = Array.from(
          new Set(
            String(stdout || "")
              .split(/\r?\n/)
              .map((font) => font.trim())
              .filter(Boolean)
          )
        ).sort((left, right) => left.localeCompare(right));

        cachedSystemFonts = fonts;
        resolve(fonts);
      }
    );
  });
}

function getDesktopWidgetBounds() {
  const display = screen.getPrimaryDisplay();
  const area = display.workArea;
  const saved = config.get("desktopWidgetBounds");

  let width = Math.min(
    DESKTOP_MAX_WIDTH,
    Math.max(900, Math.round(area.width * 0.72))
  );
  let height = Math.min(680, Math.max(480, Math.round(area.height * 0.56)));
  let x = area.x + area.width - width - 40;
  let y = area.y + 40;

  if (
    saved &&
    Number.isFinite(saved.width) &&
    Number.isFinite(saved.height) &&
    Number.isFinite(saved.x) &&
    Number.isFinite(saved.y)
  ) {
    // Keep the right edge in place when a saved layout is clamped to the screen.
    const savedRight = saved.x + saved.width;
    width = Math.min(Math.max(720, saved.width), area.width);
    height = Math.min(Math.max(320, saved.height), area.height);
    x = savedRight - width;
    y = saved.y;
  }

  x = Math.min(Math.max(x, area.x), area.x + area.width - width);
  y = Math.min(Math.max(y, area.y), area.y + area.height - height);

  return {
    x,
    y,
    width,
    height,
    scale: display.scaleFactor || 1,
  };
}

async function createDesktopWindow() {
  if (!desktopLayer.isSupported() || !config.get("desktopWidget")) return;
  if (desktopWindow && !desktopWindow.isDestroyed()) return;
  desktopTextEditing = false;
  desktopTopLevel = false;

  const widgetBounds = getDesktopWidgetBounds();

  desktopWindow = new BrowserWindow({
    x: widgetBounds.x,
    y: widgetBounds.y,
    width: widgetBounds.width,
    height: widgetBounds.height,
    frame: false,
    transparent: false,
    backgroundColor: "#eef2f8",
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: true,
    show: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  desktopWindow.removeMenu();
  desktopWindow.setSkipTaskbar(true);
  desktopWindow.setAlwaysOnTop(false);

  desktopWindow.on("close", (event) => {
    if (app.isQuiting || desktopWidgetStopping) return;
    event.preventDefault();
    setDesktopWidgetEnabled(false);
  });

  desktopWindow.on("closed", () => {
    stopDesktopMove(false);
    if (stopDesktopWatchdog) {
      stopDesktopWatchdog();
      stopDesktopWatchdog = null;
    }
    desktopAttachment = null;
    desktopWindow = null;
    scheduleDesktopRecreate();
  });

  desktopWindow.once("ready-to-show", () => {
    if (!desktopWindow || desktopWindow.isDestroyed()) return;
    desktopBackdropData = buildDesktopBackdrop();
    desktopWindow.showInactive();
    sendDesktopBackdrop();
    attachDesktopWindow();
    startDesktopShellWatcher();
    setTimeout(sendDesktopBackdrop, 800);
  });

  try {
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      const url = new URL(process.env.WEBPACK_DEV_SERVER_URL);
      url.searchParams.set("desktop", "1");
      await desktopWindow.loadURL(url.toString());
    } else {
      await desktopWindow.loadURL("app://./index.html#desktop");
    }
  } catch (error) {
    desktopLog(`load failed: ${error && error.stack ? error.stack : error}`);
    config.set("desktopWidget", false);
    updateTrayMenu();
    stopDesktopWidget();
    throw error;
  }
}

function buildDesktopBackdrop() {
  if (!desktopLayer.isSupported() || !desktopWindow || desktopWindow.isDestroyed()) {
    return null;
  }

  try {
    const display = screen.getPrimaryDisplay();
    const scale = display.scaleFactor || 1;
    const bounds = desktopWindow.getBounds();
    const capture = desktopLayer.captureDesktopRegion({
      x: bounds.x * scale,
      y: bounds.y * scale,
      width: bounds.width * scale,
      height: bounds.height * scale,
    });
    if (!capture) return null;

    let image = nativeImage.createFromBitmap(capture.data, {
      width: capture.width,
      height: capture.height,
      scaleFactor: 1,
    });
    const width = Math.min(1200, Math.max(320, Math.round(capture.width / 2)));
    const height = Math.max(1, Math.round((width / capture.width) * capture.height));
    image = image.resize({ width, height });

    const jpeg = image.toJPEG(74);
    if (!jpeg || !jpeg.length) return null;
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    desktopLog(`backdrop capture failed: ${error && error.stack ? error.stack : error}`);
    return null;
  }
}

function sendDesktopBackdrop() {
  if (!desktopBackdropData || !desktopWindow || desktopWindow.isDestroyed()) return;
  desktopWindow.webContents.send("desktop-backdrop", desktopBackdropData);
}

function attachDesktopWindow() {
  if (!desktopWindow || desktopWindow.isDestroyed()) return;

  const display = screen.getPrimaryDisplay();
  const scale = display.scaleFactor || 1;
  const bounds = desktopWindow.getBounds();

  try {
    desktopAttachment = desktopLayer.attachWindow(
      desktopWindow,
      {
        x: bounds.x * scale,
        y: bounds.y * scale,
        width: bounds.width * scale,
        height: bounds.height * scale,
      },
      { radius: DESKTOP_REGION_RADIUS * scale }
    );
    desktopLog(
      `attached to ${desktopLayer.describeTarget(desktopAttachment.target)} ` +
        `(${desktopAttachment.targetMode})`
    );
    startDesktopWatchdog();
  } catch (error) {
    handleDesktopAttachError(error);
  }
}

/**
 * While the Windows desktop is the active context, keep the widget as a
 * normal top-level window. Chromium only reports the caret position to the
 * IME when its window is an active top-level window; a native child of
 * SHELLDLL_DefView falls back to the screen origin. As soon as another
 * application takes the foreground, the widget is reattached to the desktop
 * tree so it keeps its real desktop-layer behaviour.
 */
function isDesktopForeground() {
  const foreground = desktopLayer.getForegroundWindowInfo();
  if (!foreground || !foreground.className) return false;

  if (
    foreground.className === "Progman" ||
    foreground.className === "WorkerW" ||
    foreground.className === "SHELLDLL_DefView" ||
    foreground.className === "Shell_TrayWnd"
  ) {
    return true;
  }

  return !!(
    desktopAttachment &&
    foreground.hwnd === desktopAttachment.hwnd
  );
}

function setDesktopTopLevel(enabled) {
  if (enabled) {
    if (
      desktopTopLevel ||
      !desktopAttachment ||
      !desktopWindow ||
      desktopWindow.isDestroyed()
    ) {
      return;
    }
    if (stopDesktopWatchdog) {
      stopDesktopWatchdog();
      stopDesktopWatchdog = null;
    }
    try {
      desktopLayer.detachWindow(desktopAttachment, {
        screenBounds: desktopAttachment.screenBounds,
        keepRegion: true,
      });
      desktopTopLevel = true;
      desktopWindow.setSkipTaskbar(true);
      desktopWindow.setAlwaysOnTop(false);
      desktopLog("shell mode: top-level while desktop is active");
    } catch (error) {
      desktopTextEditing = false;
      desktopLog(
        `shell mode detach failed: ${error && error.stack ? error.stack : error}`
      );
      startDesktopWatchdog();
    }
    return;
  }

  if (!desktopTopLevel) return;
  desktopTopLevel = false;
  attachDesktopWindow();
  desktopLog("shell mode: reattached to desktop layer");
}

function syncDesktopShellMode() {
  if (!desktopAttachment || !desktopWindow || desktopWindow.isDestroyed()) return;
  if (desktopWidgetStopping || app.isQuiting) return;
  if (desktopTextEditing) return;

  const desktopActive = isDesktopForeground();
  const now = Date.now();
  if (desktopActive !== desktopShellStableActive) {
    desktopShellStableActive = desktopActive;
    desktopShellStableSince = now;
    return;
  }

  // Win+D briefly changes the foreground several times. Only switch after
  // the state has been stable for a while, otherwise the reparent itself
  // shows up as a flicker.
  if (now - desktopShellStableSince < 700) return;

  if (desktopActive && !desktopTopLevel) {
    setDesktopTopLevel(true);
  } else if (!desktopActive && desktopTopLevel) {
    setDesktopTopLevel(false);
  }
}

function startDesktopShellWatcher() {
  if (desktopShellTimer) clearInterval(desktopShellTimer);
  desktopShellStableActive = isDesktopForeground();
  desktopShellStableSince = Date.now();
  desktopShellTimer = setInterval(syncDesktopShellMode, 200);
}

function stopDesktopShellWatcher() {
  if (desktopShellTimer) {
    clearInterval(desktopShellTimer);
    desktopShellTimer = null;
  }
}

function startDesktopTextEdit(event) {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win !== desktopWindow || !desktopAttachment || desktopTextEditing) return;

  desktopTextEditing = true;

  if (!desktopTopLevel) {
    const bounds = desktopAttachment.screenBounds;
    if (!bounds) {
      desktopTextEditing = false;
      return;
    }
    if (stopDesktopWatchdog) {
      stopDesktopWatchdog();
      stopDesktopWatchdog = null;
    }
    try {
      desktopLayer.detachWindow(desktopAttachment, {
        screenBounds: bounds,
        keepRegion: true,
      });
      desktopTopLevel = true;
      desktopWindow.setSkipTaskbar(true);
      desktopWindow.setAlwaysOnTop(false);
    } catch (error) {
      desktopTextEditing = false;
      desktopLog(
        `text edit detach failed: ${error && error.stack ? error.stack : error}`
      );
      startDesktopWatchdog();
      return;
    }
  }

  try {
    // Electron's focus() does not always beat Windows' foreground lock when
    // the window was just reparented. Move focus through user32 as well so
    // Chromium is the active window and reports the caret to the IME.
    desktopLayer.focusWindow(desktopAttachment);
    desktopWindow.focus();
    desktopWindow.webContents.focus();
    const foreground = desktopLayer.getForegroundWindowInfo();
    const parent = desktopLayer.getParentWindowInfo(desktopAttachment);
    const rect = desktopLayer.getWindowScreenRect(desktopAttachment);
    desktopLog(
      `text edit: ${desktopTopLevel ? "top-level ready" : "attached"} ` +
        `parent=${parent && parent.className} ` +
        `foreground=${foreground.className} rect=${JSON.stringify(rect)}`
    );
  } catch (error) {
    desktopLog(
      `text edit focus failed: ${error && error.stack ? error.stack : error}`
    );
  }
}

function finishDesktopTextEdit() {
  if (!desktopTextEditing) return;
  desktopTextEditing = false;

  // Staying top-level while the desktop remains active avoids a reparent and
  // repaint between two consecutive task edits. The shell watcher reattaches
  // the window once another application gets the foreground.
  if (desktopTopLevel) {
    desktopLog("text edit: kept top-level");
    return;
  }

  const restoreFocus =
    desktopWindow && !desktopWindow.isDestroyed() && desktopWindow.isFocused();

  attachDesktopWindow();
  if (restoreFocus && desktopAttachment) {
    desktopLayer.focusWindow(desktopAttachment);
  }
  desktopLog("text edit: reattached to desktop layer");
}

function stopDesktopTextEdit(event) {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win !== desktopWindow) return;
  finishDesktopTextEdit();
}

function repositionDesktopWidget() {
  if (!desktopAttachment) return;
  const b = getDesktopWidgetBounds();
  desktopLayer.setWindowBounds(desktopAttachment, {
    x: b.x * b.scale,
    y: b.y * b.scale,
    width: b.width * b.scale,
    height: b.height * b.scale,
  });
}

function handleDesktopAttachError(error) {
  console.error("[desktop] could not attach window:", error);
  desktopLog(`attach failed: ${error && error.stack ? error.stack : error}`);
  if (!desktopWidgetErrorShown) {
    desktopWidgetErrorShown = true;
    dialog.showErrorBox(
      "WeekToDo desktop widget",
      "WeekToDo could not attach its widget to the Windows desktop layer.\n\n" +
        "The widget has been disabled. It will not pretend to be embedded by " +
        "using an always-on-top or bottom window.\n\n" +
        (error && error.message ? error.message : String(error))
    );
  }

  config.set("desktopWidget", false);
  updateTrayMenu();
  stopDesktopWidget();
}

function focusDesktopWidget(event) {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win !== desktopWindow || !desktopAttachment) return;
  if (
    !desktopTopLevel &&
    !desktopTextEditing &&
    isDesktopForeground()
  ) {
    setDesktopTopLevel(true);
  }
  desktopLayer.focusWindow(desktopAttachment);
  const cleared = desktopLayer.clearDesktopSelection();
  if (cleared > 0) {
    desktopLog(`cleared ${cleared} desktop icon selection(s)`);
  }
}

function desktopLog(message) {
  try {
    fs.appendFileSync(
      path.join(app.getPath("userData"), "desktop-widget.log"),
      `${new Date().toISOString()} ${message}\n`
    );
  } catch (error) {
    // Logging must never take the app down.
  }
}

function startDesktopWatchdog() {
  if (stopDesktopWatchdog) {
    stopDesktopWatchdog();
    stopDesktopWatchdog = null;
  }
  if (!desktopAttachment || !desktopWindow) return;

  stopDesktopWatchdog = desktopLayer.watch(desktopWindow, desktopAttachment, {
    onState: (state) => {
      desktopAttachment = state;
      console.log(
        `[desktop] re-attached to ${desktopLayer.describeTarget(state.target)} ` +
          `(${state.targetMode})`
      );
    },
    onError: (error) => {
      console.error("[desktop] watchdog re-attach failed:", error);
    },
    onLost: () => {
      desktopLog("native window was lost; recreating widget");
      stopDesktopWatchdog = null;
      desktopAttachment = null;
      if (desktopWindow && !desktopWindow.isDestroyed()) {
        desktopWindow.destroy();
      }
      desktopWindow = null;
      scheduleDesktopRecreate();
    },
  });
}

function scheduleDesktopRecreate() {
  if (
    desktopRecreateTimer ||
    app.isQuiting ||
    desktopWidgetStopping ||
    !config.get("desktopWidget")
  ) {
    return;
  }

  desktopRecreateTimer = setTimeout(() => {
    desktopRecreateTimer = null;
    if (app.isQuiting || desktopWidgetStopping || !config.get("desktopWidget")) {
      return;
    }
    desktopLog("recreating desktop window");
    createDesktopWindow().catch((error) => {
      desktopLog(`recreate failed: ${error && error.stack ? error.stack : error}`);
      console.error("[desktop] recreate failed:", error);
    });
  }, 1200);
}

function stopDesktopWidget() {
  stopDesktopMove(false);
  desktopWidgetStopping = true;
  desktopTextEditing = false;
  desktopTopLevel = false;
  stopDesktopShellWatcher();
  if (desktopRecreateTimer) {
    clearTimeout(desktopRecreateTimer);
    desktopRecreateTimer = null;
  }
  if (stopDesktopWatchdog) {
    stopDesktopWatchdog();
    stopDesktopWatchdog = null;
  }
  if (desktopAttachment) {
    try {
      desktopLayer.detachWindow(desktopAttachment);
    } catch (error) {
      console.error("[desktop] detach failed:", error);
    }
    desktopAttachment = null;
  }
  if (desktopWindow && !desktopWindow.isDestroyed()) {
    desktopWindow.destroy();
  }
  desktopWindow = null;
  desktopWidgetStopping = false;
}

function startDesktopMove(mode, direction) {
  if (desktopTextEditing) return;
  if (!desktopAttachment || desktopMoveSession) return;

  const rect = desktopLayer.getWindowScreenRect(desktopAttachment);
  const cursor = desktopLayer.getCursorPosition();
  let parentRect;
  if (desktopAttachment.topLevel) {
    const display = screen.getPrimaryDisplay();
    const displayScale = display.scaleFactor || 1;
    parentRect = {
      x: Math.round(display.bounds.x * displayScale),
      y: Math.round(display.bounds.y * displayScale),
      width: Math.round(display.bounds.width * displayScale),
      height: Math.round(display.bounds.height * displayScale),
    };
  } else {
    parentRect = desktopLayer.getWindowScreenRect(desktopAttachment.target);
  }
  if (!rect || !cursor || !parentRect) return;

  desktopLog(
    `move start: mode=${mode} direction=${direction || "se"} ` +
      `cursor=${cursor.x},${cursor.y} rect=${rect.x},${rect.y},${rect.width}x${rect.height}`
  );

  const session = {
    mode,
    direction: direction || "se",
    startCursor: cursor,
    startRect: rect,
    parentRect,
  };

  session.timer = setInterval(() => {
    if (desktopMoveSession !== session) return;
    if (!desktopLayer.isLeftButtonDown()) {
      stopDesktopMove();
      return;
    }

    const current = desktopLayer.getCursorPosition();
    if (!current) return;

    const dx = current.x - session.startCursor.x;
    const dy = current.y - session.startCursor.y;
    let { x, y, width, height } = session.startRect;

    if (mode === "resize") {
      const dir = session.direction;
      const parent = session.parentRect;
      const scale = screen.getPrimaryDisplay().scaleFactor || 1;
      const minWidth = Math.min(720 * scale, parent.width);
      const minHeight = Math.min(320 * scale, parent.height);
      let left = session.startRect.x;
      let top = session.startRect.y;
      let right = left + session.startRect.width;
      let bottom = top + session.startRect.height;

      if (dir.includes("e")) {
        right = Math.min(parent.x + parent.width, Math.max(left + minWidth, right + dx));
      }
      if (dir.includes("w")) {
        left = Math.max(parent.x, Math.min(right - minWidth, left + dx));
      }
      if (dir.includes("s")) {
        bottom = Math.min(parent.y + parent.height, Math.max(top + minHeight, bottom + dy));
      }
      if (dir.includes("n")) {
        top = Math.max(parent.y, Math.min(bottom - minHeight, top + dy));
      }

      x = left;
      y = top;
      width = right - left;
      height = bottom - top;
    } else {
      x = session.startRect.x + dx;
      y = session.startRect.y + dy;

      x = Math.min(
        Math.max(x, session.parentRect.x),
        session.parentRect.x + session.parentRect.width - width
      );
      y = Math.min(
        Math.max(y, session.parentRect.y),
        session.parentRect.y + session.parentRect.height - height
      );
    }

    desktopLayer.setWindowBounds(desktopAttachment, { x, y, width, height });
  }, 16);

  desktopMoveSession = session;
}

function saveDesktopBounds() {
  if (!desktopAttachment) return;
  const rect = desktopLayer.getWindowScreenRect(desktopAttachment);
  if (!rect) return;
  const scale = screen.getPrimaryDisplay().scaleFactor || 1;
  config.set("desktopWidgetBounds", {
    x: Math.round(rect.x / scale),
    y: Math.round(rect.y / scale),
    width: Math.round(rect.width / scale),
    height: Math.round(rect.height / scale),
  });
}

function stopDesktopMove(save = true) {
  if (!desktopMoveSession) return;
  clearInterval(desktopMoveSession.timer);
  desktopMoveSession = null;
  if (save) saveDesktopBounds();
  if (desktopWindow && !desktopWindow.isDestroyed()) {
    desktopWindow.webContents.send("desktop-widget-move-ended");
  }
}

function resetDesktopBounds() {
  stopDesktopMove(false);
  config.set("desktopWidgetBounds", null);
  if (!desktopAttachment) return;
  const bounds = getDesktopWidgetBounds();
  desktopLayer.setWindowBounds(desktopAttachment, {
    x: bounds.x * bounds.scale,
    y: bounds.y * bounds.scale,
    width: bounds.width * bounds.scale,
    height: bounds.height * bounds.scale,
  });
  saveDesktopBounds();
}

function setDesktopWidgetEnabled(enabled) {
  desktopWidgetStopping = false;
  if (enabled) desktopWidgetErrorShown = false;
  config.set("desktopWidget", !!enabled);
  const item = trayMenuTemplate.find((entry) => entry.id === "desktopWidget");
  if (item) item.checked = !!enabled;
  if (enabled) {
    createDesktopWindow().catch((error) => {
      console.error("[desktop] enable failed:", error);
      config.set("desktopWidget", false);
      updateTrayMenu();
    });
  } else {
    stopDesktopWidget();
  }
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray || !trayMenuTemplate) return;
  const item = trayMenuTemplate.find((entry) => entry.id === "desktopWidget");
  if (item) item.checked = !!config.get("desktopWidget");
  trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(trayContextMenu);
}

function registerDesktopIpc() {
  ipcMain.on("is-windows-visible", isWindowsVisible);
  ipcMain.on("desktop-widget-focus", focusDesktopWidget);
  ipcMain.on("desktop-widget-text-edit-start", startDesktopTextEdit);
  ipcMain.on("desktop-widget-text-edit-end", stopDesktopTextEdit);
  ipcMain.on("desktop-backdrop-request", sendDesktopBackdrop);
  ipcMain.handle("get-app-info", () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: process.platform,
    arch: process.arch,
  }));
  ipcMain.on("desktop-widget-drag-start", () => startDesktopMove("move"));
  ipcMain.on("desktop-widget-resize-start", (_event, direction) =>
    startDesktopMove("resize", direction)
  );
  ipcMain.on("desktop-widget-drag-end", () => stopDesktopMove());
  ipcMain.on("desktop-widget-resize-end", () => stopDesktopMove());
  ipcMain.on("desktop-widget-reset-bounds", resetDesktopBounds);
  ipcMain.on("desktop-widget-open-settings", openSettingsWindow);
  ipcMain.on("desktop-config-changed", (event, config) => {
    if (!config) return;
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win.isDestroyed() || win.webContents === event.sender) return;
      win.webContents.send("desktop-config-changed", config);
    });
  });
  ipcMain.on("close-desktop-settings", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win === settingsWindow) settingsWindow.close();
  });
}

function openSettingsWindow() {
  if (!app.isReady()) {
    app.whenReady().then(openSettingsWindow);
    return;
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 760,
    minHeight: 520,
    frame: false,
    thickFrame: true,
    show: false,
    center: true,
    title: "WeekToDo Settings",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    backgroundColor: "#eef2f8",
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  settingsWindow.removeMenu();
  settingsWindow.on("page-title-updated", (event) => event.preventDefault());
  settingsWindow.webContents.setWindowOpenHandler((details) => {
    require("electron").shell.openExternal(details.url);
    return { action: "deny" };
  });
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
  settingsWindow.once("ready-to-show", () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) return;
    settingsWindow.show();
    settingsWindow.focus();
  });

  const load = async () => {
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      const url = new URL(process.env.WEBPACK_DEV_SERVER_URL);
      url.searchParams.set("desktop", "1");
      url.searchParams.set("settings", "1");
      await settingsWindow.loadURL(url.toString());
    } else {
      await settingsWindow.loadURL("app://./index.html?desktop=1&settings=1");
    }
  };

  load().catch((error) => {
    console.error("[desktop] could not open settings window:", error);
    if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.destroy();
    settingsWindow = null;
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (process.platform === "win32") {
      openSettingsWindow();
      return;
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      } else {
        if (config.get("isMaximized")) mainWindow.maximize();
      }
      showWindow(mainWindow);
    } else {
      createWindow();
    }
    setTimeout(hideSplashScreen, 5000);
  });
  app.on("window-all-closed", () => {
    if (process.platform === "darwin") return;
    if (process.platform === "win32" && tray && !app.isQuiting) return;
    app.quit();
  });

  app.on("activate", () => {
    if (process.platform !== "darwin") return;
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (!app.dock.isVisible()) {
      showWindow(mainWindow);
    }
  });

  app.on("ready", async () => {
    createTray();
    ipcMain.handle("get-system-fonts", getSystemFonts);

    if (process.platform === "win32") {
      if (!process.env.WEBPACK_DEV_SERVER_URL) {
        createProtocol("app");
      }
      if (typeof config.get("desktopWidget") === "undefined") {
        config.set("desktopWidget", true);
      }
      updateTrayMenu();
      registerDesktopIpc();

      screen.on("display-metrics-changed", repositionDesktopWidget);
      screen.on("display-added", repositionDesktopWidget);
      screen.on("display-removed", repositionDesktopWidget);

      desktopLog(`startup: desktopWidget=${config.get("desktopWidget")}`);
      if (config.get("desktopWidget")) {
        createDesktopWindow().catch((error) => {
          desktopLog(`startup failed: ${error && error.stack ? error.stack : error}`);
          console.error("[desktop] startup failed:", error);
        });
      }
    } else {
      await createWindow();
    }

    if (isDevelopment && !process.env.IS_TEST) {
      try {
        await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error("Vue Devtools failed to install:", e.toString());
      }
    }
  });

  app.on("before-quit", () => {
    app.isQuiting = true;
    stopDesktopWidget();
  });

  if (isDevelopment) {
    if (process.platform === "win32") {
      process.on("message", (data) => {
        if (data === "graceful-exit") {
          app.quit();
        }
      });
    } else {
      process.on("SIGTERM", () => {
        app.quit();
      });
    }
  }
}

function hideSplashScreen() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(
    "if(document.getElementById('splashScreen')) document.getElementById('splashScreen').classList.add('hiddenSplashScreen');"
  );
}

function showCurrentWindow(event) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (!win) return;
  if (config.get("isMaximized") && mainWindow) mainWindow.maximize();
  showWindow(win);
}

function isWindowsVisible(event) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  event.returnValue = win.isVisible();
}

function setOpenOnStartup(event, openOnStartup) {
  let AutoLaunch = require("auto-launch");
  let autoLauncher = new AutoLaunch({
    name: "WeekToDo Planner",
    path: app.getPath("exe"),
  });
  if (openOnStartup) {
    autoLauncher.enable();
  } else {
    autoLauncher.disable();
  }
}

function clearConfig() {
  config.set("runInBackground", true);
  config.set("desktopWidget", process.platform === "win32");
}

function setRunInBackground(event, runInBackground) {
  config.set("runInBackground", runInBackground);
}

function setDarkTrayIcon(event, darkTrayIcon) {
  config.set("darkTrayIcon", darkTrayIcon);
  tray.setImage(creatTrayIconPath());
}

function setTrayContextMenuLabel(event, labels) {
  config.set("openLabel", labels.open);
  config.set("quitLabel", labels.quit);
  if (!trayMenuTemplate) return;

  const openItem = trayMenuTemplate.find((item) => item.id === "open");
  const quitItem = trayMenuTemplate.find((item) => item.id === "quit");
  if (openItem) openItem.label = labels.open;
  if (quitItem) quitItem.label = labels.quit;

  const menu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(menu);
}

function matchOpenOnStartup(event, openOnStartup) {
  let AutoLaunch = require("auto-launch");
  let autoLauncher = new AutoLaunch({
    name: "WeekToDo Planner",
    path: app.getPath("exe"),
  });

  autoLauncher
    .isEnabled()
    .then((isEnabled) => {
      if (openOnStartup != isEnabled) {
        if (openOnStartup) {
          autoLauncher.enable();
        } else {
          autoLauncher.disable();
        }
      }
    })
    .catch(function (err) {
      throw err;
    });
}

function showWindow(window) {
  if (!window) return;
  if (process.platform === "darwin") app.dock.show();
  window.show();
  if (SplashScreenIsHidden) {
    SplashScreenIsHidden = false;
    setTimeout(function () {
      mainWindow.webContents.send("initial-checks");
    }, 4000);
  }
}

function hideWindow(window) {
  if (!window) return;
  window.hide();
  if (process.platform === "darwin") app.dock.hide();
}

function closeApp() {
  app.isQuiting = true;
  if (mainWindow) {
    config.set("winBounds", mainWindow.getBounds());
    config.set("isMaximized", mainWindow.isMaximized());
  }
  app.quit();
}

function createTray() {
  if (!config.get("darkTrayIcon")) {
    config.set("darkTrayIcon", false);
  }

  var iconPath = creatTrayIconPath();
  tray = new Tray(iconPath);

  if (!config.get("openLabel")) {
    config.set("openLabel", process.platform === "win32" ? "Settings" : "Open");
    config.set("quitLabel", "Quit");
  }

  trayMenuTemplate = [
    {
      id: "open",
      label: process.platform === "win32" ? "Settings" : config.get("openLabel"),
      click() {
        if (process.platform === "win32") {
          openSettingsWindow();
          return;
        }
        if (config.get("isMaximized")) mainWindow.maximize();
        showWindow(mainWindow);
        setTimeout(hideSplashScreen, 5000);
      },
    },
    {
      id: "desktopWidget",
      label: "Desktop widget",
      type: "checkbox",
      checked: !!config.get("desktopWidget"),
      click(item) {
        setDesktopWidgetEnabled(item.checked);
      },
    },
    {
      id: "quit",
      label: config.get("quitLabel"),
      click() {
        app.isQuiting = true;
        if (mainWindow) {
          config.set("winBounds", mainWindow.getBounds());
          config.set("isMaximized", mainWindow.isMaximized());
        }
        app.quit();
      },
    },
  ];

  trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setToolTip("WeekToDo Planner");
  tray.setContextMenu(trayContextMenu);
  tray.on("click", () => {
    tray.popUpContextMenu();
  });
}

function creatTrayIconPath() {
  const path = require("path");
  const darkPrefix = config.get("darkTrayIcon") ? "Dark" : "";

  var iconPath;
  if (process.platform === "win32") {
    app.setAppUserModelId("WeekToDo");
    iconPath = path.join(__dirname, `/trayIcon${darkPrefix}.ico`);
  } else if (process.platform === "darwin") {
    iconPath = nativeImage.createFromPath(path.join(__dirname, `/trayIcon${darkPrefix}.png`));
  } else {
    iconPath = isServeMode()
      ? path.join(__dirname, `/bundled/trayIcon${darkPrefix}@3x.png`)
      : path.join(__dirname, `/trayIcon${darkPrefix}@3x.png`);
  }
  return iconPath;
}
