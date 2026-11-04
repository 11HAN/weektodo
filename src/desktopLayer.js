"use strict";

/**
 * Windows desktop-layer attachment for WeekToDo.
 *
 * This module deliberately does not fake "desktop mode" with always-on-top or
 * lower(). It makes the BrowserWindow a real WS_CHILD of the shell's desktop
 * tree:
 *   - SHELLDLL_DefView (above the icon list) for the interactive WeekToDo
 *     widget, so mouse/keyboard input reaches it;
 *   - WorkerW/Progman for the classic display-only wallpaper layer.
 *
 * The native bindings are loaded lazily so the module can be imported on
 * macOS/Linux without touching user32.dll.
 */

const GWL_STYLE = -16;
const GWL_EXSTYLE = -20;

const WS_CHILD = 0x40000000;
const WS_POPUP = 0x80000000;
const WS_CAPTION = 0x00c00000;
const WS_THICKFRAME = 0x00040000;
const WS_SYSMENU = 0x00080000;
const WS_MINIMIZEBOX = 0x00020000;
const WS_MAXIMIZEBOX = 0x00010000;
const WS_CLIPSIBLINGS = 0x04000000;

const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_APPWINDOW = 0x00040000;

const SWP_NOSIZE = 0x0001;
const SWP_NOMOVE = 0x0002;
const SWP_NOACTIVATE = 0x0010;
const SWP_FRAMECHANGED = 0x0020;
const SWP_SHOWWINDOW = 0x0040;

const SW_SHOW = 5;
const SW_SHOWNOACTIVATE = 4;

const GW_HWNDNEXT = 2;
const GW_HWNDPREV = 3;
const HWND_BOTTOM = 1;
const SMTO_NORMAL = 0x0000;

let api = null;

function toNumber(value) {
  if (typeof value === "bigint") return Number(value);
  return Number(value || 0);
}

function createGuid(data1, data2, data3, data4) {
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(data1 >>> 0, 0);
  buffer.writeUInt16LE(data2 >>> 0, 4);
  buffer.writeUInt16LE(data3 >>> 0, 6);
  Buffer.from(data4).copy(buffer, 8);
  return buffer;
}

function createIntVariant(value) {
  const buffer = Buffer.alloc(24);
  buffer.writeUInt16LE(3, 0); // VT_I4
  buffer.writeInt32LE(value, 8);
  return buffer;
}

function callCom(ptr, index, proto, ...args) {
  const a = loadApi();
  const vtable = a.koffi.decode(ptr, "void *");
  const fn = a.koffi.decode(vtable, index * a.ptrSize, "void *");
  return a.koffi.call(fn, proto, ptr, ...args);
}

