<template>
  <svg
    v-if="desktopMode && !isDesktopSettingsWindow"
    ref="liquidGlassDefs"
    class="liquid-glass-defs"
    width="0"
    height="0"
    aria-hidden="true"
  >
    <defs></defs>
  </svg>
  <input class="hidden-input-for-focus" type="text" />
  <div
    v-if="desktopMode && !isDesktopSettingsWindow"
    class="desktop-window-base"
    :style="desktopWindowBaseStyle"
  ></div>
  <div
    v-show="compatible"
    id="app-container"
    class="app-container"
    :class="{
      'dark-theme': darkTheme,
      'desktop-mode': desktopMode,
      'desktop-settings-window': isDesktopSettingsWindow,
      'desktop-glass': desktopMode && !isDesktopSettingsWindow && desktopThemeDefinition.liquidGlass,
      'desktop-glass-clear': desktopMode && !isDesktopSettingsWindow && desktopThemeDefinition.liquidGlass && !desktopThemeDefinition.dark && !desktopThemeDefinition.glassTint,
      'desktop-glass-ready': desktopMode && !isDesktopSettingsWindow && desktopThemeDefinition.liquidGlass && liquidGlassReady,
      'desktop-texture': desktopMode && desktopThemeDefinition.texture,
      'desktop-modal-open': desktopModalOpen && !isDesktopSettingsWindow,
    }"
    :style="appContainerStyle"
    @mousedown="handleDesktopPointerDown"
    @mousemove="handleDesktopPointerMove"
    @mouseleave="clearDesktopResizeCursor"
  >
    <div
      v-if="desktopMode && !isDesktopSettingsWindow"
      class="desktop-backdrop"
      :style="{ backgroundImage: desktopBackdrop ? `url(${desktopBackdrop})` : 'none' }"
    ></div>
    <div v-if="desktopMode && !isDesktopSettingsWindow" class="desktop-tint"></div>
    <div v-if="desktopMode && !isDesktopSettingsWindow" class="desktop-glow"></div>

    <div class="hidden-mobile app-body" :style="{ zoom: isDesktopSettingsWindow ? '100%' : `${zoom}%` }">
      <div
        v-if="desktopMode && !isDesktopSettingsWindow"
        class="desktop-widget-header"
        :class="{ 'is-locked': desktopLocked, 'is-dragging': desktopDragging }"
        @mousedown="startDesktopDrag"
      >
        <i class="bi-arrows-move desktop-drag-grip"></i>
        <div class="desktop-widget-title">WeekToDo</div>
        <div class="desktop-week-nav">
          <button
            type="button"
            class="desktop-week-arrow"
            title="Previous week"
            @click.stop="desktopWeekMove(-1)"
          >
            <i class="bi-chevron-left"></i>
          </button>
          <div class="desktop-widget-range">{{ desktopRangeLabel }}</div>
          <button
            type="button"
            class="desktop-week-arrow"
            title="Next week"
            @click.stop="desktopWeekMove(1)"
          >
            <i class="bi-chevron-right"></i>
          </button>
        </div>
        <div class="desktop-widget-actions">
          <button
            type="button"
            class="desktop-widget-theme-toggle"
            title="This week"
            @click.stop="goToToday"
          >
            <i class="bi-house"></i>
          </button>
          <button
            type="button"
            class="desktop-widget-theme-toggle"
            :title="desktopLocked ? $t('ui.desktopUnlock') : $t('ui.desktopLock')"
            @click.stop="toggleDesktopLock"
          >
            <i :class="desktopLocked ? 'bi-lock-fill' : 'bi-unlock'"></i>
          </button>
          <button
            type="button"
            class="desktop-widget-theme-toggle"
            :title="$t('settings.settings')"
            @click.stop="requestDesktopSettings"
          >
            <i class="bi-gear"></i>
          </button>
        </div>
      </div>

      <splash-screen v-if="!desktopMode" ref="splash"></splash-screen>
      <side-bar v-if="!desktopMode" @change-date="setSelectedDate"></side-bar>

      <div v-if="!isDesktopSettingsWindow" class="h-100 d-flex flex-column">
        <div
          v-show="showCalendar"
          class="todo-lists-container"
          :style="resizableStyle"
          ref="calendarContainer"
          :class="{
            'full-screen': !showCustomList,
            'hidden-lists-container': hideTopListContainer,
            'full-screen-divider': hideBottomListContainer,
          }"
        >
          <i
            v-if="!desktopMode"
            class="bi-chevron-left slider-btn"
            ref="weekLeft"
            @click="weekMoveLeft"
          ></i>
          <div class="todo-slider weekdays" ref="weekListContainer">
            <to-do-list
              v-for="date in dates_array"
              :key="date"
              :id="date"
              :showCustomList="showCustomList"
              @todo-list-mounted="todoListMounted"
            >
            </to-do-list>
          </div>
          <i
            v-if="!desktopMode"
            class="bi-chevron-right slider-btn"
            ref="weekRight"
            @click="weekMoveRight"
          ></i>
        </div>

        <div
          v-show="showCustomList && showCalendar"
          class="main-horizontal-divider"
          id="resizer"
          :class="mainDividerPositionClass"
          @mousedown="resizerMouseDownHandler"
          @dblclick="resizerDblClick"
        >
          <div class="inner-main-horizontal-divider"></div>
          <div class="divider-icons-container">
            <i
              class="bi-chevron-up move-to-center-up divider-icons"
              @click="setDividerPosition(1)"
              :title="$t('ui.restorePanel')"
            ></i>
            <i
              class="bi-chevron-up move-to-corner-up divider-icons"
              @click="setDividerPosition(2)"
              :title="$t('ui.maximizeListPanel')"
            ></i>
            <i
              class="bi-chevron-down move-to-center-down divider-icons"
              @click="setDividerPosition(1)"
              :title="$t('ui.restorePanel')"
            ></i>
            <i
              class="bi-chevron-down move-to-corner-down divider-icons"
              @click="setDividerPosition(0)"
              :title="$t('ui.maximizeCalendarPanel')"
            ></i>
          </div>
        </div>

        <div
          v-show="showCustomList"
          class="todo-lists-container"
          :class="{
            'full-screen': !showCalendar,
            'flex-grow-1': showCalendar,
            'hidden-lists-container': hideBottomListContainer,
          }"
        >
          <i
            class="bi-chevron-left slider-btn"
            @click="customMoveLeft"
            :style="{
              visibility: cTodoList.length > customColumns ? 'visible' : 'hidden',
            }"
          ></i>
          <div class="todo-slider slides" ref="customListContainer">
            <to-do-list
              v-for="(cTodoList, index) in cTodoList"
              :key="cTodoList.listId"
              :id="cTodoList.listId"
              :customTodoList="true"
              :cTodoListIndex="index"
              :showCustomList="showCustomList"
              @todo-list-mounted="todoListMounted"
            ></to-do-list>
          </div>
          <i
            class="bi-chevron-right slider-btn"
            @click="customMoveRight"
            :style="{
              visibility: cTodoList.length > customColumns ? 'visible' : 'hidden',
            }"
          ></i>
        </div>

        <div v-show="!showCustomList && !showCalendar" style="margin: auto">
          <img v-if="darkTheme" src="img/WeekToDoDarkLogo.webp" />
          <img v-else src="img/WeekToDoLightLogo.webp" />
        </div>
      </div>

      <remove-custom-list></remove-custom-list>
      <config-modal @change-columns="weekResetScroll" :configProp="$store.getters.config"></config-modal>
      <clear-data-modal></clear-data-modal>
      <clear-list-modal></clear-list-modal>
      <about-modal></about-modal>
      <donate-modal></donate-modal>
      <welcome-modal></welcome-modal>
      <tips-modal></tips-modal>
      <to-do-modal :selectedTodo="selectedTodo"></to-do-modal>
      <active-to-do :activeTodo="activeTodo"> </active-to-do>
      <recurrent-events-modal></recurrent-events-modal>
      <importing-modal :id="'importingModal'" :text="$t('settings.importing')"></importing-modal>
      <importing-modal :id="'exportingModal'" :text="$t('settings.exporting')"></importing-modal>

      <reorder-custom-lists-modal @reset-custom-list="resetCustomList"></reorder-custom-lists-modal>

      <div
        v-if="desktopMode && desktopModalOpen && !isDesktopSettingsWindow"
        class="desktop-modal-overlay"
        @click="closeDesktopModal"
      ></div>
    </div>

    <div v-if="desktopMode && !desktopLocked && !isDesktopSettingsWindow" class="desktop-resize-layer">
      <div
        v-for="direction in desktopResizeDirections"
        :key="direction"
        :class="['desktop-resize-handle', 'resize-' + direction]"
        :title="$t('ui.desktopResize')"
        @mousedown.stop.prevent="startDesktopResize(direction)"
      ></div>
    </div>

    <div v-if="!desktopMode" class="mobile d-flex flex-column justify-content-center align-items-center">
      <i class="bi-exclamation-diamond mb-4" style="font-size: 100px"></i>
      <h3 style="text-align: center">{{ $t("ui.mobileWarning") }}</h3>
    </div>

    <div v-if="!desktopMode" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1056">
      <toast-message
        id="versionChanges"
        :text="$t('ui.softwareUpdated')"
        :sub-text="$t('ui.seeChanges')"
        @subTextClick="seeChangeLog"
      ></toast-message>

      <toast-message
        id="newVersionAvailable"
        :text="$t('ui.newVersionAvailable')"
        :sub-text="$t('ui.download')"
        @subTextClick="downloadNewVersion"
      ></toast-message>

      <toast-message id="copiedAddress" :text="$t('donate.copiedAddres')"></toast-message>
    </div>
  </div>
  <div v-if="!compatible" class="compatible d-flex flex-column justify-content-center align-items-center p-5">
    <i class="bi-exclamation-diamond mb-4" style="font-size: 100px"></i>
    <h3 style="text-align: center">{{ $t("ui.compatible") }}</h3>
  </div>
