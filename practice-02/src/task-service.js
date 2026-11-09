// Логика работы со списком задач. Модуль не выводит ничего в консоль,
// не обращается к document и не хранит собственного состояния:
// все данные приходят аргументами, а результат возвращается через return.
//
// Модель задачи: { id, title, completed, priority }
//   id        — положительное безопасное целое число
//   title     — строка, после trim() длиной от 1 до 100 символов
//   completed — boolean
//   priority  — "low" | "medium" | "high"
//
// Операции, которые могут не получиться, возвращают объект:
//   успех:  { ok: true, ... }
//   отказ:  { ok: false, error: "текст причины" }
// Ожидаемые ошибки (плохой ввод) — это отказ, а не исключение.

const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

// ---------- Внутренние проверки (не экспортируются) ----------
// Каждая возвращает текст ошибки или null, если всё в порядке.
// Сначала проверяется тип, потом ограничения. Строки в числа не превращаются.

function checkId(id) {
  if (typeof id !== "number") return "id должен быть числом";
  if (!Number.isSafeInteger(id)) return "id должен быть целым безопасным числом";
  if (id <= 0) return "id должен быть положительным";
  return null;
}

function checkTitle(title) {
  if (typeof title !== "string") return "Название должно быть строкой";
  const length = title.trim().length;
  if (length === 0) return "Название не должно быть пустым";
  if (length > MAX_TITLE_LENGTH) return `Название длиннее ${MAX_TITLE_LENGTH} символов`;
  return null;
}

function checkPriority(priority) {
  // includes сравнивает строго, поэтому "HIGH" и " high " не проходят.
  // null не заменяется значением по умолчанию: оно срабатывает только для undefined.
  if (!PRIORITIES.includes(priority)) return "Приоритет должен быть low, medium или high";
  return null;
}

function checkCompleted(completed) {
  if (typeof completed !== "boolean") return "completed должен быть true или false";
  return null;
}

function fail(error) {
  return { ok: false, error };
}

// ---------- Создание ----------

export function createTask(id, title, priority = "medium") {
  const error = checkId(id) ?? checkTitle(title) ?? checkPriority(priority);
  if (error !== null) return fail(error);
  // Каждый вызов создаёт новый объект; при создании задача всегда не выполнена.
  return { ok: true, task: { id, title: title.trim(), completed: false, priority } };
}

// ---------- Чтение ----------

export function findTaskById(tasks, id) {
  // Строгое сравнение: "4" не равно 4. Если не найдено, find вернёт undefined.
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  // Прогресс — число без округления; для пустого списка 0, чтобы не получить NaN.
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
}

// ---------- Изменение (исходный массив и объекты никогда не меняются) ----------

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;
  // Уникальность id проверяется здесь, а не в createTask: у createTask нет доступа к списку.
  if (findTaskById(tasks, id) !== undefined) return fail(`Задача с id ${id} уже существует`);
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const error = checkId(id) ?? checkCompleted(completed);
  if (error !== null) return fail(error);
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена`);
  // map создаёт новый массив; у нужной задачи новый объект, остальные поля копируются spread'ом.
  return {
    ok: true,
    tasks: tasks.map((task) => (task.id === id ? { ...task, completed } : task)),
  };
}

export function renameTask(tasks, id, title) {
  const error = checkId(id) ?? checkTitle(title);
  if (error !== null) return fail(error);
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена`);
  return {
    ok: true,
    tasks: tasks.map((task) => (task.id === id ? { ...task, title: title.trim() } : task)),
  };
}

export function removeTask(tasks, id) {
  const error = checkId(id);
  if (error !== null) return fail(error);
  if (findTaskById(tasks, id) === undefined) return fail(`Задача с id ${id} не найдена`);
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