function loadApi() {
  if (api) return api;
  if (process.platform !== "win32") {
    throw new Error("Desktop attachment is only available on Windows");
  }

  const koffi = require("koffi");
  const user32 = koffi.load("user32.dll");
  const gdi32 = koffi.load("gdi32.dll");
  const kernel32 = koffi.load("kernel32.dll");
  const ole32 = koffi.load("ole32.dll");
  const oleacc = koffi.load("oleacc.dll");
  const fn = (name, result, args) => user32.func("__stdcall", name, result, args);
  const gfn = (name, result, args) => gdi32.func("__stdcall", name, result, args);
  const kfn = (name, result, args) =>
    kernel32.func("__stdcall", name, result, args);
  const ofn = (name, result, args) => ole32.func("__stdcall", name, result, args);
  const afn = (name, result, args) =>
    oleacc.func("__stdcall", name, result, args);
  const is64 = process.arch === "x64" || process.arch === "arm64";

  api = {
    koffi,
    ptrSize: is64 ? 8 : 4,
    comInitialized: false,
    iidAccessible: createGuid(
      0x618736e0,
      0x3c3d,
      0x11cf,
      [0x81, 0x0c, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]
    ),
    CoInitializeEx: ofn("CoInitializeEx", "long", ["void *", "uint32"]),
    AccessibleObjectFromWindow: afn(
      "AccessibleObjectFromWindow",
      "long",
      ["void *", "uint32", "void *", "void *"]
    ),
    protoAccChildCount: koffi.proto(
      "long WeekToDoAccChildCount(void *self, void *countOut)"
    ),
    protoAccState: koffi.proto(
      "long WeekToDoAccState(void *self, void *varChild, void *stateOut)"
    ),
    protoAccSelect: koffi.proto(
      "long WeekToDoAccSelect(void *self, long flags, void *varChild)"
    ),
    protoComRelease: koffi.proto(
      "uint32 WeekToDoComRelease(void *self)"
    ),
    FindWindowW: fn("FindWindowW", "void *", ["str16", "str16"]),
    FindWindowExW: fn("FindWindowExW", "void *", ["void *", "void *", "str16", "str16"]),
    GetTopWindow: fn("GetTopWindow", "void *", ["void *"]),
    GetWindow: fn("GetWindow", "void *", ["void *", "uint32"]),
    GetParent: fn("GetParent", "void *", ["void *"]),
    SetParent: fn("SetParent", "void *", ["void *", "void *"]),
    SetFocus: fn("SetFocus", "void *", ["void *"]),
    SetForegroundWindow: fn("SetForegroundWindow", "int", ["void *"]),
    GetForegroundWindow: fn("GetForegroundWindow", "void *", []),
    GetWindowThreadProcessId: fn("GetWindowThreadProcessId", "uint32", [
      "void *",
      "void *",
    ]),
    AttachThreadInput: fn("AttachThreadInput", "int", [
      "uint32",
      "uint32",
      "int",
    ]),
    GetCurrentThreadId: kfn("GetCurrentThreadId", "uint32", []),
    GetWindowLongPtrW: fn(
      is64 ? "GetWindowLongPtrW" : "GetWindowLongW",
      is64 ? "intptr_t" : "long",
      ["void *", "int"]
    ),
    SetWindowLongPtrW: fn(
      is64 ? "SetWindowLongPtrW" : "SetWindowLongW",
      is64 ? "intptr_t" : "long",
      ["void *", "int", is64 ? "intptr_t" : "long"]
    ),
    SetWindowPos: fn("SetWindowPos", "int", [
      "void *",
      "void *",
      "int",
      "int",
      "int",
      "int",
      "uint32",
    ]),
    ShowWindow: fn("ShowWindow", "int", ["void *", "int"]),
    IsWindow: fn("IsWindow", "int", ["void *"]),
    IsWindowVisible: fn("IsWindowVisible", "int", ["void *"]),
    GetWindowRect: fn("GetWindowRect", "int", ["void *", "void *"]),
    GetClassNameW: fn("GetClassNameW", "int", ["void *", "void *", "int"]),
    GetSystemMetrics: fn("GetSystemMetrics", "int", ["int"]),
    GetCursorPos: fn("GetCursorPos", "int", ["void *"]),
    GetAsyncKeyState: fn("GetAsyncKeyState", "short", ["int"]),
    PrintWindow: fn("PrintWindow", "int", ["void *", "void *", "uint32"]),
    GetDC: fn("GetDC", "void *", ["void *"]),
    ReleaseDC: fn("ReleaseDC", "int", ["void *", "void *"]),
    CreateCompatibleDC: gfn("CreateCompatibleDC", "void *", ["void *"]),
    CreateCompatibleBitmap: gfn("CreateCompatibleBitmap", "void *", ["void *", "int", "int"]),
    SelectObject: gfn("SelectObject", "void *", ["void *", "void *"]),
    GetDIBits: gfn("GetDIBits", "int", [
      "void *",
      "void *",
      "uint32",
      "uint32",
      "void *",
      "void *",
      "uint32",
    ]),
    DeleteObject: gfn("DeleteObject", "int", ["void *"]),
    DeleteDC: gfn("DeleteDC", "int", ["void *"]),
    CreateRoundRectRgn: gfn("CreateRoundRectRgn", "void *", [
      "int",
      "int",
      "int",
      "int",
      "int",
      "int",
    ]),
    SetWindowRgn: fn("SetWindowRgn", "int", ["void *", "void *", "int"]),
    SendMessageTimeoutW: fn("SendMessageTimeoutW", "intptr_t", [
      "void *",
      "uint32",
      "uintptr_t",
      "intptr_t",
      "uint32",
      "uint32",
      "void *",
    ]),
  };

  return api;
}

function bufferToHwnd(buffer) {
  if (!buffer || !buffer.length) return 0;
  return buffer.length >= 8
    ? Number(buffer.readBigUInt64LE(0))
    : buffer.readUInt32LE(0);
}

