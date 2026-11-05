export default {
  pendingTasksCount(todoList) {
    if (todoList == null || typeof(todoList) === "undefined") return 0;
    return todoList.filter((todo) => !todo.checked && !todo.failed).length;
  },
  reorderTasksList(toDoList) {
    var array = toDoList;
    const statusRank = (todo) => (todo.checked ? 2 : todo.failed ? 1 : 0);
    array.sort(function (a, b) {
      if (statusRank(b) != statusRank(a)) {
        return statusRank(a) - statusRank(b);
      }
      if (b.time != a.time) {
        if (b.time == null) return -1;
        if (a.time == null) return 1;
      }
      if (b.time < a.time) return 1;
      if (b.time > a.time) return -1;
    });
    return array;
  },
};
