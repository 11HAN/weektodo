import storageRepository from "./storageRepository";
import version_json from "../../public/version.json";
import moment from "moment";
import { notifyConfigChanged } from "../helpers/desktopSync";

export default {
  load() {
    let config = storageRepository.get("config");
    if (config) {
      return config;
    } else {
      let default_config = {
        darkTheme: false,
        customList: true,
        calendar: true,
        firstTimeOpen: true,
        language: "en",
        version: version_json.version,
        checkUpdates: true,
        columns: 5,
        customColumns: 5,
        zoom: 100,
        calendarHeight: "calc(50% - 50px)",
        notificationOnStartup: true,
        notificationSound: "pop",
        openOnStartup: true,
        runInBackground: true,
        moveOldTasks: true,
        dateToShowInitialDonateModal: moment().add(15, "d").format("YYYY-MM-DD"),
        InitialDonateModalShown: false,
        mainDividerPosition: 1,
        darkTrayIcon: false,
        importing: false,
        compactView: true,
        wrapTaskText: false,
        fontFamily: "",
        fontColor: "",
        fontWeight: "400",
        startCalendarYesterday: false,
        notificationIndicator: true,
        autoReorderTasks: false,
        moveCompletedTaskToBottom: true,
        moveCompletedSubTaskToBottom: true,
        fullscreenToDoModal: false,
        desktopTheme: "frosted-white",
        desktopOpacity: 0.68,
        desktopLocked: false,
        weekStartOnMonday: true,
        lastDayOpened: moment().format("YYYY-MM-DD")
      };
      storageRepository.set("config", default_config);
      return default_config;
    }
  },
  update(config) {
    storageRepository.set("config", config);
    notifyConfigChanged(config);
  },
};