function getRect(hwnd) {
  const a = loadApi();
  const buffer = Buffer.alloc(16);
  if (!a.GetWindowRect(hwnd, buffer)) return null;
  return {
    left: buffer.readInt32LE(0),
    top: buffer.readInt32LE(4),
    right: buffer.readInt32LE(8),
    bottom: buffer.readInt32LE(12),
  };
}

function getClassName(hwnd) {
  const a = loadApi();
  const buffer = Buffer.alloc(512);
  const length = a.GetClassNameW(hwnd, buffer, 256);
  if (!length) return "";
  return buffer.toString("utf16le", 0, length * 2);
}

function isUsableTarget(hwnd) {
  const a = loadApi();
  if (!hwnd || !a.IsWindow(hwnd) || !a.IsWindowVisible(hwnd)) return false;

  const rect = getRect(hwnd);
  if (!rect) return false;

  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const screenWidth = a.GetSystemMetrics(0);
  const screenHeight = a.GetSystemMetrics(1);

  // Reject the many tiny hidden WorkerW windows the shell keeps around.
  return width >= screenWidth * 0.5 && height >= screenHeight * 0.5;
}

/**
 * Find a real desktop-layer parent.
 *
 * Windows 10:
 *   top-level window with SHELLDLL_DefView -> following top-level WorkerW
 * Windows 11 24H2+ / 26002+:
 *   WorkerW child of Progman that does not contain SHELLDLL_DefView
 * Last resort:
 *   Progman itself (inserted below SHELLDLL_DefView)
 */
/**
 * Capture the desktop wallpaper area through PrintWindow(Progman).
 *
 * PrintWindow only renders the desktop window tree, so unrelated application
 * windows are not included. Call this while the widget is hidden; otherwise
 * the widget itself would be part of the capture.
 */
function captureDesktopRegion(bounds) {
  const a = loadApi();
  const progman = a.FindWindowW("Progman", null);
  if (!progman) return null;

  const desktopRect = getRect(progman);
  if (!desktopRect) return null;

  const fullWidth = desktopRect.right - desktopRect.left;
  const fullHeight = desktopRect.bottom - desktopRect.top;
  if (fullWidth <= 0 || fullHeight <= 0) return null;

  const left = Math.max(0, Math.round(bounds.x - desktopRect.left));
  const top = Math.max(0, Math.round(bounds.y - desktopRect.top));
  const right = Math.min(fullWidth, Math.round(bounds.x + bounds.width - desktopRect.left));
  const bottom = Math.min(fullHeight, Math.round(bounds.y + bounds.height - desktopRect.top));
  const cropWidth = right - left;
  const cropHeight = bottom - top;
  if (cropWidth <= 0 || cropHeight <= 0) return null;

  const screenDc = a.GetDC(progman);
  const memoryDc = a.CreateCompatibleDC(screenDc);
  const bitmap = a.CreateCompatibleBitmap(screenDc, fullWidth, fullHeight);
  const oldBitmap = a.SelectObject(memoryDc, bitmap);
  let result = null;

  try {
    if (!a.PrintWindow(progman, memoryDc, 2)) {
      return null;
    }

    const bmi = Buffer.alloc(40);
    bmi.writeUInt32LE(40, 0);
    bmi.writeInt32LE(fullWidth, 4);
    bmi.writeInt32LE(-fullHeight, 8);
    bmi.writeUInt16LE(1, 12);
    bmi.writeUInt16LE(32, 14);

    const full = Buffer.alloc(fullWidth * fullHeight * 4);
    const rows = a.GetDIBits(memoryDc, bitmap, 0, fullHeight, full, bmi, 0);
    if (rows !== fullHeight) return null;

    const cropped = Buffer.alloc(cropWidth * cropHeight * 4);
    for (let y = 0; y < cropHeight; y += 1) {
      const sourceStart = ((top + y) * fullWidth + left) * 4;
      full.copy(
        cropped,
        y * cropWidth * 4,
        sourceStart,
        sourceStart + cropWidth * 4
      );
    }

    result = { data: cropped, width: cropWidth, height: cropHeight };
  } finally {
    a.SelectObject(memoryDc, oldBitmap);
    a.DeleteObject(bitmap);
    a.DeleteDC(memoryDc);
    a.ReleaseDC(progman, screenDc);
  }

  return result;
}