</template>

<script>
import toDoList from "./components/toDoList";
import moment from "moment";
import sideBar from "./components/layout/sideBar";
import customToDoListIdsRepository from "./repositories/customToDoListIdsRepository";
import removeCustomList from "./components/comfirmModals/removeCustomList";
import configModal from "./views/configModal";
import splashScreen from "./components/splashScreen";
import configRepository from "./repositories/configRepository";
import aboutModal from "./views/aboutModal";
import donateModal from "./views/donateModal";
import welcomeModal from "./views/welcomeModal";
import toDoModal from "./views/toDoModal/toDoModal";
import tipsModal from "./views/tipsModal";
import { Modal, Toast } from "bootstrap";
import migrations from "./migrations/migrations";
import version_json from "../public/version.json";
import isElectron from "is-electron";
import taskHelper from "./helpers/tasksHelper";
import notifications from "./helpers/notifications";
import clearDataModal from "./components/comfirmModals/clearDataModal.vue";
import clearListModal from "./components/comfirmModals/clearListModal.vue";
import importingModal from "./views/importingModal.vue";
import RecurrentEventsModal from "./views/RecurrentEventsModal.vue";
import repeatingEventRepository from "./repositories/repeatingEventRepository";
import toDoListRepository from "./repositories/toDoListRepository";
import ReorderCustomListsModal from "./views/ReorderCustomListsModal.vue";
import toastMessage from "./components/toastMessage";
import activeToDo from "./components/activeToDo.vue";
import tasksHelper from "./helpers/tasksHelper";
import {
  IS_DESKTOP_MODE,
  IS_DESKTOP_SETTINGS_WINDOW,
  applyDesktopConfig,
} from "./helpers/desktopMode";
import { getDesktopTheme, rgba } from "./helpers/desktopThemes";
import {
  buildLiquidGlassFilters,
  isLiquidGlassSupported,
} from "./helpers/liquidGlass";

