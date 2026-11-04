import dbRepository from "./dbRepository";
import { notifyDataChanged } from "../helpers/desktopSync";

export default {
    update(date, generatedRepeatingEvents) {
        let db_req = dbRepository.open();
        db_req.onsuccess = function (event) {
            let db = event.target.result;
            let update_req = dbRepository.update(db, 'repeating_events_by_date', date, generatedRepeatingEvents)
            update_req.onsuccess = function () {
                notifyDataChanged();
            }
        }
    },
    remove(date) {
        let db_req = dbRepository.open();
        db_req.onsuccess = function (event) {
            let db = event.target.result;
            let delete_req = dbRepository.delete(db, 'repeating_events_by_date', date)
            delete_req.onsuccess = function () {
                notifyDataChanged();
            }
        }
    }
};