function applyRoundedRegion(state, radius) {
  if (!state || !state.hwnd || !state.bounds) return;
  const a = loadApi();
  if (!a.IsWindow(state.hwnd)) return;

  const value = Math.max(0, Math.round(radius || 0));
  state.radius = value;

  if (!value) {
    a.SetWindowRgn(state.hwnd, null, 1);
    return;
  }

  const width = Math.max(1, state.bounds.width);
  const height = Math.max(1, state.bounds.height);
  const diameter = value * 2;
  const region = a.CreateRoundRectRgn(0, 0, width + 1, height + 1, diameter, diameter);
  if (!region) return;

  if (!a.SetWindowRgn(state.hwnd, region, 1)) {
    a.DeleteObject(region);
  }
}

function findDefView(progman) {
  const a = loadApi();

  // Windows 11 24H2+/26H2: SHELLDLL_DefView is a child of Progman.
  const direct = a.FindWindowExW(progman, null, "SHELLDLL_DefView", null);
  if (direct) return direct;

  // Windows 10: it lives under a top-level WorkerW.
  let top = a.GetTopWindow(null);
  while (top) {
    const defView = a.FindWindowExW(top, null, "SHELLDLL_DefView", null);
    if (defView) return defView;
    top = a.GetWindow(top, GW_HWNDNEXT);
  }

  return null;
}

/**
 * Find a desktop-layer parent.
 *
 * interactive=true is used by the WeekToDo widget: the window is attached to
 * the desktop's SHELLDLL_DefView above the icon list, so it can receive mouse
 * and keyboard input while still staying below normal windows.
 *
 * interactive=false is the classic wallpaper layer behind the icons. It is
 * display-only because SHELLDLL_DefView/SysListView32 receives the pointer.
 */
function findTarget(options = {}) {
  const interactive = options.interactive !== false;
  const a = loadApi();
  const progman = a.FindWindowW("Progman", null);
  if (!progman) return null;

  // Ask the shell to create its WorkerW pair. Some builds ignore this, which is
  // why the Progman fallback below matters.
  a.SendMessageTimeoutW(
    progman,
    0x052c,
    0xd,
    0x1,
    SMTO_NORMAL,
    1000,
    Buffer.alloc(8)
  );

  const defView = findDefView(progman);

  if (interactive) {
    if (defView && isUsableTarget(defView)) {
      return { target: defView, mode: "defview", defView };
    }
    if (isUsableTarget(progman)) {
      return { target: progman, mode: "progman-top", defView };
    }
    return null;
  }

  let top = a.GetTopWindow(null);
  while (top) {
    const topDefView = a.FindWindowExW(top, null, "SHELLDLL_DefView", null);
    if (topDefView) {
      let worker = a.FindWindowExW(null, top, "WorkerW", null);
      while (worker) {
        if (isUsableTarget(worker)) {
          return { target: worker, mode: "workerw-sibling", defView: topDefView };
        }
        worker = a.FindWindowExW(null, worker, "WorkerW", null);
      }
    }
    top = a.GetWindow(top, GW_HWNDNEXT);
  }

  let child = a.FindWindowExW(progman, null, "WorkerW", null);
  while (child) {
    const hasDefView = a.FindWindowExW(child, null, "SHELLDLL_DefView", null);
    if (!hasDefView && isUsableTarget(child)) {
      return {
        target: child,
        mode: "workerw-child",
        defView,
      };
    }
    child = a.FindWindowExW(progman, child, "WorkerW", null);
  }

  if (isUsableTarget(progman)) {
    return { target: progman, mode: "progman", defView };
  }

  return null;
}

function findChildByClass(parent, className) {
  const a = loadApi();
  const direct = a.FindWindowExW(parent, null, className, null);
  if (direct) return direct;

  let child = a.FindWindowExW(parent, null, null, null);
  while (child) {
    const found = findChildByClass(child, className);
    if (found) return found;
    child = a.FindWindowExW(parent, child, null, null);
  }
  return null;
}

