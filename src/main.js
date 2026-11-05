import { createApp } from "vue";
import App from "./App.vue";
import { store } from "./store/store";
import * as Sentry from "@sentry/vue";

import { createI18n } from "vue-i18n";
import { languages } from "./assets/languages/languages.js";
const messages = Object.assign(languages);
const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages,
});

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import "bootstrap-icons/font/bootstrap-icons.css";

import "./assets/style/globalVars.scss";
import "./assets/style/main.scss";
import "./assets/style/uiComponents.scss";

import { onDesktopSync } from "./helpers/desktopSync";
import { IS_DESKTOP_MODE, IS_DESKTOP_SETTINGS_WINDOW, applyDesktopConfig } from "./helpers/desktopMode";

Sentry.init({
  dsn: process.env.VUE_APP_SENTRY_DNS,
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    })
    // Sentry.replayIntegration({
    //   maskAllText: true,
    //   blockAllMedia: true,
    // }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

const app = createApp(App);

app.use(store);
app.use(i18n);

function applySyncedConfig(config) {
  if (!config) return;
  store.commit("loadConfig", config);
  if (config.language) i18n.locale = config.language;
  if (IS_DESKTOP_MODE) applyDesktopConfig(store);
}

onDesktopSync((message) => {
  if (message.type === "todo-list" && message.id) {
    store.dispatch("loadTodoLists", message.id);
    return;
  }

  if (message.type === "config") {
    applySyncedConfig(message.config);
    return;
  }

  if (message.type === "all") {
    store.dispatch("loadAllRepeatingEvent").then(() => {
      const selectedDates = store.getters.selectedDates || [];
      selectedDates.forEach((date) => store.dispatch("loadTodoLists", date));
    });
  }
});

if (typeof require !== "undefined") {
  try {
    const { ipcRenderer } = require("electron");
    ipcRenderer.on("desktop-config-changed", (_event, config) => {
      applySyncedConfig(config);
    });
  } catch (error) {
    // Plain browser builds do not have an Electron renderer.
  }
}

if (IS_DESKTOP_MODE && !IS_DESKTOP_SETTINGS_WINDOW && typeof require !== "undefined") {
  try {
    const { ipcRenderer } = require("electron");

    const TEXT_INPUT_SELECTOR = [
      "textarea",
      '[contenteditable="true"]',
      "input:not([type])",
      'input[type="text"]',
      'input[type="search"]',
      'input[type="email"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input[type="password"]',
      'input[type="number"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="datetime-local"]',
      'input[type="month"]',
      'input[type="week"]',
    ].join(", ");

    const TEXT_LAUNCHER_SELECTOR = ".fake-drop-zone, .new-todo-row, .fake-lines";
    const TEXT_EDIT_DBLCLICK_SELECTOR =
      ".inline-todo-item, #todo-item-active, .item-text, .todo-title, .description-empty, .todo-description, .sub-task";

    let textEditing = false;
    let textEditEndTimer = null;
    let textEditFocusTimer = null;
    let textEditStartedAt = 0;
    let textEditTransitioning = false;
    let textEditTransitionTimer = null;

    const isTextInput = (target) =>
      !!(target && target.closest && target.closest(TEXT_INPUT_SELECTOR));

    const isTextLauncher = (target) =>
      !!(target && target.closest && target.closest(TEXT_LAUNCHER_SELECTOR));

    const isTextEditTarget = (target) =>
      !!(
        target &&
        target.closest &&
        target.closest(TEXT_EDIT_DBLCLICK_SELECTOR)
      );

    const beginTextEdit = () => {
      if (textEditing) return;
      textEditing = true;
      textEditStartedAt = Date.now();
      textEditTransitioning = true;
      clearTimeout(textEditTransitionTimer);
      textEditTransitionTimer = setTimeout(() => {
        textEditTransitioning = false;
      }, 450);
      clearTimeout(textEditFocusTimer);
      textEditFocusTimer = setTimeout(() => {
        // A double-click on a task may not actually open an editor (for
        // example when it is treated as a single click). Do not leave the
        // widget floating above the desktop in that case.
        if (!isTextInput(document.activeElement)) endTextEdit();
      }, 700);
      ipcRenderer.send("desktop-widget-text-edit-start");
    };

    const endTextEdit = () => {
      if (!textEditing) return;
      textEditing = false;
      textEditTransitioning = false;
      clearTimeout(textEditFocusTimer);
      ipcRenderer.send("desktop-widget-text-edit-end");
    };

    const scheduleTextEditEnd = () => {
      clearTimeout(textEditEndTimer);
      textEditEndTimer = setTimeout(() => {
        if (isTextInput(document.activeElement)) return;
        endTextEdit();
      }, 120);
    };

    // Reparenting the native window can blur the focused input for one frame.
    // Keep that transient blur away from the components (which would commit or
    // close the editor) and restore focus once the window is top-level.
    const keepInputFocusDuringTransition = (event) => {
      if (!textEditTransitioning || !isTextInput(event.target)) return false;
      event.stopImmediatePropagation();
      event.preventDefault();
      const input = event.target;
      const refocus = () => {
        if (!textEditing || !input.isConnected) return;
        const active = document.activeElement;
        if (active && active !== input && active !== document.body) return;
        if (typeof input.focus === "function") input.focus({ preventScroll: true });
        if (typeof input.setSelectionRange === "function") {
          const end = input.value ? input.value.length : 0;
          try {
            input.setSelectionRange(end, end);
          } catch (error) {
            // Some input types do not support selection ranges.
          }
        }
      };
      setTimeout(refocus, 30);
      setTimeout(refocus, 130);
      setTimeout(refocus, 280);
      return true;
    };

    window.addEventListener(
      "mousedown",
      (event) => {
        if (
          event.button === 0 &&
          (isTextInput(event.target) ||
            isTextLauncher(event.target) ||
            (event.detail >= 2 && isTextEditTarget(event.target)))
        ) {
          beginTextEdit();
        }
        ipcRenderer.send("desktop-widget-focus");
      },
      true
    );

    window.addEventListener(
      "focusin",
      (event) => {
        if (isTextInput(event.target)) {
          clearTimeout(textEditFocusTimer);
          beginTextEdit();
        }
      },
      true
    );

    window.addEventListener(
      "focusout",
      (event) => {
        if (keepInputFocusDuringTransition(event)) return;
        if (isTextInput(event.target)) scheduleTextEditEnd();
      },
      true
    );

    window.addEventListener(
      "blur",
      (event) => {
        if (keepInputFocusDuringTransition(event)) return;
      },
      true
    );

    window.addEventListener("blur", () => {
      clearTimeout(textEditEndTimer);
      textEditEndTimer = setTimeout(() => {
        // The detach itself can briefly blur the window; ignore that.
        if (Date.now() - textEditStartedAt < 500) return;
        if (!document.hasFocus()) endTextEdit();
        else scheduleTextEditEnd();
      }, 150);
    });
  } catch (error) {
    console.warn("Desktop keyboard focus bridge is unavailable", error);
  }
}

window.addEventListener("storage", (event) => {
  if (!event.newValue) return;

  try {
    if (event.key === "config") {
      applySyncedConfig(JSON.parse(event.newValue));
    } else if (event.key === "customTodoListIds") {
      store.commit("loadCustomTodoListsIds", JSON.parse(event.newValue));
    }
  } catch (error) {
    console.warn("Could not sync localStorage change", error);
  }
});

app.mount("#app");
