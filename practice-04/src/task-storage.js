export const STORAGE_VERSION = 1;

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage (в Node.js его нет).
// Хранится строка JSON вида { version: 1, tasks: [...] }.
// Любые данные, прочитанные из хранилища, считаются недоверенными: их мог изменить
// пользователь, другая версия приложения или сбой записи.

const PRIORITIES = ["low", "medium", "high"];

function isValidTask(task) {
  return (
    task !== null &&
    typeof task === "object" &&
    Number.isSafeInteger(task.id) &&
    task.id > 0 &&
    typeof task.title === "string" &&
    task.title.trim().length >= 1 &&
    task.title.trim().length <= 100 &&
    typeof task.completed === "boolean" &&
    PRIORITIES.includes(task.priority)
  );
}

// Проверяет весь массив и уникальность id. Ничего не исправляет и не меняет.
export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  if (!value.every(isValidTask)) return false;
  return new Set(value.map((task) => task.id)).size === value.length;
}

// Копия только известных полей: лишние поля из JSON в приложение не попадают.
function copyTasks(tasks) {
  return tasks.map(({ id, title, completed, priority }) => ({ id, title, completed, priority }));
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = (error) => ({ ok: false, source: "fallback", tasks: copyTasks(fallbackTasks), error });

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return fallback(`Не удалось прочитать localStorage: ${error.message}. Используется исходный набор.`);
  }
  if (raw === null) return { ok: true, source: "initial", tasks: copyTasks(fallbackTasks) };

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return fallback("Сохранённые данные повреждены (не удалось разобрать JSON). Используется исходный набор.");
  }
  if (data === null || typeof data !== "object" || data.version !== STORAGE_VERSION) {
    return fallback("Сохранённые данные имеют неизвестную версию формата. Используется исходный набор.");
  }
  if (!isValidTaskList(data.tasks)) {
    return fallback("Сохранённые задачи не соответствуют схеме. Используется исходный набор.");
  }
  return { ok: true, source: "storage", tasks: copyTasks(data.tasks) };
}

export function saveTasks(storage, key, tasks) {
  // Некорректный список не записывается, чтобы не испортить хорошую запись плохой.
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач не прошёл проверку, запись отменена." };
  }
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    // Например, переполнение (QuotaExceededError) или запрет записи.
    return { ok: false, error: `Не удалось сохранить в localStorage: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key); // только переданный ключ; clear() не используется
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
}