export default {
  name: "App",
  components: {
    donateModal,
    configModal,
    toDoList,
    sideBar,
    removeCustomList,
    splashScreen,
    aboutModal,
    welcomeModal,
    tipsModal,
    toDoModal,
    clearDataModal,
    RecurrentEventsModal,
    importingModal,
    ReorderCustomListsModal,
    clearListModal,
    toastMessage,
    activeToDo,
  },
  data() {
    return {
      selected_date: null,
      cTodoList: this.$store.getters.cTodoListIds,
      calendarHeight: "calc(50% - 50px)",
      ipcRenderer: null,
      initialLoadCompleted: false,
      initialListToLoad: 0,
      initialListLoaded: 0,
      desktopMode: IS_DESKTOP_MODE,
      isDesktopSettingsWindow: IS_DESKTOP_SETTINGS_WINDOW,
      desktopBackdrop: null,
      desktopDragging: false,
      desktopResizing: false,
      desktopModalOpen: false,
      desktopResizeDirections: ["s", "e", "w", "sw", "se"],
      liquidGlassFrame: null,
      liquidGlassTimer: null,
      liquidGlassReady: false,
    };
  },
  beforeCreate() {
    let config = configRepository.load();
    if (!IS_DESKTOP_MODE && version_json.version != config.version) {
      migrations.migrate();
    }

    if (!IS_DESKTOP_MODE && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    this.$store.commit("loadCustomTodoListsIds", customToDoListIdsRepository.load());
    this.$store.commit("loadConfig", configRepository.load());
    if (IS_DESKTOP_MODE) {
      applyDesktopConfig(this.$store);
    }
    this.$i18n.locale = this.$store.getters.config.language;

    this.$store.dispatch("loadAllRepeatingEvent").then(
      function () {
        let totalDaysCount =
          parseInt(this.$store.getters.config.columns) + (IS_DESKTOP_MODE ? 0 : 2);
        let totalCustomListCount = IS_DESKTOP_MODE
          ? 0
          : this.$store.getters.cTodoListIds.length;
        this.initialListToLoad = totalDaysCount + totalCustomListCount;
        if (!IS_DESKTOP_MODE) {
          this.deleteOldRepeatingEvents();
        }
        this.selected_date = IS_DESKTOP_MODE
          ? this.weekStartMoment(moment()).format("YYYYMMDD")
          : moment().format("YYYYMMDD");
        this.$nextTick(() => {
          this.weekResetScroll();
        });
        this.$store.commit("loadRepeatingEventDateCache", this.$store.getters.repeatingEventList);
      }.bind(this)
    );
  },
  mounted() {
    if (this.isDesktopSettingsWindow) {
      document.body.classList.add("desktop-settings-body");
    }
    if (this.desktopMode) {
      applyDesktopConfig(this.$store);
      this.selected_date = this.weekStartMoment(moment()).format("YYYYMMDD");
      this.$nextTick(() => {
        this.weekResetScroll();
      });
    }

    if (this.$refs.weekListContainer) {
      this.$refs.weekListContainer.scrollLeft = this.desktopMode ? 0 : this.todoListWidth();
    }
    this.calendarHeight = this.$store.getters.config.calendarHeight;
    window.addEventListener("resize", this.weekResetScroll);
    document.onreadystatechange = () => {
      if (document.readyState == "complete") {
        setTimeout(this.hideSplash, 4500);
      }
    };

    if (isElectron()) {
      const { ipcRenderer } = require("electron");
      this.ipcRenderer = ipcRenderer;
      if (this.desktopMode) {
        ipcRenderer.removeAllListeners("desktop-backdrop");
        ipcRenderer.on("desktop-backdrop", (_event, dataUrl) => {
          if (dataUrl) this.desktopBackdrop = dataUrl;
        });
        ipcRenderer.removeAllListeners("desktop-widget-move-ended");
        ipcRenderer.on("desktop-widget-move-ended", () => {
          this.desktopDragging = false;
          this.desktopResizing = false;
          this.scheduleLiquidGlassUpdate();
        });
        window.addEventListener("mouseup", this.endDesktopMove);
        document.addEventListener("show.bs.modal", this.handleDesktopModalShown);
        document.addEventListener("hidden.bs.modal", this.handleDesktopModalHidden);
        ipcRenderer.send("desktop-backdrop-request");
      }
      if (!this.desktopMode && this.$store.getters.config.firstTimeOpen) {
        this.ipcRenderer.send("show-current-window");
      }
      // The desktop widget and its settings window never create the legacy main
      // window, so they must reconcile the login item themselves.
      this.ipcRenderer.send("match-open-on-startup", this.$store.getters.config.openOnStartup);
    }

    if (!this.desktopMode && this.$store.getters.config.importing) {
      this.$store.commit("updateConfig", { val: false, key: "importing" });
      configRepository.update(this.$store.getters.config);
      if (isElectron()) {
        this.syncElectronConfig();
      }
    }

    if (IS_DESKTOP_SETTINGS_WINDOW) {
      this.$nextTick(() => {
        this.openDesktopSettings();
        const closeIcon = document.querySelector("#configModal .close-modal");
        if (closeIcon) {
          this.settingsCloseIcon = closeIcon;
          closeIcon.addEventListener("click", this.closeSettingsWindow);
        }
        this.settingsKeydownHandler = (event) => {
          const openModals = document.querySelectorAll(".modal.show");
          if (
            event.key === "Escape" &&
            openModals.length === 1 &&
            openModals[0].id === "configModal"
          ) {
            this.closeSettingsWindow();
          }
        };
        document.addEventListener("keydown", this.settingsKeydownHandler);
      });
    }

    this.resetAppOnDayChange();
    this.$nextTick(() => this.scheduleLiquidGlassUpdate());
  },
  beforeUnmount() {
    if (this.liquidGlassFrame) {
      cancelAnimationFrame(this.liquidGlassFrame);
      this.liquidGlassFrame = null;
    }
    if (this.liquidGlassTimer) {
      clearTimeout(this.liquidGlassTimer);
      this.liquidGlassTimer = null;
    }
    document.body.classList.remove("desktop-settings-body");
    document.removeEventListener("show.bs.modal", this.handleDesktopModalShown);
    document.removeEventListener("hidden.bs.modal", this.handleDesktopModalHidden);
    if (this.settingsKeydownHandler) {
      document.removeEventListener("keydown", this.settingsKeydownHandler);
    }
    if (this.settingsCloseIcon) {
      this.settingsCloseIcon.removeEventListener("click", this.closeSettingsWindow);
    }
  },
  methods: {
    weekMoveLeft: function () {
      this.selected_date = moment(this.selected_date).subtract(1, "d").format("YYYYMMDD");
      this.$refs.weekListContainer.scrollLeft = this.todoListWidth() * 2;
      this.$refs.weekListContainer.scroll({
        left: this.$refs.weekListContainer.scrollLeft - this.todoListWidth(),
        top: 0,
        behavior: "smooth",
      });
    },
    weekMoveRight: function () {
      this.selected_date = moment(this.selected_date).add(1, "d").format("YYYYMMDD");
      this.$refs.weekListContainer.scrollLeft = 0;
      this.$refs.weekListContainer.scroll({
        left: this.$refs.weekListContainer.scrollLeft + this.todoListWidth(),
        top: 0,
        behavior: "smooth",
      });
    },
    requestDesktopSettings: function () {
      if (IS_DESKTOP_SETTINGS_WINDOW) {
        this.openDesktopSettings();
        return;
      }
      if (this.ipcRenderer) {
        this.ipcRenderer.send("desktop-widget-open-settings");
        return;
      }
      this.openDesktopSettings();
    },
    openDesktopSettings: function () {
      const modalElement = document.getElementById("configModal");
      if (!modalElement) return;
      const options = this.isDesktopSettingsWindow
        ? { backdrop: false, keyboard: false }
        : { backdrop: false };
      Modal.getOrCreateInstance(modalElement, options).show();
      this.$nextTick(() => {
        const desktopTab = document.getElementById("config-desktop-widget-tab");
        if (desktopTab) desktopTab.click();
      });
    },
    closeSettingsWindow: function () {
      if (this.ipcRenderer) {
        this.ipcRenderer.send("close-desktop-settings");
      } else {
        window.close();
      }
    },
    handleDesktopModalShown: function () {
      this.desktopModalOpen = true;
    },
    handleDesktopModalHidden: function () {
      setTimeout(() => {
        this.desktopModalOpen = !!document.querySelector(".modal.show");
      }, 0);
    },
    closeDesktopModal: function () {
      if (IS_DESKTOP_SETTINGS_WINDOW) {
        this.closeSettingsWindow();
        return;
      }
      const modalElement = document.querySelector(".modal.show");
      if (!modalElement) return;
      const instance = Modal.getInstance(modalElement);
      if (instance) instance.hide();
    },
    setDesktopConfig: function (key, value) {
      this.$store.commit("updateConfig", { key, val: value });
      configRepository.update(this.$store.getters.config);
    },
    toggleDesktopLock: function () {
      this.endDesktopMove();
      this.clearDesktopResizeCursor();
      this.desktopLocked = !this.desktopLocked;
    },
    weekStartMoment: function (date) {
      const day = moment(date || undefined).startOf("day");
      if (this.$store.getters.config.weekStartOnMonday !== false) {
        return day.subtract((day.day() + 6) % 7, "days");
      }
      return day.subtract(day.day(), "days");
    },
    desktopResizeDirectionAt: function (event) {
      if (!this.desktopMode || this.desktopLocked || this.isDesktopSettingsWindow) {
        return "";
      }
      if (event.button !== 0) return "";
      if (document.querySelector(".modal.show")) return "";

      const container = document.getElementById("app-container");
      if (!container) return "";
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return "";

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return "";

      // Keep clicks on interactive content (buttons, inputs, links) untouched.
      const target = event.target;
      if (
        target &&
        target.closest &&
        target.closest(
          "button, a, input, textarea, select, .modal, .dropdown-menu, .desktop-drag-grip, .desktop-widget-actions, .header-menu-icons, .todo-item-menu, .todo-item-remove, .todo-item-fail, .cicle-icon"
        )
      ) {
        return "";
      }

      // The header is the drag handle. Do not turn its top area into a resize
      // region, otherwise moving the widget and resizing from the top conflict.
      if (
        target &&
        target.closest &&
        target.closest(".desktop-widget-header")
      ) {
        return "";
      }

      // Corner zones are inset from the native rounded region. The top edge is
      // intentionally excluded so the header stays a pure drag handle.
      const corner = 28;
      const nearLeft = x <= corner;
      const nearRight = rect.width - x <= corner;
      const nearBottom = rect.height - y <= corner;

      if (nearLeft && nearBottom) return "sw";
      if (nearRight && nearBottom) return "se";
      if (nearLeft) return "w";
      if (nearRight) return "e";
      if (nearBottom) return "s";

      return "";
    },
    handleDesktopPointerDown: function (event) {
      if (!this.desktopMode || this.isDesktopSettingsWindow) return;
      const direction = this.desktopResizeDirectionAt(event);
      if (!direction) return;
      event.preventDefault();
      event.stopPropagation();
      this.startDesktopResize(direction);
    },
    desktopResizeCursor: function (direction) {
      const cursors = {
        n: "ns-resize",
        s: "ns-resize",
        e: "ew-resize",
        w: "ew-resize",
        nw: "nwse-resize",
        ne: "nesw-resize",
        sw: "nesw-resize",
        se: "nwse-resize",
      };
      return cursors[direction] || "";
    },
    handleDesktopPointerMove: function (event) {
      if (!this.desktopMode || this.desktopLocked || this.isDesktopSettingsWindow) return;
      if (this.desktopResizing) return;
      const container = document.getElementById("app-container");
      if (!container) return;
      const direction = this.desktopResizeDirectionAt(event);
      container.style.cursor = direction ? this.desktopResizeCursor(direction) : "";
    },
    clearDesktopResizeCursor: function () {
      const container = document.getElementById("app-container");
      if (container) container.style.cursor = "";
      document.body.style.cursor = "";
    },
    liquidGlassActive: function () {
      return !!(
        this.desktopMode &&
        !this.isDesktopSettingsWindow &&
        this.desktopThemeDefinition &&
        this.desktopThemeDefinition.liquidGlass
      );
    },
    clearLiquidGlassFilters: function () {
      this.liquidGlassReady = false;
      if (this.liquidGlassTimer) {
        clearTimeout(this.liquidGlassTimer);
        this.liquidGlassTimer = null;
      }
      const svg = this.$refs.liquidGlassDefs;
      const defs = svg && svg.querySelector("defs");
      if (defs) defs.innerHTML = "";
    },
    scheduleLiquidGlassUpdate: function () {
      if (!this.liquidGlassActive()) {
        this.clearLiquidGlassFilters();
        return;
      }
      if (this.liquidGlassTimer) clearTimeout(this.liquidGlassTimer);
      this.liquidGlassTimer = setTimeout(() => {
        this.liquidGlassTimer = null;
        if (this.liquidGlassFrame) cancelAnimationFrame(this.liquidGlassFrame);
        this.liquidGlassFrame = requestAnimationFrame(() => {
          this.liquidGlassFrame = null;
          this.updateLiquidGlassFilters();
        });
      }, 120);
    },
    updateLiquidGlassFilters: function () {
      const svg = this.$refs.liquidGlassDefs;
      const defs = svg && svg.querySelector("defs");
      if (!defs) return;
      if (!this.liquidGlassActive() || !isLiquidGlassSupported()) {
        defs.innerHTML = "";
        return;
      }

      const backdrop = document.querySelector(".desktop-backdrop");
      const header = document.querySelector(".desktop-widget-header");
      const column = document.querySelector(".to-do-list-container");
      const shellSpec = backdrop
        ? {
            width: backdrop.clientWidth,
            height: backdrop.clientHeight,
            radius: 22,
            bezel: 18,
            thickness: 65,
            ior: 1.5,
            scaleRatio: 0.75,
            mapWidth: 640,
          }
        : null;
      const headerSpec = header
        ? {
            width: header.clientWidth,
            height: header.clientHeight,
            radius: 14,
            bezel: 10,
            thickness: 45,
            ior: 1.5,
            scaleRatio: 0.7,
            mapWidth: 480,
          }
        : null;
      const columnSpec = column
        ? {
            width: column.clientWidth,
            height: column.clientHeight,
            radius: 14,
            bezel: 8,
            thickness: 45,
            ior: 1.5,
            scaleRatio: 0.45,
            mapWidth: 320,
          }
        : null;

      defs.innerHTML = buildLiquidGlassFilters(
        shellSpec,
        headerSpec,
        columnSpec
      );
      this.liquidGlassReady = !!defs.innerHTML;
    },
    startDesktopDrag: function (event) {
      if (!this.desktopMode || this.desktopLocked || event.button !== 0) return;
      const resizeDirection = this.desktopResizeDirectionAt(event);
      if (resizeDirection) {
        event.preventDefault();
        this.startDesktopResize(resizeDirection);
        return;
      }
      const target = event.target;
      if (
        target &&
        target.closest &&
        target.closest("button, input, .desktop-widget-actions")
      ) {
        return;
      }
      event.preventDefault();
      this.desktopDragging = true;
      if (this.ipcRenderer) this.ipcRenderer.send("desktop-widget-drag-start");
    },
    startDesktopResize: function (direction) {
      if (!this.desktopMode || this.desktopLocked) return;
      this.desktopResizing = true;
      document.body.style.cursor = this.desktopResizeCursor(direction);
      if (this.ipcRenderer)
        this.ipcRenderer.send("desktop-widget-resize-start", direction);
    },
    endDesktopMove: function () {
      if (!this.desktopDragging && !this.desktopResizing) return;
      if (this.ipcRenderer) {
        this.ipcRenderer.send("desktop-widget-drag-end");
        this.ipcRenderer.send("desktop-widget-resize-end");
      }
      this.desktopDragging = false;
      this.desktopResizing = false;
      this.clearDesktopResizeCursor();
    },
    desktopWeekMove: function (direction) {
      this.selected_date = this.weekStartMoment(this.selected_date)
        .add(direction * 7, "d")
        .format("YYYYMMDD");
      this.$nextTick(() => {
        this.weekResetScroll();
      });
    },
    goToToday: function () {
      this.selected_date = this.weekStartMoment(moment()).format("YYYYMMDD");
      this.$nextTick(() => {
        this.weekResetScroll();
      });
    },
    deleteOldRepeatingEvents: function () {
      for (const event of Object.entries(this.$store.getters.repeatingEventList)) {
        if (moment(event[1].end_date).isBefore(moment())) {
          repeatingEventRepository.remove(event[0]);
          this.$store.commit("removeRepeatingEvent", event[0]);
        }
      }
    },
    weekResetScroll: function () {
      if (!this.$refs.weekListContainer) return;
      this.$refs.weekListContainer.scrollLeft = this.desktopMode ? 0 : this.todoListWidth();
      this.scheduleLiquidGlassUpdate();
    },
    customMoveRight: function () {
      this.$refs.customListContainer.scrollLeft =
        this.$refs.customListContainer.scrollLeft + this.customTodoListWidth() - 13;
    },
    customMoveLeft: function () {
      this.$refs.customListContainer.scrollLeft = this.$refs.customListContainer.scrollLeft - this.customTodoListWidth();
    },
    resetCustomList: function () {
      this.$nextTick(function () {
        this.$refs.customListContainer.scrollLeft = 0;
      });
    },
    todoListWidth: function () {
      return this.$refs.weekListContainer.clientWidth / this.displayedColumns;
    },
    customTodoListWidth: function () {
      return this.$refs.customListContainer.clientWidth / this.customColumns;
    },
    setSelectedDate: function (date) {
      this.selected_date = date;
      this.$nextTick(function () {
        document
          .getElementById("list" + date)
          .getElementsByClassName("new-todo-input")[0]
          .focus();
      });
    },
    isElectron: function () {
      let isElectron = require("is-electron");
      return isElectron();
    },
    hideSplash: function () {
      if (this.desktopMode) {
        return;
      }
      if (this.isElectron()) {
        if (this.ipcRenderer.sendSync("is-windows-visible")) {
          this.$refs.splash.hideSplash();
        }
      } else {
        this.$refs.splash.hideSplash();
      }
      this.checksOnLoadApp();
      if (this.$store.getters.config.firstTimeOpen) {
        this.showWelcomeModal();
      }
    },
    showWelcomeModal: function () {
      if (this.desktopMode) return;
      let modal = new Modal(document.getElementById("welcomeModal"), {
        backdrop: "static",
      });
      modal.show();
      this.$store.commit("updateConfig", { val: false, key: "firstTimeOpen" });
      configRepository.update(this.$store.getters.config);
    },
    compatible: function () {
      return window.IndexedDB;
    },
    resizerDblClick: function () {
      if (this.$store.getters.config.mainDividerPosition != 1) return;

      this.calendarHeight = "calc(50% - 50px)";
      this.$store.commit("updateConfig", {
        val: this.calendarHeight,
        key: "calendarHeight",
      });
      configRepository.update(this.$store.getters.config);
    },
    resizerMouseDownHandler: function (e) {
      if (this.$store.getters.config.mainDividerPosition != 1) return;

      this.resizerY = e.clientY - 50;
      document.addEventListener("mousemove", this.resizerMouseMoveHandler);
      document.addEventListener("mouseup", this.resizerMouseUpHandler);
    },
    resizerMouseMoveHandler: function (e) {
      this.calendarHeight = `${((e.clientY - 50) * 100) / this.zoom}px`;
    },
    resizerMouseUpHandler: function () {
      document.removeEventListener("mousemove", this.resizerMouseMoveHandler);
      document.removeEventListener("mouseup", this.resizerMouseUpHandler);
      this.$store.commit("updateConfig", {
        val: this.calendarHeight,
        key: "calendarHeight",
      });
      configRepository.update(this.$store.getters.config);
    },
    refreshTodayNotifications: function () {
      notifications.refreshDayNotifications(this, moment().format("YYYYMMDD"));
    },
    todoListMounted: function () {
      this.methodsAfterInitialLoad();
    },
    methodsAfterInitialLoad: function () {
      if (IS_DESKTOP_SETTINGS_WINDOW) return;
      if (!this.initialLoadCompleted) {
        this.initialListLoaded++;
        if (this.initialListLoaded == this.initialListToLoad) {
          this.initialLoadCompleted = true;
          if (this.$store.getters.config.moveOldTasks) {
            this.moveOldTasksToToday().then(() => {
              this.refreshTodayNotifications();
              this.$store.commit("updateConfig", { val: moment().format("YYYYMMDD"), key: "lastDayOpened" });
              configRepository.update(this.$store.getters.config);
              if (isElectron()) this.showInitialNotification();
            });
          } else {
            this.refreshTodayNotifications();
            if (isElectron()) this.showInitialNotification();
            this.$store.commit("updateConfig", { val: moment().format("YYYYMMDD"), key: "lastDayOpened" });
            configRepository.update(this.$store.getters.config);
          }
        }
      }
    },
    showInitialNotification: function () {
      if (this.desktopMode) return;
      if (!(this.$store.getters.config.notificationOnStartup && !this.$store.getters.config.firstTimeOpen)) return;
      setTimeout(
        function () {
          new Notification("WeekToDo", {
            body: this.initialNotificationText(),
            icon: "/favicon.ico",
            silent: true,
          }).onclick = () => {
            this.ipcRenderer.send("show-current-window");
            setTimeout(() => {
              if (document.getElementById("splashScreen")) {
                document.getElementById("splashScreen").classList.add("hiddenSplashScreen");
              }
            }, 3000);
          };
          notifications.playNotificationSound(this.$store.getters.config.notificationSound);
        }.bind(this),
        2000
      );
    },
    initialNotificationText: function () {
      let yesterdayTasks = this.$store.getters.todoLists[moment().subtract(1, "d").format("YYYYMMDD")];
      let todayTasks = this.$store.getters.todoLists[moment().format("YYYYMMDD")];

      let yesterayPendingTasksCount = taskHelper.pendingTasksCount(yesterdayTasks);
      let todayPendingTasksCount = taskHelper.pendingTasksCount(todayTasks);

      if (yesterayPendingTasksCount == 0 && todayPendingTasksCount == 0) {
        return this.$t("notifications.noPendingTasksToday");
      } else if (yesterayPendingTasksCount == 0) {
        return this.$t("notifications.pendingTasksToday", [todayPendingTasksCount]);
      } else if (todayPendingTasksCount == 0) {
        return this.$t("notifications.pendingTasksYesterday", [yesterayPendingTasksCount]);
      } else {
        return this.$t("notifications.pendingTasksYesterdayAndToday", [yesterayPendingTasksCount, todayPendingTasksCount]);
      }
    },
    resetAppOnDayChange: function () {
      if (IS_DESKTOP_SETTINGS_WINDOW) return;
      var x = new moment();
      var y = new moment().add(1, "d").startOf("date");
      var duration = moment.duration(y.diff(x)).asMilliseconds();

      setTimeout(
        function () {
          if (isElectron() && !this.ipcRenderer.sendSync("is-windows-visible")) {
            window.location.reload();
          }
          this.refreshTodayNotifications();
          this.resetAppOnDayChange();
        }.bind(this),
        duration
      );
    },
    moveOldTasksToToday: async function () {
      var promise = new Promise((resolve) => {
        var todayListId = moment().format("YYYYMMDD");
        let daysBefore = moment().diff(moment(this.$store.getters.config.lastDayOpened), "days");
        if (daysBefore == 0) daysBefore = 7;
        for (let i = 1; i <= daysBefore; i++) {
          let listId = moment().subtract(i, "d").format("YYYYMMDD");
          this.$store.dispatch("loadTodoLists", listId).then(() => {
            this.$store.commit("moveUndoneItems", { origenId: listId, destinyId: todayListId });
            toDoListRepository.update(listId, this.$store.getters.todoLists[listId]);
            if (this.$store.getters.config.autoReorderTasks) {
              toDoListRepository.update(
                todayListId,
                tasksHelper.reorderTasksList(this.$store.getters.todoLists[todayListId])
              );
            } else {
              toDoListRepository.update(todayListId, this.$store.getters.todoLists[todayListId]);
            }
            if (i == daysBefore) {
              resolve("done!");
            }
          });
        }
      });
      return promise;
    },
    setDividerPosition: function (position) {
      this.$nextTick(function () {
        document.getElementById("app-container").classList.add("scrolling");
        setTimeout(() => {
          document.getElementById("app-container").classList.remove("scrolling");
        }, 400);
        this.$store.commit("updateConfig", { val: position, key: "mainDividerPosition" });
        configRepository.update(this.$store.getters.config);
      });
    },
    checkVersion: function () {
      if (version_json.version != this.$store.getters.config.version) {
        this.$store.commit("updateConfig", { val: version_json.version, key: "version" });
        configRepository.update(this.$store.getters.config);
        var toast = new Toast(document.getElementById("versionChanges"));
        toast.show();
      }
    },
    checkForUpdates: function () {
      if (this.isElectron() && this.$store.getters.config.checkUpdates) {
        const axios = require("axios").default;
        axios
          .get("https://app.weektodo.me/version.json")
          .then((response) => this.showNewVersionToast(response))
          .catch((error) => console.log(error.message));
      }
    },
    checksOnLoadApp: function () {
      if (this.isElectron()) {
        require("electron").ipcRenderer.on("initial-checks", () => {
          this.checkVersion();
          this.checkForUpdates();
        });
      } else {
        this.checkVersion();
      }
    },
    showNewVersionToast: function (response) {
      if (response.data.version != version_json.version) {
        var toast = new Toast(document.getElementById("newVersionAvailable"));
        toast.show();
      }
    },
    downloadNewVersion: function () {
      let isElectron = require("is-electron");
      if (isElectron()) {
        require("electron").shell.openExternal("https://weektodo.me", "_blank");
      } else {
        window.open("https://weektodo.me", "_blank");
      }
    },
    seeChangeLog: function () {
      window.open("https://weektodo.me/changelog", "_blank");
    },
    syncElectronConfig: function () {
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("set-tray-context-menu-label", { open: this.$t("ui.open"), quit: this.$t("ui.quit") });
      ipcRenderer.send("set-open-on-startup", this.$store.getters.config.openOnStartup);
      ipcRenderer.send("set-run-in-background", this.$store.getters.config.runInBackground);
      ipcRenderer.send("set-dark-tray-icon", this.$store.getters.config.darkTrayIcon);
    },
  },
  watch: {
    weekStartOnMondayFromConfig: function () {
      if (!this.desktopMode) return;
      // Keep the currently displayed week in view when its first day changes:
      // anchor on the middle of the old week instead of its first day.
      const anchor = moment(this.selected_date || moment()).add(3, "d");
      this.selected_date = this.weekStartMoment(anchor).format("YYYYMMDD");
      this.$nextTick(() => {
        this.weekResetScroll();
      });
    },
    desktopTheme: function () {
      this.$nextTick(() => this.scheduleLiquidGlassUpdate());
    },
    zoom: function () {
      this.$nextTick(() => this.scheduleLiquidGlassUpdate());
    },
  },
  computed: {
    language: function () {
      const config = this.$store.getters.config || {};
      return config.language || (this.$i18n && this.$i18n.locale) || "en";
    },
    desktopRangeLabel: function () {
      if (!this.selected_date) return "";
      const start = this.desktopWeekStartDate;
      const end = start.clone().add(6, "d");
      const locale = (this.language || "en").replace("_", "-");
      let formatter;
      try {
        formatter = new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric",
        });
      } catch (error) {
        formatter = new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        });
      }
      return `${formatter.format(start.toDate())} – ${formatter.format(end.toDate())}`;
    },
    dates_array: function () {
      if (!this.selected_date) return [];

      if (this.desktopMode) {
        const start = this.desktopWeekStartDate;
        const dates = [];
        for (let i = 0; i < 7; i += 1) {
          dates.push(start.clone().add(i, "d").format("YYYYMMDD"));
        }
        this.$store.commit("updateSelectedDates", dates);
        return dates;
      }

      var dates_array = [moment(this.selected_date).subtract(1, "d").format("YYYYMMDD"), this.selected_date];

      for (let i = 1; i < this.columns; i++) {
        dates_array.push(moment(this.selected_date).add(i, "d").format("YYYYMMDD"));
      }

      if (this.$store.getters.config.startCalendarYesterday) {
        dates_array.unshift(moment(this.selected_date).subtract(2, "d").format("YYYYMMDD"));
      } else {
        dates_array.push(moment(this.selected_date).add(this.columns, "d").format("YYYYMMDD"));
      }

      this.$store.commit("updateSelectedDates", dates_array);
      return dates_array;
    },
    showCustomList: function () {
      return this.$store.getters.config.customList;
    },
    showCalendar: function () {
      return this.$store.getters.config.calendar;
    },
    columns: function () {
      return this.$store.getters.config.columns;
    },
    displayedColumns: function () {
      return this.desktopMode ? 7 : this.columns;
    },
    desktopWeekStartDate: function () {
      return this.weekStartMoment(this.selected_date || moment());
    },
    weekStartOnMondayFromConfig: function () {
      return this.$store.getters.config.weekStartOnMonday;
    },
    desktopTheme: {
      get() {
        return this.$store.getters.config.desktopTheme || "frosted-white";
      },
      set(value) {
        this.setDesktopConfig("desktopTheme", value);
      },
    },
    desktopOpacity: {
      get() {
        const value = this.$store.getters.config.desktopOpacity;
        return typeof value === "number" ? value : 0.68;
      },
      set(value) {
        this.setDesktopConfig("desktopOpacity", value);
      },
    },
    desktopLocked: {
      get() {
        return !!this.$store.getters.config.desktopLocked;
      },
      set(value) {
        this.setDesktopConfig("desktopLocked", value);
      },
    },
    customColumns: function () {
      return this.$store.getters.config.customColumns;
    },
    zoom: function () {
      return this.$store.getters.config.zoom;
    },
    darkTheme: function () {
      if (this.isDesktopSettingsWindow) return false;
      if (this.desktopMode) return this.desktopThemeDefinition.dark;
      return this.$store.getters.config.darkTheme;
    },
    desktopThemeDefinition: function () {
      return getDesktopTheme(this.desktopTheme);
    },
    fontFamily: function () {
      return this.$store.getters.config.fontFamily || "";
    },
    fontColor: function () {
      return this.$store.getters.config.fontColor || "";
    },
    fontWeight: function () {
      return String(this.$store.getters.config.fontWeight || "400");
    },
    fontFamilyStack: function () {
      const font = String(this.fontFamily).replace(/["\\]/g, "").trim();
      return font ? `"${font}", "Segoe UI", system-ui, sans-serif` : "";
    },
    appContainerStyle: function () {
      const style =
        this.desktopMode && !this.isDesktopSettingsWindow
          ? Object.assign({}, this.desktopThemeVars)
          : {};
      if (this.fontFamilyStack) style.fontFamily = this.fontFamilyStack;
      if (this.fontColor) style.color = this.fontColor;
      if (this.fontWeight) style.fontWeight = this.fontWeight;
      return style;
    },
    desktopThemeVars: function () {
      const theme = this.desktopThemeDefinition;
      const opacity = Math.max(0.15, Math.min(1, Number(this.desktopOpacity) || 0.68));
      const shellAlpha = 0.12 + opacity * 0.78;
      const panelAlpha = 0.18 + opacity * 0.58;
      const strongAlpha = Math.min(0.96, panelAlpha + 0.14);
      const glassDark = theme.dark;
      const glassWhite = theme.glassTint === "white";

      const glassTint = glassDark
        ? rgba(theme.shell, 0.32)
        : glassWhite
          ? "rgba(255, 255, 255, 0.5)"
          : "rgba(255, 255, 255, 0.06)";
      const glassTint2 = glassDark
        ? rgba(theme.panel, 0.1)
        : glassWhite
          ? "rgba(255, 255, 255, 0.18)"
          : "rgba(255, 255, 255, 0.01)";
      const glassSurface = glassDark
        ? "rgba(28, 38, 52, 0.5)"
        : glassWhite
          ? "rgba(255, 255, 255, 0.56)"
          : "rgba(255, 255, 255, 0.12)";
      const glassSurfaceStrong = glassDark
        ? "rgba(16, 24, 36, 0.3)"
        : glassWhite
          ? "rgba(255, 255, 255, 0.32)"
          : "rgba(255, 255, 255, 0.04)";
      const glassBorder = glassDark
        ? "rgba(255, 255, 255, 0.22)"
        : glassWhite
          ? "rgba(255, 255, 255, 0.95)"
          : "rgba(255, 255, 255, 0.7)";
      const glassHighlight = glassDark
        ? "rgba(255, 255, 255, 0.22)"
        : glassWhite
          ? "rgba(255, 255, 255, 1)"
          : "rgba(255, 255, 255, 0.9)";
      const customColor = /^#[0-9a-f]{6}$/i.test(this.fontColor)
        ? this.fontColor
        : "";
      const textColor = customColor || theme.text;
      const mutedColor = customColor ? rgba(customColor, 0.72) : theme.muted;
      const iconColor =
        customColor || (glassDark ? "#f2f7ff" : "#111827");

      return {
        "--dw-shell": rgba(theme.shell, shellAlpha),
        "--dw-panel": rgba(theme.panel, panelAlpha),
        "--dw-panel-strong": rgba(theme.panel, strongAlpha),
        "--dw-text": textColor,
        "--dw-muted": mutedColor,
        "--dw-border": rgba(theme.border, 0.24 + opacity * 0.36),
        "--dw-accent": theme.accent,
        "--dw-accent-soft": rgba(theme.accent, 0.16 + opacity * 0.12),
        "--dw-shadow": theme.shadow,
        "--dw-base": theme.shell,
        "--dw-popover": theme.panel,
        "--dw-radius": "20px",
        "--lg-tint": glassTint,
        "--lg-tint-2": glassTint2,
        "--lg-glass": glassSurface,
        "--lg-glass-strong": glassSurfaceStrong,
        "--lg-border": glassBorder,
        "--lg-highlight": glassHighlight,
        "--lg-icon": iconColor,
        "--lg-input": glassDark
          ? "rgba(8, 14, 22, 0.38)"
          : glassWhite
            ? "rgba(255, 255, 255, 0.62)"
            : "rgba(255, 255, 255, 0.2)",
        "--lg-button": glassDark
          ? "rgba(255, 255, 255, 0.06)"
          : glassWhite
            ? "rgba(255, 255, 255, 0.5)"
            : "rgba(255, 255, 255, 0.26)",
        "--lg-sheen": glassDark
          ? "rgba(255, 255, 255, 0.12)"
          : glassWhite
            ? "rgba(255, 255, 255, 0.55)"
            : "rgba(255, 255, 255, 0.28)",
        "--lg-streak": glassDark
          ? "rgba(255, 255, 255, 0.06)"
          : glassWhite
            ? "rgba(255, 255, 255, 0.22)"
            : "rgba(255, 255, 255, 0.12)",
        "--lg-inner-shadow": glassDark
          ? "rgba(0, 0, 0, 0.28)"
          : glassWhite
            ? "rgba(30, 50, 70, 0.04)"
            : "rgba(30, 50, 70, 0.06)",
        "--lg-shadow": theme.shadow,
        "--lg-backdrop-effects": glassDark
          ? "saturate(1.2) brightness(0.94)"
          : glassWhite
            ? "saturate(0.5) brightness(1.08)"
            : "saturate(1.02) brightness(1.03)",
        "--lg-panel-effects": glassDark
          ? "saturate(1.15) brightness(0.95)"
          : glassWhite
            ? "saturate(0.55) brightness(1.06)"
            : "saturate(1) brightness(1.03)",
      };
    },
    desktopWindowBaseStyle: function () {
      const theme = this.desktopThemeDefinition;
      return {
        backgroundColor: theme.shell,
        backgroundImage: this.desktopBackdrop
          ? `url(${this.desktopBackdrop})`
          : "none",
      };
    },
    resizableStyle: function () {
      if (this.showCalendar && this.showCustomList) {
        return { height: this.calendarHeight };
      } else {
        return {};
      }
    },
    selectedTodo: function () {
      if (this.$store.getters.actions.selectedTodo) {
        return this.$store.getters.actions.selectedTodo;
      }
      return null;
    },
    activeTodo: function () {
      if (this.$store.getters.activeTodo) {
        return this.$store.getters.activeTodo;
      }
      return null;
    },
    mainDividerPositionClass: function () {
      if (this.$store.getters.config.mainDividerPosition == 0) {
        return "on-bottom";
      } else if (this.$store.getters.config.mainDividerPosition == 1) {
        return "on-center";
      } else {
        return "on-top";
      }
    },
    hideTopListContainer: function () {
      if (!this.$store.getters.config.customList || !this.$store.getters.config.calendar) return false;

      return this.$store.getters.config.mainDividerPosition == 2 ? true : false;
    },
    hideBottomListContainer: function () {
      if (!this.$store.getters.config.customList || !this.$store.getters.config.calendar) return false;

      return this.$store.getters.config.mainDividerPosition == 0 ? true : false;
    },
  },
};
</script>

