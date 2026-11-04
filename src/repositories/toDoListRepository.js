import dbRepository from "./dbRepository";
import { notifyTodoListChanged } from "../helpers/desktopSync";

export default {
  update(toDoListId, toDoList) {
    let db_req = dbRepository.open();
    db_req.onsuccess = function (event) {
      let db = event.target.result;
      let update_req = dbRepository.update(db, "todo_lists", toDoListId, toDoList);
      update_req.onsuccess = function () {
        notifyTodoListChanged(toDoListId);
      };
    };
  },
  remove(toDoListId) {
    let db_req = dbRepository.open();
    db_req.onsuccess = function (event) {
      let db = event.target.result;
      let delete_req = dbRepository.delete(db, "todo_lists", toDoListId);
      delete_req.onsuccess = function () {
        notifyTodoListChanged(toDoListId);
      };
    };
  },
};
