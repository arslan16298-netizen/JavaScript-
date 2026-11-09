// Модуль отбора задач. Вход: корректный массив задач и фильтр all / pending / completed.
// Результат: новый массив; исходный порядок и сами объекты задач сохраняются.
// Исходный массив не изменяется: filter и spread создают новые массивы.

export const STATUS_FILTERS = ["all", "pending", "completed"];

export function getVisibleTasks(tasks, filter = "all") {
  switch (filter) {
    case "all":
      return [...tasks];
    case "pending":
      return tasks.filter((task) => task.completed === false);
    case "completed":
      return tasks.filter((task) => task.completed === true);
    default:
      // Значение фильтра приходит из кода (main.js уже отсёк чужие значения),
      // поэтому неизвестный фильтр — ошибка программиста, а не ввод пользователя.
      throw new Error(`Неизвестный фильтр: ${filter}`);
  }
}

// Расширение (вариант А): отбор по приоритету. Работает вместе с фильтром статуса:
// сначала getVisibleTasks, потом filterByPriority.
export const PRIORITY_FILTERS = ["all", "low", "medium", "high"];

export function filterByPriority(tasks, priority = "all") {
  if (!PRIORITY_FILTERS.includes(priority)) {
    throw new Error(`Неизвестный приоритет: ${priority}`);
  }
  if (priority === "all") return [...tasks];
  return tasks.filter((task) => task.priority === priority);
}