<style lang="scss">
@import "/src/assets/style/globalVars.scss";

body {
  line-height: unset !important;
}

/* Paints the sampled wallpaper in the four corner slivers outside the card.
   Windows window regions are binary, so filling those corners with the real
   wallpaper keeps the native rounded clip from showing a jagged white edge. */
.desktop-window-base {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  pointer-events: none;
}

.desktop-mode {
  position: relative;
  z-index: 1;
  overflow: hidden;
  box-sizing: border-box;
  color: var(--dw-text);
  background: transparent;
  border-radius: var(--dw-radius);
  border: 1px solid var(--dw-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  isolation: isolate;
}

.desktop-backdrop {
  position: absolute;
  inset: 0;
  z-index: -3;
  background-size: cover;
  background-position: center;
  filter: blur(26px) saturate(1.18);
  opacity: 0.92;
  pointer-events: none;
}

.desktop-tint {
  position: absolute;
  inset: 0;
  z-index: -2;
  background: var(--dw-shell);
  pointer-events: none;
}

.desktop-texture .desktop-tint::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background-image: radial-gradient(rgba(0, 0, 0, 0.12) 0.7px, transparent 0.7px);
  background-size: 3px 3px;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.desktop-glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(1000px 360px at 8% -12%, var(--dw-accent-soft), transparent 62%),
    radial-gradient(760px 420px at 100% 0%, rgba(255, 255, 255, 0.12), transparent 58%);
  pointer-events: none;
}

