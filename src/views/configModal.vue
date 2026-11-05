<template>
  <div class="modal fade" id="configModal" tabindex="-1"
    aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ $t("settings.settings") }}</h5>
          <i class="bi-x close-modal" data-bs-dismiss="modal"></i>
        </div>
        <div class="modal-body px-0" style="display: flex">
          <ul class="nav nav-tabs" id="confTab" role="tablist" style="display: none">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="config-home-tab" data-bs-toggle="tab" data-bs-target="#config-home"
                role="tab">
                Home
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-desktop-appearance-tab" data-bs-toggle="tab"
                data-bs-target="#config-desktop-appearance" role="tab">
                {{ $t("settings.desktopAppearance") }}
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-desktop-widget-tab" data-bs-toggle="tab"
                data-bs-target="#config-desktop-widget" role="tab">
                {{ $t("settings.desktopWidget") }}
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-general-tab" data-bs-toggle="tab" data-bs-target="#config-general"
                role="tab">
                General
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-display-tab" data-bs-toggle="tab" data-bs-target="#config-display"
                role="tab">
                Display
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-notifications-tab" data-bs-toggle="tab"
                data-bs-target="#config-notifications" role="tab">
                Notifications
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-data-tab" data-bs-toggle="tab" data-bs-target="#config-data" role="tab">
                Data
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-language-tab" data-bs-toggle="tab" data-bs-target="#config-language"
                role="tab">
                Language
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-behavior-tab" data-bs-toggle="tab" data-bs-target="#config-behavior"
                role="tab">
                Behavior
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="config-about-tab" data-bs-toggle="tab" data-bs-target="#config-about"
                role="tab">
                {{ $t("settings.about") }}
              </button>
            </li>
          </ul>

          <div id="config-links-menu" class="tab-pane fade show" style="width: 280px;">
            <link-list :linkList="configLinks" :activeLink="activeLink"></link-list>
          </div>

          <div class="tab-content px-4 config-tab-content" id="confTab-content" style="width: 100%;">
            <div class="tab-pane fade" id="config-desktop-appearance">
              <div class="d-flex flex-column mt-2 h-100">
                <div class="desktop-settings-heading">{{ $t("ui.desktopTheme") }}</div>
                <div class="desktop-theme-grid">
                  <button
                    v-for="theme in desktopThemes"
                    :key="theme.id"
                    type="button"
                    class="desktop-theme-option"
                    :class="{ 'is-active': (configData.desktopTheme || 'frosted-white') === theme.id }"
                    :title="theme.name"
                    @click="changeConfig('desktopTheme', theme.id)"
                  >
                    <span
                      class="desktop-theme-swatch"
                      :style="{ background: theme.shell, borderColor: theme.accent }"
                    ></span>
                    <span class="desktop-theme-name">{{ theme.name }}</span>
                  </button>
                </div>

                <div class="desktop-theme-opacity">
                  <div class="desktop-theme-opacity-label">
                    <span>{{ $t("ui.desktopOpacity") }}</span>
                    <span>{{ Math.round((Number(configData.desktopOpacity) || 0.68) * 100) }}%</span>
                  </div>
                  <input
                    v-model.number="configData.desktopOpacity"
                    type="range"
                    min="0.15"
                    max="1"
                    step="0.05"
                    @input="changeConfig('desktopOpacity', configData.desktopOpacity)"
                  />
                </div>
              </div>
            </div>

            <div class="tab-pane fade" id="config-desktop-widget">
              <div class="d-flex flex-column mt-2 h-100">
                <div class="desktop-settings-heading">{{ $t("settings.weekStartsOn") }}</div>
                <div class="desktop-settings-choices">
                  <label class="desktop-settings-choice">
                    <input
                      v-model="configData.weekStartOnMonday"
                      type="radio"
                      :value="true"
                      @change="changeConfig('weekStartOnMonday', true)"
                    />
                    <span>{{ $t("settings.monday") }}</span>
                  </label>
                  <label class="desktop-settings-choice">
                    <input
                      v-model="configData.weekStartOnMonday"
                      type="radio"
                      :value="false"
                      @change="changeConfig('weekStartOnMonday', false)"
                    />
                    <span>{{ $t("settings.sunday") }}</span>
                  </label>
                </div>
                <p class="desktop-settings-hint">{{ $t("settings.desktopWeekHint") }}</p>

                <div class="horizontal-divider mb-3"></div>

                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="desktopLockedSetting">
                    {{ $t("ui.desktopLock") }}
                  </label>
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="desktopLockedSetting"
                    v-model="configData.desktopLocked"
                    @change="changeConfig('desktopLocked', configData.desktopLocked)"
                  />
                </div>

                <div class="desktop-settings-row">
                  <span class="desktop-settings-hint flex-fill">{{ $t("settings.desktopBoundsHint") }}</span>
                  <button type="button" class="btn desktop-settings-button" @click="resetDesktopBounds">
                    <i class="icons bi-arrows-move"></i>
                    {{ $t("ui.desktopResetBounds") }}
                  </button>
                </div>
              </div>
            </div>

            <div class="tab-pane fade" id="config-general">
              <div class="d-flex flex-column mt-2 h-100">
                <div v-if="!isDesktopMode" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="calendarSetting">{{ $t("settings.calendar") }}</label>
                  <input class="form-check-input" type="checkbox" id="calendarSetting" v-model="configData.calendar"
                    @change="changeConfig('calendar', configData.calendar)" />
                </div>

                <div v-if="!isDesktopMode" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="customListsSetting">{{ $t("settings.customLists")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="customListsSetting" v-model="configData.customList"
                    @change="changeConfig('customList', configData.customList)" />
                </div>

                <div v-if="isElectron() && !isDesktopMode"
                  class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="updatesCheckSetting">{{
                    $t("settings.checkUpdates")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="updatesCheckSetting"
                    v-model="configData.checkUpdates" @change="changeConfig('checkUpdates', configData.checkUpdates)" />
                </div>

                <div v-if="isElectron()" class=" form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="openOnStartup">{{
                    $t("settings.openOnStartup")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="openOnStartup" v-model="configData.openOnStartup"
                    @change="setOpenOnStart()" />
                </div>
                <div v-if="isElectron()" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="runInBackground">
                    <span>
                      {{ $t("settings.runInBackground") }}
                      <sup>
                        <i class="bi-info-circle" style="cursor: help" :title="$t('settings.runInBackgroundInfo')"> </i>
                      </sup>
                    </span>
                  </label>
                  <input class="form-check-input" type="checkbox" id="runInBackground"
                    v-model="configData.runInBackground" @change="setRunInBackground()" />
                </div>

              </div>
            </div>
            <div class="tab-pane fade" id="config-behavior">
              <div class="d-flex flex-column mt-2 h-100">
                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="moveOldTasks">{{ $t("settings.moveOldTasks")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="moveOldTasks" v-model="configData.moveOldTasks"
                    @change="changeConfig('moveOldTasks', configData.moveOldTasks)" />
                </div>
                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="wrapTaskText">{{ $t("settings.wrapTaskText")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="wrapTaskText" v-model="configData.wrapTaskText"
                    @change="changeConfig('wrapTaskText', configData.wrapTaskText)" />
                </div>
                <div v-if="!isDesktopMode" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="weekStartOnMonday">{{ $t("settings.weekStartOnMonday")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="weekStartOnMonday" v-model="configData.weekStartOnMonday"
                    @change="changeConfig('weekStartOnMonday', configData.weekStartOnMonday)" />
                </div>
                <div v-if="!isDesktopMode" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="startCalendarYesterday">{{ $t("settings.startCalendarYesterday")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="startCalendarYesterday"
                    v-model="configData.startCalendarYesterday"
                    @change="changeConfig('startCalendarYesterday', configData.startCalendarYesterday)" />
                </div>
                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="autoReorderTasks">{{ $t("settings.autoReorderTasks")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="autoReorderTasks"
                    v-model="configData.autoReorderTasks"
                    @change="changeConfig('autoReorderTasks', configData.autoReorderTasks)" />
                </div>
                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="moveCompletedTaskToBottom">{{
                    $t("settings.moveCompletedTaskToBottom")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="moveCompletedTaskToBottom"
                    v-model="configData.moveCompletedTaskToBottom"
                    @change="changeConfig('moveCompletedTaskToBottom', configData.moveCompletedTaskToBottom)" />
                </div>
                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label flex-fill" for="moveCompletedSubTaskToBottom">{{
                    $t("settings.moveCompletedSubTaskToBottom")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="moveCompletedSubTaskToBottom"
                    v-model="configData.moveCompletedSubTaskToBottom"
                    @change="changeConfig('moveCompletedSubTaskToBottom', configData.moveCompletedSubTaskToBottom)" />
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="config-display">
              <div class="d-flex flex-column mt-2 h-100">


                <div v-if="!isDesktopMode" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="darkThemeSetting">{{
                    $t("settings.darkTheme")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="darkThemeSetting" v-model="configData.darkTheme"
                    @change="changeConfig('darkTheme', configData.darkTheme)" />
                </div>

                <div v-if="isElectron()" class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="darkTrayIcon">{{
                    $t("settings.darkIcon")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="darkTrayIcon" v-model="configData.darkTrayIcon"
                    @change="setDarkTrayIcon" />
                </div>
                <div class="horizontal-divider mb-3"></div>
                <div v-if="!isDesktopMode" class="px-1 mb-3">
                  <label for="columnsConfig" class="form-check-label">{{ $t("settings.columns") }}: {{
                    configData.columns
                  }}</label>
                  <input type="range" class="form-range mt-2 px-2" min="1" max="12" id="columnsConfig"
                    v-model="configData.columns" @change="changeConfig('columns', configData.columns)" />
                </div>

                <div v-if="!isDesktopMode" class="px-1 mb-3">
                  <label for="customColumnsConfig" class="form-check-label">{{ $t("settings.lists_columns") }}: {{
                    configData.customColumns
                  }}</label>
                  <input type="range" class="form-range mt-2 px-2" min="1" max="12" id="customColumnsConfig"
                    v-model="configData.customColumns"
                    @change="changeConfig('customColumns', configData.customColumns)" />
                </div>

                <div class="px-1 mb-3 zoom-config">
                  <label for="zoomConfig" class="form-check-label">{{ $t("settings.zoom") }}: {{ configData.zoom
                  }}%</label>
                  <input type="range" class="form-range mt-2 px-2" min="50" max="200" id="zoomConfig" step="5"
                    v-model="configData.zoom" @change="changeConfig('zoom', configData.zoom)" />
                </div>

                <div class="px-1 mb-3">
                  <label for="fontFamilyConfig" class="form-check-label">{{ $t("settings.fontFamily") }}</label>
                  <select id="fontFamilyConfig" class="form-select mt-2" v-model="configData.fontFamily"
                    @change="changeConfig('fontFamily', configData.fontFamily)">
                    <option value="">{{ $t("settings.systemDefaultFont") }}</option>
                    <option
                      v-if="configData.fontFamily && !systemFonts.includes(configData.fontFamily)"
                      :value="configData.fontFamily"
                    >
                      {{ configData.fontFamily }}
                    </option>
                    <option v-for="font in systemFonts" :key="font" :value="font">{{ font }}</option>
                  </select>

                  <div class="font-control-row">
                    <label for="fontColorConfig" class="form-check-label">{{ $t("settings.fontColor") }}</label>
                    <input
                      id="fontColorConfig"
                      type="color"
                      class="font-color-input"
                      :value="configData.fontColor || '#111827'"
                      @input="changeConfig('fontColor', $event.target.value)"
                    />
                    <button
                      type="button"
                      class="btn font-reset-button"
                      @click="changeConfig('fontColor', '')"
                    >
                      {{ $t("settings.useThemeColor") }}
                    </button>
                  </div>

                  <div class="font-control-row">
                    <label for="fontWeightConfig" class="form-check-label">{{ $t("settings.fontWeight") }}</label>
                    <select
                      id="fontWeightConfig"
                      class="form-select font-weight-select"
                      v-model="configData.fontWeight"
                      @change="changeConfig('fontWeight', configData.fontWeight)"
                    >
                      <option value="300">300</option>
                      <option value="400">400</option>
                      <option value="500">500</option>
                      <option value="600">600</option>
                      <option value="700">700</option>
                      <option value="800">800</option>
                      <option value="900">900</option>
                      <option value="1000">1000</option>
                    </select>
                  </div>

                  <div class="font-preview" :style="fontPreviewStyle">WeekToDo · 每周计划 · Aa 123</div>
                </div>

                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="compactViewSetting">{{
                    $t("settings.compactView")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="compactViewSetting" v-model="configData.compactView"
                    @change="changeConfig('compactView', configData.compactView)" />
                </div>
                <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between">
                  <label class="form-check-label" for="fullscreenToDoModal">{{
                    $t("settings.fullscreenToDoModal")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="fullscreenToDoModal"
                    v-model="configData.fullscreenToDoModal"
                    @change="changeConfig('fullscreenToDoModal', configData.fullscreenToDoModal)" />
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="config-notifications">
              <div class="d-flex flex-column mt-3 h-100">
                <div v-if="isElectron() && !isDesktopMode"
                  class="orm-check form-switch d-flex px-0 mb-3  justify-content-between">
                  <label class="form-check-label" style="margin-left: 0px" for="notificationOnStartup">{{
                    $t("settings.notificationOnStartup")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="notificationOnStartup"
                    v-model="configData.notificationOnStartup"
                    @change="changeConfig('notificationOnStartup', configData.notificationOnStartup)" />
                </div>

                <div class="form-check form-switch d-flex px-0 mb-3  justify-content-between">
                  <label class="form-check-label" style="margin-left: 0px" for="notificationIndicator">{{
                    $t("settings.notificationIndicator")
                  }}</label>
                  <input class="form-check-input" type="checkbox" id="notificationIndicator"
                    v-model="configData.notificationIndicator"
                    @change="changeConfig('notificationIndicator', configData.notificationIndicator)" />
                </div>

                <div class="horizontal-divider mb-3"></div>

                <label for="notificationSound" class="form-label">{{ $t("settings.notificationSound") }}:</label>
                <div class="d-flex">
                  <select id="notificationSound" class="col-sm-9 form-select flex-fill"
                    aria-label="Default select example" v-model="configData.notificationSound" @change="
                      changeConfig('notificationSound', configData.notificationSound)
                      ">
                    <option value="none">None</option>
                    <option value="pop">Pop</option>
                    <option value="bell">Bell</option>
                    <option value="soft-bell">Soft Bell</option>
                    <option value="soft">Soft</option>
                    <option value="tiny">Tiny</option>
                    <option value="piano">Piano</option>
                    <option value="positive">Positive</option>
                    <option value="metal">Metal</option>
                  </select>
                  <button class="btn" style="margin-left: 8px" type="button" @click="playSound">
                    <i class="bi-play-circle a"></i>
                  </button>
                </div>
              </div>


            </div>
            <div class="tab-pane fade" id="config-data">
              <div class="d-flex flex-column mt-2 h-100">
                <div>
                  <div>
                    <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between align-items-center">
                      <label class="form-check-label" for="export-data-btn">{{ $t("settings.exportData") }}</label>
                      <button id="export-data-btn" type="button" class="btn py-1 px-2 border" style="width: 140px;"
                        @click="exportData">
                        <i class="icons bi-cloud-arrow-down mx-2"></i>
                        {{ $t("settings.export") }}
                      </button>
                    </div>

                    <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between align-items-center">
                      <label class="form-check-label" for="import-data-btn">{{ $t("settings.importData") }}</label>
                      <button id="import-data-btn" type="button" class="btn py-1 px-2 border" style="width: 140px;"
                        @click="$refs.loadData.click">
                        <i class="icons bi-cloud-arrow-up mx-2"></i>
                        {{ $t("settings.import") }}
                      </button>
                    </div>

                    <div class="form-check form-switch d-flex px-1 mb-3 justify-content-between align-items-center">
                      <label class="form-check-label" for="clear-data-btn">{{ $t("settings.clearData") }}</label>
                      <button id="clear-data-btn" type="button" class="btn py-1 px-2 border" style="width: 140px;"
                        data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#clearDataModal">
                        <i class="icons bi-x-circle mx-2"></i>
                        {{ $t("settings.clear") }}
                      </button>
                    </div>
                  </div>
                  <input type="file" id="file-selector" class="d-none" accept=".wtdb" ref="loadData"
                    @change="importData($event)" />
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="config-language">
              <div class="d-flex flex-column mt-2 h-100">
                <label for="language" class="form-label">{{ $t("settings.language") }}:</label>
                <select id="language" class="col-sm-9 form-select" aria-label="Default select example"
                  v-model="configData.language" @change="setLanguage">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ru">русский</option>
                  <option value="hi">हिंदी</option>
                  <option value="ja">日本</option>
                  <option value="pl">Polski</option>
                  <option value="ar">عرب</option>
                  <option value="ko">한국어</option>
                  <option value="zh_cn">简体中文</option>
                  <option value="zh_tw">繁體中文</option>
                  <option value="uk">український</option>
                  <option value="tr">Türk</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="he">עִברִית</option>
                </select>
              </div>
            </div>
            <div class="tab-pane fade" id="config-about">
              <div class="d-flex flex-column mt-2 h-100 about-panel">
                <div class="about-title">WeekToDo</div>
                <p class="about-description">{{ $t("settings.aboutDescription") }}</p>
                <dl class="about-list">
                  <dt>{{ $t("settings.aboutVersion") }}</dt>
                  <dd>{{ appInfo.version || "—" }}</dd>
                  <dt>{{ $t("settings.aboutAuthor") }}</dt>
                  <dd>
                    <a href="https://github.com/11HAN" target="_blank" rel="noopener"
                      @click.prevent="openExternal('https://github.com/11HAN')">11HAN</a>
                  </dd>
                  <dt>{{ $t("settings.aboutRepository") }}</dt>
                  <dd>
                    <a href="https://github.com/11HAN/weektodo" target="_blank" rel="noopener"
                      @click.prevent="openExternal('https://github.com/11HAN/weektodo')">11HAN/weektodo</a>
                  </dd>
                  <dt>{{ $t("settings.aboutUpstream") }}</dt>
                  <dd>
                    <a href="https://github.com/manuelernestog/weektodo" target="_blank" rel="noopener"
                      @click.prevent="openExternal('https://github.com/manuelernestog/weektodo')">manuelernestog/weektodo</a>
                  </dd>
                  <dt>{{ $t("settings.aboutLicense") }}</dt>
                  <dd>GPL-3.0</dd>
                  <dt>{{ $t("settings.aboutBuiltWith") }}</dt>
                  <dd>Electron {{ appInfo.electron || "—" }} · Chromium {{ appInfo.chrome || "—" }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1056">
      <toast-message ref="invalidFile" id="invalidFile" text="$t('settings.invalidFile')"></toast-message>
    </div>
  </div>
</template>

<script>
import configRepository from "../repositories/configRepository";
import toastMessage from "../components/toastMessage";
import exportTool from "../helpers/exportTool";
import linkList from "../components/linkList";
import configList from "./configList";
import notifications from "../helpers/notifications";
import { Modal } from "bootstrap";
import { IS_DESKTOP_MODE, IS_DESKTOP_SETTINGS_WINDOW } from "../helpers/desktopMode";
import { DESKTOP_THEMES } from "../helpers/desktopThemes";

export default {
  name: "configModal",
  components: { toastMessage, linkList },
  props: {
    configProp: { required: true },
  },
  data() {
    return {
      configData: this.$store.getters.config,
      desktopThemes: DESKTOP_THEMES,
      activeLink: "config-desktop-widget-tab",
      systemFonts: [],
      appInfo: { version: "", electron: "", chrome: "" },
    };
  },
  mounted() {
    this.tabShownHandler = (event) => {
      if (event.target && event.target.id) this.activeLink = event.target.id;
    };
    document.addEventListener("shown.bs.tab", this.tabShownHandler);

    if (typeof this.configData.fontFamily !== "string") {
      this.changeConfig("fontFamily", "");
    }
    if (typeof this.configData.fontColor !== "string") {
      this.changeConfig("fontColor", "");
    }
    if (typeof this.configData.fontWeight !== "string") {
      this.changeConfig("fontWeight", "400");
    }

    if (this.isElectron()) {
      try {
        const { ipcRenderer } = require("electron");
        ipcRenderer
          .invoke("get-system-fonts")
          .then((fonts) => {
            this.systemFonts = Array.isArray(fonts) ? fonts : [];
          })
          .catch(() => {
            this.systemFonts = [];
          });
        ipcRenderer
          .invoke("get-app-info")
          .then((info) => {
            if (info) this.appInfo = info;
          })
          .catch(() => {});
      } catch (error) {
        this.systemFonts = [];
      }
    }

    if (!this.isDesktopMode) return;
    if (!this.configData.desktopTheme) {
      this.changeConfig("desktopTheme", "frosted-white");
    }
    if (typeof this.configData.desktopOpacity !== "number") {
      this.changeConfig("desktopOpacity", 0.68);
    }
    if (typeof this.configData.desktopLocked !== "boolean") {
      this.changeConfig("desktopLocked", false);
    }
    if (typeof this.configData.weekStartOnMonday !== "boolean") {
      this.changeConfig("weekStartOnMonday", true);
    }
  },
  beforeUnmount() {
    if (this.tabShownHandler) {
      document.removeEventListener("shown.bs.tab", this.tabShownHandler);
    }
  },
  methods: {
    changeConfig: function (key, val) {
      this.$nextTick(function () {
        this.$store.commit("updateConfig", { val: val, key: key });
        configRepository.update(this.$store.getters.config);
        if (key === "language") this.$i18n.locale = this.configData.language;
        if (key === "columns") {
          setTimeout(
            function () {
              this.$emit("changeColumns");
            }.bind(this),
            50
          );
        }
      });
    },
    exportData: function () {
      let configModal = Modal.getOrCreateInstance(document.getElementById("configModal"));
      if (!this.isDesktopSettingsWindow) configModal.hide();
      let exportingModal = new Modal(document.getElementById("exportingModal"), { backdrop: "static" });
      exportingModal.show();
      exportTool.export();
    },
    importData: function (event) {
      let configModal = Modal.getOrCreateInstance(document.getElementById("configModal"));
      if (!this.isDesktopSettingsWindow) configModal.hide();
      let importingModal = new Modal(document.getElementById("importingModal"), { backdrop: "static" });
      importingModal.show();
      exportTool.import(event);
    },
    isElectron: function () {
      let isElectron = require("is-electron");
      return isElectron();
    },
    openExternal: function (url) {
      if (this.isElectron()) {
        require("electron").shell.openExternal(url);
      } else {
        window.open(url, "_blank");
      }
    },
    goHome: function () {
      document.getElementById("config-home-tab").click();
    },
    setOpenOnStart: function () {
      this.changeConfig("openOnStartup", this.configData.openOnStartup);
      this.$nextTick(function () {
        if (this.isElectron()) {
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('set-open-on-startup', this.configData.openOnStartup);
        }
      });
    },
    setRunInBackground: function () {
      this.changeConfig("runInBackground", this.configData.runInBackground);
      this.$nextTick(function () {
        if (this.isElectron()) {
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('set-run-in-background', this.configData.runInBackground);
        }
      });
    },
    setLanguage: function () {
      this.changeConfig('language', this.configData.language);
      this.$nextTick(function () {
        if (this.isElectron()) {
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('set-tray-context-menu-label', { open: this.$t("ui.open"), quit: this.$t("ui.quit") });
        }
      });
    },
    resetDesktopBounds: function () {
      if (!this.isElectron()) return;
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("desktop-widget-reset-bounds");
    },
    setDarkTrayIcon: function () {
      this.changeConfig('darkTrayIcon', this.configData.darkTrayIcon);
      this.$nextTick(function () {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('set-dark-tray-icon', this.configData.darkTrayIcon);
      });
    },
    playSound: function () {
      notifications.playNotificationSound(
        this.$store.getters.config.notificationSound
      );
    },
  },
  computed: {
    isDesktopMode: function () {
      return IS_DESKTOP_MODE;
    },
    isDesktopSettingsWindow: function () {
      return IS_DESKTOP_SETTINGS_WINDOW;
    },
    fontPreviewStyle: function () {
      const font = String(this.configData.fontFamily || "")
        .replace(/["\\]/g, "")
        .trim();
      const style = {};
      if (font) {
        style.fontFamily = `"${font}", "Segoe UI", system-ui, sans-serif`;
      }
      if (this.configData.fontColor) style.color = this.configData.fontColor;
      if (this.configData.fontWeight) style.fontWeight = this.configData.fontWeight;
      return style;
    },
    configLinks: function () {
      return configList.configList(this);
    },
  },
  watch: {
    configProp: function (newVal) {
      this.configData = newVal;
    },
  },
};
</script>

<style scoped lang="scss">
@import "../assets/style/globalVars";

.form-check-input {
  width: 2.8em !important;
  height: 1.4em !important;
}

#config-links-menu {
  max-height: 400px;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.06);

.dark-theme & {
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}
}

.config-tab-content {
  height: 400px;
  overflow-y: auto;
}

@media (max-height: 560px) {
  .config-tab-content,
  #config-links-menu {
    height: max(160px, calc(100vh - 150px));
    max-height: max(160px, calc(100vh - 150px));
  }
}

.desktop-settings-heading {
  margin-bottom: 9px;
  color: var(--dw-text, inherit);
  font-size: 0.82rem;
  font-weight: 700;
}

.desktop-settings-choices {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.desktop-settings-choice {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 7px 10px;
  color: var(--dw-muted, inherit);
  font-size: 0.8rem;
  border: 1px solid var(--dw-border, rgba(0, 0, 0, 0.12));
  border-radius: 9px;
  cursor: pointer;
}

.desktop-settings-choice:has(input:checked) {
  color: var(--dw-text, inherit);
  border-color: var(--dw-accent, #3b82f6);
  background: var(--dw-accent-soft, rgba(59, 130, 246, 0.12));
}

.desktop-settings-choice input {
  accent-color: var(--dw-accent, #3b82f6);
}

.desktop-settings-hint {
  margin-bottom: 0;
  color: var(--dw-muted, #6b7280);
  font-size: 0.74rem;
  line-height: 1.35;
}

.desktop-settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.desktop-settings-button {
  flex: 0 0 auto;
  padding: 5px 10px;
  color: var(--dw-text, inherit);
  font-size: 0.76rem;
  white-space: nowrap;
  background: var(--dw-accent-soft, rgba(59, 130, 246, 0.12));
  border: 1px solid var(--dw-border, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
}

.desktop-settings-button:hover {
  color: var(--dw-text, inherit);
  border-color: var(--dw-accent, #3b82f6);
}

.font-preview {
  margin-top: 8px;
  padding: 8px 10px;
  color: #374151;
  font-size: 0.85rem;
  line-height: 1.45;
  border: 1px dashed rgba(15, 23, 42, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.35);
}

.font-control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.font-control-row .form-check-label {
  flex: 0 0 86px;
  margin-left: 0;
  padding-top: 0;
}

.font-color-input {
  width: 42px;
  height: 30px;
  padding: 2px;
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 7px;
  cursor: pointer;
}

.font-reset-button {
  padding: 4px 10px;
  color: #374151;
  font-size: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.5);
}

.font-weight-select {
  width: 110px;
}

.dark-theme .font-preview {
  color: #c9d1d9;
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

.dark-theme .font-color-input,
.dark-theme .font-reset-button {
  color: #c9d1d9;
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
}


.icons {
  font-size: 18px;
  margin-right: 5px;
}

.form-check-label {
  margin-left: 10px;
  padding-top: 5px;
}

.dark-theme .form-select {
  background-color: #15161e;
  border: 1px solid #30363d;
  color: #c9d1d9;
}

.form-select:focus {
  box-shadow: none;
}

.modal-dialog {
  max-width: 800px;
  max-height: 500px;
}

.form-range::-webkit-slider-thumb {
  background: $check-color;

  .dark-theme & {
    background: $dt-check-color;
  }
}

.form-range::-webkit-slider-thumb {
  background: $check-color;

  .dark-theme & {
    background: $dt-check-color;
  }
}

.form-range::-ms-thumb {
  background: $check-color;

  .dark-theme & {
    background: $dt-check-color;
  }
}


@-moz-document url-prefix() {
  .zoom-config {
    display: none;
  }
}
.about-panel {
  max-width: 620px;
  padding: 4px 2px;
}

.about-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--dw-text, inherit);
}

.about-description {
  margin: 4px 0 20px;
  color: var(--dw-muted, #6b7280);
}

.about-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 10px 18px;
  margin: 0;
}

.about-list dt {
  font-weight: 500;
  color: var(--dw-text, #374151);
}

.about-list dd {
  margin: 0;
  color: var(--dw-text, #111827);
  overflow-wrap: anywhere;
}

.about-list a {
  color: var(--dw-accent, #2563eb);
  text-decoration: none;
}

.about-list a:hover {
  text-decoration: underline;
}
</style>