/**
 * Clear the desktop icon selection through MSAA.
 *
 * The widget is a child of SHELLDLL_DefView, so clicking it does not clear the
 * icon selection made before the click. While an icon stays selected, Explorer
 * keeps handling some shell accelerators (notably Space) and opens the
 * shortcut's properties instead of letting our input receive the space.
 *
 * This uses IAccessible::accSelect(SELFLAG_REMOVESELECT), which is the safe,
 * cross-process way to drop the selection. It deliberately avoids
 * LVM_SETITEMSTATE: that message needs a pointer in Explorer's address space
 * and sending it naively restarts explorer.exe.
 */
function clearDesktopSelection() {
  if (process.platform !== "win32") return 0;
  const a = loadApi();

  if (!a.comInitialized) {
    a.comInitialized = true;
    try {
      a.CoInitializeEx(null, 2);
    } catch (error) {
      // MSAA also works from an already initialized MTA; keep going.
    }
  }

  let accessible = 0;
  try {
    const progman = a.FindWindowW("Progman", null);
    if (!progman) return 0;

    const defView = findDefView(progman);
    if (!defView) return 0;

    const listView = findChildByClass(defView, "SysListView32");
    if (!listView) return 0;

    const accessibleOut = Buffer.alloc(8);
    const hr = a.AccessibleObjectFromWindow(
      listView,
      0xfffffffc, // OBJID_CLIENT
      a.iidAccessible,
      accessibleOut
    );
    if (hr < 0) return 0;

    accessible = bufferToHwnd(accessibleOut);
    if (!accessible) return 0;

    const countOut = Buffer.alloc(4);
    const countHr = callCom(
      accessible,
      8, // IAccessible::get_accChildCount
      a.protoAccChildCount,
      countOut
    );
    if (countHr < 0) return 0;

    const count = countOut.readInt32LE(0);
    let removed = 0;

    for (let childId = 1; childId <= count; childId += 1) {
      const stateOut = Buffer.alloc(24);
      const stateHr = callCom(
        accessible,
        14, // IAccessible::get_accState
        a.protoAccState,
        createIntVariant(childId),
        stateOut
      );
      if (stateHr < 0) continue;
      if (stateOut.readUInt16LE(0) !== 3) continue; // VT_I4

      const state = stateOut.readInt32LE(8);
      if ((state & 0x2) === 0) continue; // STATE_SYSTEM_SELECTED

      const selectHr = callCom(
        accessible,
        21, // IAccessible::accSelect
        a.protoAccSelect,
        0x10, // SELFLAG_REMOVESELECT
        createIntVariant(childId)
      );
      if (selectHr >= 0) removed += 1;
    }

    return removed;
  } catch (error) {
    return 0;
  } finally {
    if (accessible) {
      try {
        callCom(accessible, 2, a.protoComRelease);
      } catch (error) {
        // Releasing is best-effort.
      }
    }
  }
}

function restoreWindowStyle(state) {  const a = loadApi();
  a.SetWindowLongPtrW(state.hwnd, GWL_STYLE, state.saved.style);
  a.SetWindowLongPtrW(state.hwnd, GWL_EXSTYLE, state.saved.exStyle);
}

function attachWindow(win, bounds, options = {}) {
  const a = loadApi();
  if (!win || win.isDestroyed()) throw new Error("BrowserWindow is not available");

  const hwnd = bufferToHwnd(win.getNativeWindowHandle());
  if (!hwnd || !a.IsWindow(hwnd)) {
    throw new Error("Could not obtain a valid native window handle");
  }

  const interactive = options.interactive !== false;
  const targetInfo = findTarget({ interactive });
  if (!targetInfo) {
    throw new Error("No usable desktop layer was found");
  }

  const saved = {
    style: toNumber(a.GetWindowLongPtrW(hwnd, GWL_STYLE)),
    exStyle: toNumber(a.GetWindowLongPtrW(hwnd, GWL_EXSTYLE)),
    parent: toNumber(a.GetParent(hwnd)),
  };

  let style = saved.style;
  style &= ~(
    WS_POPUP |
    WS_CAPTION |
    WS_THICKFRAME |
    WS_SYSMENU |
    WS_MINIMIZEBOX |
    WS_MAXIMIZEBOX
  );
  style |= WS_CHILD | WS_CLIPSIBLINGS;

  let exStyle = saved.exStyle;
  exStyle &= ~WS_EX_APPWINDOW;
  exStyle |= WS_EX_TOOLWINDOW;

  a.SetWindowLongPtrW(hwnd, GWL_STYLE, style);
  a.SetWindowLongPtrW(hwnd, GWL_EXSTYLE, exStyle);

  const target = toNumber(targetInfo.target);
  a.SetParent(hwnd, target);

  if (toNumber(a.GetParent(hwnd)) !== target) {
    restoreWindowStyle({ hwnd, saved });
    throw new Error(
      `SetParent did not attach the window (target 0x${target.toString(16)}, ` +
        `parent 0x${toNumber(a.GetParent(hwnd)).toString(16)})`
    );
  }

  const state = {
    hwnd,
    target,
    targetMode: targetInfo.mode,
    saved,
    interactive,
    radius: options.radius || 0,
    bounds: { x: 0, y: 0, width: 1, height: 1 },
    screenBounds: { x: 0, y: 0, width: 1, height: 1 },
  };

  a.ShowWindow(hwnd, SW_SHOWNOACTIVATE);
  setWindowScreenBounds(state, bounds);
  return state;
}