.desktop-mode .app-body {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.desktop-mode .app-body > .h-100 {
  height: auto;
  flex: 1 1 auto;
  min-height: 0;
}

.desktop-mode .todo-lists-container {
  margin-top: 0;
  margin-bottom: 0;
  padding: 2px 0;
  overflow: hidden;
}

/* The card itself must never scroll. Each day column owns its task list and
   scrolls it with the wheel while the header and new-task input stay fixed. */
.desktop-mode .todo-slider {
  height: 100%;
  min-height: 0;
  overflow-y: hidden;
}

.desktop-mode .full-screen .todo-slider {
  margin-top: 0;
}

.desktop-mode .to-do-list-container {
  height: 100%;
  min-height: 0;
  margin-bottom: 0;
}

.desktop-mode .to-do-list {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}

.desktop-mode .to-do-list::-webkit-scrollbar {
  display: none;
}

.desktop-widget-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  margin-bottom: 8px;
  cursor: move;
  user-select: none;
  padding: 8px 10px 8px 14px;
  color: var(--dw-muted);
  font-size: 0.85rem;
  border: 1px solid var(--dw-border);
  border-radius: 14px;
  background: var(--dw-panel);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
}

.desktop-widget-header.is-locked {
  cursor: default;
}

.desktop-drag-grip {
  color: var(--dw-muted);
  font-size: 0.9rem;
  opacity: 0.55;
}

