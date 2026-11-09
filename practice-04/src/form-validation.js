import { findTaskById } from "./task-service.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_TITLE_LENGTH = 100;

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority } — значения из полей формы (обычно строки).
// editingId: null (создание) либо id редактируемой задачи.
// Успех: { ok: true, value: { id, title, priority } }
// Отказ: { ok: false, errors: { id?: "...", title?: "...", priority?: "..." } }
// Функция ничего не меняет: ни draft, ни список, ни DOM, ни localStorage.

// Превращает значение поля id в число или возвращает текст ошибки.
// Пустая строка не превращается в 0, а "4abc" не превращается в 4.
function parseId(raw) {
  if (typeof raw === "number") {
    if (!Number.isSafeInteger(raw) || raw <= 0) return { error: "Идентификатор должен быть положительным целым числом" };
    return { id: raw };
  }
  if (typeof raw !== "string") return { error: "Укажите идентификатор" };
  const text = raw.trim();
  if (text === "") return { error: "Укажите идентификатор" };
  // Только цифры: так не проходят "1.5", "-1", "1e3", "+5" и "4abc".
  if (!/^[0-9]+$/.test(text)) return { error: "Идентификатор должен быть положительным целым числом" };
  const id = Number(text);
  if (!Number.isSafeInteger(id)) return { error: "Идентификатор слишком большой" };
  if (id <= 0) return { error: "Идентификатор должен быть больше нуля" };
  return { id };
}

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;

  if (editingId === null) {
    // Создание: id берётся из формы и должен быть свободен.
    const parsed = parseId(draft.id);
    if (parsed.error !== undefined) {
      errors.id = parsed.error;
    } else if (findTaskById(tasks, parsed.id) !== undefined) {
      errors.id = `Задача с id ${parsed.id} уже существует`;
    } else {
      id = parsed.id;
    }
  } else if (findTaskById(tasks, editingId) === undefined) {
    // Редактирование: id берётся из editingId, поле формы заблокировано и в draft его может не быть.
    // Совпадение с редактируемой задачей дубликатом не считается.
    errors.id = `Редактируемая задача с id ${editingId} не найдена`;
  } else {
    id = editingId;
  }

  let title;
  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();
    if (title.length === 0) {
      errors.title = "Название не должно быть пустым";
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `Название не длиннее ${MAX_TITLE_LENGTH} символов (сейчас ${title.length})`;
    }
  }

  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id, title, priority: draft.priority } };
}