function setWindowScreenBounds(state, bounds) {
  if (!state || !state.hwnd) return;
  const a = loadApi();
  if (!a.IsWindow(state.hwnd)) return;

  const parentRect = getRect(state.target) || { left: 0, top: 0 };
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const screenX = Math.round(bounds.x);
  const screenY = Math.round(bounds.y);
  const x = screenX - parentRect.left;
  const y = screenY - parentRect.top;
  const sizeChanged = state.bounds.width !== width || state.bounds.height !== height;

  state.bounds = { x, y, width, height };
  state.screenBounds = { x: screenX, y: screenY, width, height };

  a.SetWindowPos(
    state.hwnd,
    state.targetMode === "progman" ? HWND_BOTTOM : null,
    x,
    y,
    width,
    height,
    SWP_NOACTIVATE | SWP_SHOWWINDOW | SWP_FRAMECHANGED
  );
  if (sizeChanged) applyRoundedRegion(state, state.radius);
}

function getWindowScreenRect(target) {
  const hwnd = typeof target === "object" ? target && target.hwnd : target;
  if (!hwnd) return null;
  const rect = getRect(hwnd);
  if (!rect) return null;
  return {
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  };
}

function getCursorPosition() {
  const a = loadApi();
  const buffer = Buffer.alloc(8);
  if (!a.GetCursorPos(buffer)) return null;
  return { x: buffer.readInt32LE(0), y: buffer.readInt32LE(4) };
}

function isLeftButtonDown() {
  const a = loadApi();
  return (a.GetAsyncKeyState(0x01) & 0x8000) !== 0;
}

function setWindowBounds(state, bounds) {
  setWindowScreenBounds(state, bounds);
}

/**
 * Give keyboard focus to the embedded widget.
 *
 * A child of SHELLDLL_DefView does not become the foreground window when it is
 * clicked. Mouse events still arrive, but Windows sends keystrokes to Progman.
 * Calling SetFocus from the main process after the click fixes keyboard input
 * without turning the widget into a top-level/always-on-top window.
 */
function focusWindow(state) {
  if (!state || !state.hwnd) return false;
  const a = loadApi();
  if (!a.IsWindow(state.hwnd)) return false;

  const currentThread = a.GetCurrentThreadId();
  const foreground = a.GetForegroundWindow();
  const foregroundThread = foreground
    ? a.GetWindowThreadProcessId(foreground, null)
    : 0;
  const targetThread = a.GetWindowThreadProcessId(state.hwnd, null);
  let attachedForeground = false;
  let attachedTarget = false;

  try {
    // A child of the desktop does not reliably take keyboard focus from the
    // Explorer thread. Attach the input queues just long enough to move focus
    // to the widget, then detach again.
    if (foregroundThread && foregroundThread !== currentThread) {
      attachedForeground = !!a.AttachThreadInput(
        currentThread,
        foregroundThread,
        1
      );
    }
    if (
      targetThread &&
      targetThread !== currentThread &&
      targetThread !== foregroundThread
    ) {
      attachedTarget = !!a.AttachThreadInput(currentThread, targetThread, 1);
    }

    a.SetForegroundWindow(state.hwnd);
    a.SetFocus(state.hwnd);
  } finally {
    if (attachedForeground) {
      a.AttachThreadInput(currentThread, foregroundThread, 0);
    }
    if (attachedTarget) {
      a.AttachThreadInput(currentThread, targetThread, 0);
    }
  }

  return true;
}