.desktop-widget-header.is-locked .desktop-drag-grip {
  opacity: 0.2;
}

.desktop-widget-header.is-dragging {
  cursor: grabbing;
}

.desktop-widget-title {
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--dw-text);
}

.desktop-week-nav {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
}

.desktop-widget-range {
  min-width: 132px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.desktop-week-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--dw-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
}

.desktop-week-arrow:hover {
  color: var(--dw-text);
  background: var(--dw-accent-soft);
  border-color: var(--dw-border);
}

.desktop-widget-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.desktop-widget-actions i {
  cursor: pointer;
  font-size: 1rem;
  border-radius: 8px;
  padding: 2px;
}

.desktop-widget-actions i:hover {
  color: var(--dw-text);
  background: var(--dw-accent-soft);
}

.desktop-widget-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  margin-left: 2px;
  padding: 0;
  color: var(--dw-muted);
  background: var(--dw-panel-strong);
  border: 1px solid var(--dw-border);
  border-radius: 9px;
  cursor: pointer;
}

.desktop-widget-theme-toggle:hover {
  color: var(--dw-text);
  border-color: var(--dw-accent);
}

.desktop-theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.desktop-theme-option {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 6px 8px;
  color: var(--dw-text);
  font-size: 0.76rem;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
}

.desktop-theme-option:hover {
  color: var(--dw-text);
  background: var(--dw-accent-soft);
}

.desktop-theme-option.is-active {
  color: var(--dw-text);
  border-color: var(--dw-accent);
  background: var(--dw-accent-soft);
}

.desktop-theme-swatch {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  border: 1px solid;
  border-radius: 6px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.desktop-theme-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.desktop-theme-opacity {
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid var(--dw-border);
}

.desktop-theme-opacity-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  color: var(--dw-muted);
  font-size: 0.74rem;
}

.desktop-theme-opacity input[type="range"] {
  width: 100%;
  accent-color: var(--dw-accent);
}

.desktop-mode.desktop-modal-open {
  z-index: 1051;
}

.desktop-modal-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(3px);
}

.desktop-resize-layer {
  position: absolute;
  inset: 0;
  z-index: 950;
  pointer-events: none;
}

.desktop-mode:has(.modal.show) .desktop-resize-layer {
  display: none;
}

.desktop-resize-handle {
  position: absolute;
  pointer-events: none;
}

.desktop-resize-handle:hover {
  background: var(--dw-accent-soft);
}

.desktop-resize-handle.resize-n,
.desktop-resize-handle.resize-s {
  left: 20px;
  right: 20px;
  height: 8px;
  cursor: ns-resize;
}

.desktop-resize-handle.resize-n {
  top: 2px;
}

.desktop-resize-handle.resize-s {
  bottom: 2px;
}

.desktop-resize-handle.resize-w,
.desktop-resize-handle.resize-e {
  top: 20px;
  bottom: 20px;
  width: 8px;
  cursor: ew-resize;
}

.desktop-resize-handle.resize-w {
  left: 2px;
}

.desktop-resize-handle.resize-e {
  right: 2px;
}

.desktop-resize-handle.resize-nw,
.desktop-resize-handle.resize-ne,
.desktop-resize-handle.resize-sw,
.desktop-resize-handle.resize-se {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.desktop-resize-handle.resize-nw {
  top: 10px;
  left: 10px;
  cursor: nwse-resize;
}

.desktop-resize-handle.resize-ne {
  top: 10px;
  right: 10px;
  cursor: nesw-resize;
}

.desktop-resize-handle.resize-sw {
  bottom: 10px;
  left: 10px;
  cursor: nesw-resize;
}

.desktop-resize-handle.resize-se {
  bottom: 10px;
  right: 10px;
  cursor: nwse-resize;
}

.liquid-glass-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* iOS-style liquid glass: the wallpaper is refracted at the card rim, while
   the inner surfaces stay lighter and cheaper so seven columns remain smooth. */
.desktop-glass.desktop-mode {
  box-shadow:
    inset 0 0 0 1px var(--lg-border),
    inset 0 1px 0 var(--lg-highlight),
    inset 0 0 26px rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 var(--lg-inner-shadow),
    0 20px 52px var(--lg-shadow);
}

.desktop-glass.desktop-mode::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 4;
  padding: 1.5px;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    130deg,
    rgba(255, 255, 255, 0.82),
    rgba(255, 255, 255, 0) 28%,
    rgba(255, 255, 255, 0) 72%,
    rgba(255, 255, 255, 0.22)
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  opacity: 0.55;
}

.desktop-glass .desktop-backdrop {
  filter: blur(1.5px) var(--lg-backdrop-effects);
  opacity: 1;
}

