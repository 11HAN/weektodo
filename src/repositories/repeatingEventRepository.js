import dbRepository from "./dbRepository";
import { notifyDataChanged } from "../helpers/desktopSync";

export default {
  update(repeatingEventId, repeatingEvent) {
    let db_req = dbRepository.open();
    db_req.onsuccess = function (event) {
      let db = event.target.result;
      let update_req = dbRepository.update(db, "repeating_events", repeatingEventId, repeatingEvent);
      update_req.onsuccess = function () {
        notifyDataChanged();
      };
    };
  },
  remove(repeatingEventId) {
    let db_req = dbRepository.open();
    db_req.onsuccess = function (event) {
      let db = event.target.result;
      let delete_req = dbRepository.delete(db, "repeating_events", repeatingEventId);
      delete_req.onsuccess = function () {
        notifyDataChanged();
      };
    };
  },
};