function detachWindow(state, options = {}) {
  if (!state || !state.hwnd) return;
  const a = loadApi();
  if (!a.IsWindow(state.hwnd)) return;

  if (!options.keepRegion) a.SetWindowRgn(state.hwnd, null, 1);
  restoreWindowStyle(state);

  // The saved BrowserWindow style can still carry frame bits. A detached
  // widget must stay frameless and out of Alt+Tab while it is a normal
  // top-level window for IME text editing.
  const topLevelStyle =
    (toNumber(a.GetWindowLongPtrW(state.hwnd, GWL_STYLE)) &
      ~(
        WS_CAPTION |
        WS_THICKFRAME |
        WS_SYSMENU |
        WS_MINIMIZEBOX |
        WS_MAXIMIZEBOX
      )) |
    WS_POPUP |
    WS_CLIPSIBLINGS;
  a.SetWindowLongPtrW(state.hwnd, GWL_STYLE, topLevelStyle);

  const exStyle = toNumber(a.GetWindowLongPtrW(state.hwnd, GWL_EXSTYLE));
  a.SetWindowLongPtrW(
    state.hwnd,
    GWL_EXSTYLE,
    (exStyle & ~WS_EX_APPWINDOW) | WS_EX_TOOLWINDOW
  );

  a.SetParent(state.hwnd, state.saved.parent || null);

  const bounds = options.screenBounds || state.screenBounds;
  a.SetWindowPos(
    state.hwnd,
    null,
    bounds ? Math.round(bounds.x) : 0,
    bounds ? Math.round(bounds.y) : 0,
    bounds ? Math.round(bounds.width) : 0,
    bounds ? Math.round(bounds.height) : 0,
    SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW
  );
  a.ShowWindow(state.hwnd, SW_SHOW);
}

/**
 * Re-attach after Explorer restarts or the desktop layer is replaced.
 * If the native window itself was destroyed, call onLost so the caller can
 * recreate the BrowserWindow instead of touching a stale HWND.
 */
function watch(win, state, callbacks = {}) {
  const a = loadApi();
  let current = state;
  let stopped = false;

  const timer = setInterval(() => {
    if (stopped) return;

    if (!win || win.isDestroyed() || !a.IsWindow(current.hwnd)) {
      stopped = true;
      clearInterval(timer);
      if (callbacks.onLost) callbacks.onLost();
      return;
    }

    const parent = toNumber(a.GetParent(current.hwnd));
    if (a.IsWindow(current.target) && parent === current.target) {
      // Explorer can raise SysListView32 above our child after a desktop
      // refresh. Keep the widget on top inside DefView/Progman without ever
      // making it a top-level or always-on-top window.
      if (current.targetMode === "defview" || current.targetMode === "progman-top") {
        if (a.GetWindow(current.hwnd, GW_HWNDPREV)) {
          const b = current.bounds;
          a.SetWindowPos(
            current.hwnd,
            null,
            b.x,
            b.y,
            b.width,
            b.height,
            SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOSIZE
          );
        }
      }
      return;
    }

    try {
      const targetInfo = findTarget({ interactive: current.interactive !== false });
      if (!targetInfo) return;

      const target = toNumber(targetInfo.target);
      a.SetParent(current.hwnd, target);
      if (toNumber(a.GetParent(current.hwnd)) !== target) return;

      current.target = target;
      current.targetMode = targetInfo.mode;
      setWindowScreenBounds(current, current.screenBounds || current.bounds);
      applyRoundedRegion(current, current.radius);

      if (callbacks.onState) callbacks.onState(current);
    } catch (error) {
      if (callbacks.onError) callbacks.onError(error);
    }
  }, 1500);

  if (timer.unref) timer.unref();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

function describeTarget(hwnd) {
  if (!hwnd) return "none";
  return `0x${toNumber(hwnd).toString(16)} (${getClassName(hwnd)})`;
}

module.exports = {
  isSupported: () => process.platform === "win32",
  attachWindow,
  detachWindow,
  focusWindow,
  clearDesktopSelection,
  setWindowBounds,
  setWindowScreenBounds,
  getWindowScreenRect,
  getCursorPosition,
  isLeftButtonDown,
  captureDesktopRegion,
  watch,
  findTarget,
  bufferToHwnd,
  describeTarget,
};