.desktop-glass.desktop-glass-ready .desktop-backdrop {
  -webkit-filter: url(#lg-shell) blur(1.5px) var(--lg-backdrop-effects);
  filter: url(#lg-shell) blur(1.5px) var(--lg-backdrop-effects);
}

.desktop-glass .desktop-tint {
  background:
    radial-gradient(80% 70% at 10% 0%, rgba(255, 255, 255, 0.16), transparent 58%),
    linear-gradient(145deg, var(--lg-tint), var(--lg-tint-2));
}

.desktop-glass .desktop-glow {
  opacity: 0.85;
}

.desktop-glass .desktop-widget-header {
  color: var(--lg-icon);
  background:
    linear-gradient(112deg, transparent 0%, var(--lg-streak) 18%, transparent 34%),
    radial-gradient(110% 150% at 12% 0%, var(--lg-sheen), transparent 58%),
    linear-gradient(160deg, var(--lg-glass), var(--lg-glass-strong));
  border-color: var(--lg-border);
  box-shadow:
    inset 0 1px 0 var(--lg-highlight),
    inset 0 0 22px rgba(255, 255, 255, 0.16),
    inset 0 -8px 18px var(--lg-inner-shadow),
    0 12px 28px var(--lg-shadow);
  -webkit-backdrop-filter: blur(6px) var(--lg-panel-effects);
  backdrop-filter: blur(6px) var(--lg-panel-effects);
}

.desktop-glass.desktop-glass-ready .desktop-widget-header {
  -webkit-backdrop-filter: url(#lg-header) blur(6px) var(--lg-panel-effects);
  backdrop-filter: url(#lg-header) blur(6px) var(--lg-panel-effects);
}

.desktop-glass .to-do-list-container {
  background:
    linear-gradient(112deg, transparent 0%, var(--lg-streak) 16%, transparent 34%),
    radial-gradient(120% 80% at 8% 0%, var(--lg-sheen), transparent 52%),
    linear-gradient(155deg, var(--lg-glass), var(--lg-glass-strong));
  border-color: var(--lg-border);
  box-shadow:
    inset 0 1px 0 var(--lg-highlight),
    inset 0 0 24px rgba(255, 255, 255, 0.18),
    inset 0 -12px 26px var(--lg-inner-shadow),
    0 14px 32px var(--lg-shadow);
  -webkit-backdrop-filter: blur(5px) var(--lg-panel-effects);
  backdrop-filter: blur(5px) var(--lg-panel-effects);
}

.desktop-glass.desktop-glass-ready .to-do-list-container {
  -webkit-backdrop-filter: url(#lg-columns) blur(4px) var(--lg-panel-effects);
  backdrop-filter: url(#lg-columns) blur(4px) var(--lg-panel-effects);
}

.desktop-glass-clear .to-do-list-container {
  background:
    radial-gradient(120% 80% at 12% -10%, rgba(255, 255, 255, 0.26), transparent 50%),
    radial-gradient(80% 80% at 100% 100%, rgba(91, 124, 250, 0.14), transparent 60%),
    linear-gradient(118deg, transparent 0%, rgba(255, 255, 255, 0.16) 16%, transparent 34%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.005));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    inset 0 0 0 1px rgba(255, 255, 255, 0.62),
    inset 0 0 32px rgba(255, 255, 255, 0.22),
    inset 0 -18px 32px rgba(30, 50, 70, 0.05),
    inset 0 0 60px rgba(91, 124, 250, 0.1),
    0 16px 38px var(--lg-shadow);
  -webkit-backdrop-filter: blur(8px) saturate(1.15) brightness(1.05);
  backdrop-filter: blur(8px) saturate(1.15) brightness(1.05);
}

.desktop-glass-clear.desktop-glass-ready .to-do-list-container {
  -webkit-backdrop-filter: url(#lg-columns) blur(8px) saturate(1.15) brightness(1.05);
  backdrop-filter: url(#lg-columns) blur(8px) saturate(1.15) brightness(1.05);
}

.desktop-glass .weekly-to-do-header {
  border-bottom-color: var(--lg-border);
}

.desktop-glass .desktop-widget-title,
.desktop-glass .desktop-widget-range {
  color: var(--lg-icon);
}

.desktop-glass .desktop-week-arrow,
.desktop-glass .desktop-widget-theme-toggle {
  color: var(--lg-icon);
  background: var(--lg-button);
  border-color: var(--lg-border);
}

.desktop-glass .todo-item-container {
  border-bottom-color: var(--lg-border) !important;
}

.desktop-glass .todo-input,
.desktop-glass .new-todo-input,
.desktop-glass .edit.todo-input {
  background: var(--lg-input) !important;
  border-color: var(--lg-border) !important;
}

.desktop-glass .todo-input::placeholder {
  color: var(--dw-muted);
}

.desktop-glass .desktop-widget-theme-toggle,
.desktop-glass .desktop-week-arrow {
  background: var(--lg-button);
  border-color: var(--lg-border);
}

.desktop-glass .desktop-widget-theme-toggle:hover,
.desktop-glass .desktop-week-arrow:hover {
  background: var(--lg-highlight);
  border-color: var(--lg-border);
}

.desktop-glass .fake-lines {
  opacity: 0.32;
}

.desktop-glass #todo-item-active {
  border-color: var(--lg-border);
  box-shadow:
    0 20px 48px var(--lg-shadow),
    inset 0 1px 0 var(--lg-highlight);
}

.desktop-glass.dark-theme .desktop-widget-theme-toggle,
.desktop-glass.dark-theme .desktop-week-arrow {
  background: var(--lg-button);
}

.desktop-glass.dark-theme .fake-lines {
  opacity: 0.22;
}

/* Dedicated settings window: a full settings page, not a modal floating over
   the weekly task board. The weekly view is not rendered at all in this mode. */
#app-container.desktop-settings-window {
  --dw-shell: #f7f9fd;
  --dw-panel: rgba(255, 255, 255, 0.78);
  --dw-panel-strong: #ffffff;
  --dw-text: #1f2937;
  --dw-muted: #6b7280;
  --dw-border: rgba(15, 23, 42, 0.1);
  --dw-accent: #4f7cff;
  --dw-accent-soft: rgba(79, 124, 255, 0.12);
  --dw-shadow: rgba(15, 23, 42, 0.12);
  color: var(--dw-text);
  background:
    radial-gradient(900px 420px at 100% -8%, rgba(79, 124, 255, 0.12), transparent 62%),
    radial-gradient(720px 380px at 0% 100%, rgba(56, 189, 248, 0.09), transparent 58%),
    linear-gradient(180deg, #f9fbff 0%, #eef2f8 100%);
  border: none;
  border-radius: 0;
  box-shadow: none;
}

body.desktop-settings-body {
  background: #eef2f8;
  overflow: hidden;
}

body.desktop-settings-body .modal-backdrop {
  display: none !important;
}

.desktop-settings-window .app-body {
  height: 100%;
  padding: 0;
}

.desktop-settings-window #configModal {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block !important;
  overflow: hidden;
  background: transparent;
}

.desktop-settings-window #configModal .modal-dialog {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
}

.desktop-settings-window #configModal .modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  background: transparent !important;
  background-image: none !important;
  border: none !important;
  border-radius: 0;
  box-shadow: none !important;
}

.desktop-settings-window #configModal .modal-header {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 6px 22px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(8px);
  -webkit-app-region: drag;
  user-select: none;
}

.desktop-settings-window #configModal .modal-title {
  margin: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.desktop-settings-window #configModal .close-modal {
  color: #6b7280;
  font-size: 1.55rem;
  line-height: 1;
  padding: 0 2px;
  -webkit-app-region: no-drag;
  cursor: pointer;
}

.desktop-settings-window #configModal .close-modal:hover {
  color: #111827;
}

.desktop-settings-window #configModal .modal-body {
  display: flex !important;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 !important;
  overflow: hidden;
}

.desktop-settings-window #configModal #config-links-menu {
  flex: 0 0 232px;
  width: 232px !important;
  max-height: none !important;
  height: auto !important;
  margin: 0;
  padding: 18px 12px;
  overflow-y: auto;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.5);
}

.desktop-settings-window #configModal #config-links-menu .list-group-item {
  margin-bottom: 3px;
  padding: 0;
  color: #4b5563;
  border: none;
  border-radius: 10px;
}

.desktop-settings-window #configModal #config-links-menu .list-item {
  padding: 9px 12px;
  border-radius: 10px;
}

.desktop-settings-window #configModal #config-links-menu .list-group-item:hover .list-item,
.desktop-settings-window #configModal #config-links-menu .list-group-item:focus-within .list-item {
  color: #1f2937;
  background: rgba(79, 124, 255, 0.1);
}

.desktop-settings-window #configModal #config-links-menu .list-group-item.is-active {
  background: rgba(79, 124, 255, 0.14);
}

.desktop-settings-window #configModal #config-links-menu .list-group-item.is-active .list-item {
  color: #111827;
  font-weight: 600;
}

.desktop-settings-window #configModal #config-links-menu .item-img {
  width: 22px;
  margin-right: 12px;
  text-align: center;
}

.desktop-settings-window #configModal .config-tab-content {
  flex: 1 1 auto;
  width: auto !important;
  height: auto !important;
  max-height: none !important;
  padding: 26px 34px 40px !important;
  overflow-y: auto;
  background: transparent;
}

.desktop-settings-window #configModal .config-tab-content > .tab-pane {
  width: 100%;
  max-width: 760px;
}

.desktop-settings-window #configModal .config-tab-content .d-flex.flex-column {
  padding-top: 4px;
}

.desktop-settings-window #configModal .horizontal-divider {
  margin: 18px 0;
  border-top-color: rgba(15, 23, 42, 0.09);
}

.desktop-settings-window #configModal .form-check {
  padding-left: 1.6rem;
}

.desktop-settings-window #configModal .form-check-label {
  margin-left: 0;
  color: #374151;
  font-size: 0.88rem;
}

