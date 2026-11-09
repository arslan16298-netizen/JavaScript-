// Расширение (вариант А): поиск задач по названию.
// Контракты девяти основных функций не меняются, это отдельный модуль.

// searchTasks(tasks, query) -> новый массив задач, порядок сохраняется.
//   - запрос обрезается по краям (trim);
//   - поиск без учёта регистра по вхождению (toLowerCase + includes);
//   - пустой или пробельный запрос возвращает все задачи (копию массива);
//   - если query не строка, возвращается пустой массив: это не запрос, а ошибка вызова;
//   - объекты задач не копируются и не изменяются.
export function searchTasks(tasks, query) {
  if (typeof query !== "string") return [];
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...tasks];
  return tasks.filter((task) => task.title.toLowerCase().includes(needle));
}
