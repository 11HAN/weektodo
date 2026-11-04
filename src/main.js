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
import { IS_DESKTOP_MODE, applyDesktopConfig } from "./helpers/desktopMode";

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

if (IS_DESKTOP_MODE && typeof require !== "undefined") {
  try {
    const { ipcRenderer } = require("electron");
    window.addEventListener(
      "mousedown",
      () => {
        ipcRenderer.send("desktop-widget-focus");
      },
      true
    );
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