.desktop-settings-window #configModal .form-select {
  color: #1f2937;
  background-color: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.14);
}

.desktop-settings-window #configModal .btn {
  color: #374151;
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(15, 23, 42, 0.14) !important;
}

.desktop-settings-window #configModal .btn:hover {
  color: #111827;
  background: rgba(79, 124, 255, 0.1);
}

.desktop-settings-window #configModal .desktop-settings-choice {
  color: #4b5563;
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(15, 23, 42, 0.12);
}

.desktop-settings-window #configModal .desktop-settings-choice:has(input:checked) {
  color: #1f2937;
  border-color: #4f7cff;
  background: rgba(79, 124, 255, 0.1);
}

.desktop-settings-window #configModal .desktop-settings-heading {
  color: #111827;
}

.desktop-settings-window #configModal .desktop-theme-option {
  color: #374151;
}

.desktop-settings-window #configModal .desktop-theme-option:hover,
.desktop-settings-window #configModal .desktop-theme-option.is-active {
  color: #111827;
  border-color: #4f7cff;
  background: rgba(79, 124, 255, 0.1);
}

/* WeekToDo's own components use hard-coded light/dark surfaces. Remap the
   important ones to the desktop theme without changing the regular app. */
.desktop-mode .to-do-list-container {
  flex: 1 1 0 !important;
  min-width: 0;
  margin: 0 4px;
  padding: 8px 9px 6px;
  overflow: hidden;
  border: 1px solid var(--dw-border);
  border-radius: 14px;
  background: var(--dw-panel);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.09),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.desktop-mode .weekly-to-do-header {
  margin-bottom: 9px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--dw-border);
}

.desktop-mode .weekly-to-do-header h4,
.desktop-mode .weekly-to-do-header span {
  color: var(--dw-text) !important;
}

.desktop-mode .weekly-to-do-header h4 {
  font-size: 16px !important;
  line-height: 1.15;
}

.desktop-mode .weekly-to-do-header span {
  font-size: 0.72rem;
}

.desktop-mode .weekly-to-do-header .header-menu-icons,
.desktop-mode .weekly-to-do-header i {
  color: var(--dw-muted) !important;
}

.desktop-mode .weekly-to-do-header .header-menu-icons:hover,
.desktop-mode .weekly-to-do-header i:hover {
  color: var(--dw-text) !important;
}

.desktop-mode .todo-item-container {
  border-bottom-color: var(--dw-border) !important;
}

.desktop-mode .item-text,
.desktop-mode .item-time,
.desktop-mode .todo-item,
.desktop-mode .todo-item-container {
  color: var(--dw-text) !important;
}

.desktop-mode .old-date .item-text,
.desktop-mode .old-date .item-time,
.desktop-mode .checked-todo,
.desktop-mode .checked-sub-task {
  color: var(--dw-muted) !important;
}

.desktop-mode .failed-todo {
  color: #e5534b !important;
}

.desktop-mode .todo-input,
.desktop-mode .new-todo-input,
.desktop-mode .edit.todo-input {
  color: var(--dw-text) !important;
  background: var(--dw-panel-strong) !important;
  border: 1px solid var(--dw-border) !important;
  border-radius: 8px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
}

.desktop-mode .todo-input::placeholder {
  color: var(--dw-muted);
}

.desktop-mode .fake-lines {
  opacity: 0.5;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 31px,
    var(--dw-border) 31px,
    var(--dw-border) 32px
  );
  background-size: 100% 32px;
}

.desktop-mode .todo-item {
  color: var(--dw-text) !important;
  background: var(--dw-panel-strong) !important;
  border: 1px solid var(--dw-border);
  box-shadow: 0 14px 36px var(--dw-shadow);
}

/* The hover details card floats over other tasks; it must be opaque so the
   content underneath does not show through and hurt readability. */
.desktop-mode #todo-item-active {
  background: var(--dw-popover) !important;
  background-image: none !important;
  border: 1px solid var(--dw-border);
  box-shadow:
    0 20px 48px var(--dw-shadow),
    0 3px 10px rgba(0, 0, 0, 0.12);
  backdrop-filter: none;
}

.desktop-mode .todo-item .item-text,
.desktop-mode .todo-item .time-details,
.desktop-mode .todo-item .todo-item-menu,
.desktop-mode .todo-item .todo-item-remove {
  color: var(--dw-text) !important;
}

.desktop-mode .slider-btn {
  color: var(--dw-muted);
  border-radius: 10px;
}

.desktop-mode .slider-btn:hover {
  color: var(--dw-text);
  background: var(--dw-accent-soft) !important;
}

.desktop-mode .spinner-border {
  color: var(--dw-accent) !important;
}

.desktop-mode .modal-content {
  color: var(--dw-text);
  background-color: var(--dw-base) !important;
  background-image: linear-gradient(var(--dw-panel-strong), var(--dw-panel-strong)) !important;
  border: 1px solid var(--dw-border) !important;
  box-shadow: 0 24px 70px var(--dw-shadow) !important;
}

.desktop-mode .dropdown-menu {
  color: var(--dw-text);
  background: var(--dw-panel-strong) !important;
  border: 1px solid var(--dw-border) !important;
  box-shadow: 0 24px 70px var(--dw-shadow) !important;
}

.desktop-mode .dropdown-item {
  color: var(--dw-text);
}

.desktop-mode .dropdown-item:hover {
  background: var(--dw-accent-soft);
}

.desktop-mode .form-check-input {
  border-color: var(--dw-border);
}

.desktop-mode .form-check-input:checked {
  background-color: var(--dw-accent);
  border-color: var(--dw-accent);
}

.todo-lists-container {
  display: flex;
  overflow: auto;
  min-height: 5px;
  height: 5px;
  transition: height 0.15s ease-out 0s;
  margin-top: 20px;
  margin-bottom: 25px;
  // margin-bottom: 5px;
}

.slider-btn {
  padding: 3px;
  font-size: 2rem;
  align-self: center;
  flex-grow: 0;
  margin-left: 6px;
  margin-right: 6px;
  cursor: pointer;
  transition: 0.4s cubic-bezier(0.2, 1, 0.1, 1);
}

.slider-btn:hover {
  border-radius: 6px;
  background-color: #eaecef;
}

.slider-btn:active {
  background-color: #dddfe2;
}

.v3dp__popout {
  border-radius: 7px !important;
}

.side-bar .v3dp__popout {
  margin-left: 72px;
  margin-top: 0px;
}

.todo-slider {
  flex-grow: 1;
  display: flex;
  overflow-x: hidden;
  min-height: -webkit-fill-available;
  min-height: -moz-available;
  height: fit-content;
}

@-moz-document url-prefix() {
  .todo-slider {
    min-height: -moz-available;
    height: unset;
  }
}

.slides {
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.dark-theme *::-webkit-scrollbar-thumb {
  background: #333940;
  border-radius: 5px;
}

.dark-theme *::-webkit-scrollbar-thumb:hover {
  background: #39484f;
}

.dark-theme *::-webkit-scrollbar-thumb:active {
  background: #51656f;
}

.full-screen {
  height: 100%;
  resize: unset;
}

.full-screen .todo-slider {
  margin-top: 20px;
}

/*----------------Dark Theme------------------*/
.dark-theme {
  background-color: #13171d;
  color: #c9d1d9;
}

.dark-theme input {
  background-color: #13171d;
  color: #c9d1d9;
}

.dark-theme input.form-range {
  background-color: unset;
}

.dark-theme .slider-btn:hover {
  border-radius: 6px;
  background-color: #21262d;
}

.dark-theme .slider-btn:active {
  background-color: #2a2e36;
}

.mobile {
  width: 100%;
  height: 100%;
  z-index: 999;
  position: absolute;
  padding: 20%;
}

.dark-theme .mobile {
  background-color: #13171d;
}

.compatible {
  width: 100%;
  height: 100%;
  z-index: 999;
  /*position: absolute;*/
}

.hidden-input-for-focus {
  position: absolute;
  top: -100px;
}

.main-horizontal-divider {
  z-index: 5;

  &.on-top {
    cursor: unset;

    .inner-main-horizontal-divider {
      display: none;
    }

    .divider-icons-container {
      margin-top: 5px;
      visibility: visible;
      opacity: 0.3;
    }

    .move-to-corner-down,
    .move-to-corner-up,
    .move-to-center-up {
      display: none;
    }
  }

  &.on-bottom {
    cursor: unset;

    .inner-main-horizontal-divider {
      display: none;
    }

    .divider-icons-container {
      margin-top: -25px;
      visibility: visible;
      opacity: 0.3;
    }

    .move-to-corner-up,
    .move-to-corner-down,
    .move-to-center-down {
      display: none;
    }
  }

  &.on-center {
    .move-to-center-down,
    .move-to-center-up {
      display: none;
    }
  }

  &:hover {
    .divider-icons-container {
      visibility: visible;
      opacity: 1;
    }
  }
}

.divider-icons-container {
  visibility: hidden;
  opacity: 0;
  transition: 0.4s cubic-bezier(0.2, 1, 0.1, 1);
  z-index: 6;
  position: absolute;
  right: 70px;
  margin-top: -8px;
}

.divider-icons {
  @include btn-icon;
  padding: 6px;
  background-color: white;

  &:hover {
    opacity: 1;
  }

  .dark-theme & {
    background-color: #13171d;
  }
}

.hidden-lists-container {
  height: 0px !important;
  margin: 0px;
  min-height: 0px;
}

.full-screen-divider {
  height: 100% !important;
}
</style>
