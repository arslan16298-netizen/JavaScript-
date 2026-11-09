// Расширение (вариант А): черновик полей формы создания.
// Хранится отдельным ключом (ключ задач + ":draft"), не смешивается со списком задач.
// Формат: { version: 1, draft: { id, title, priority } }, все значения — строки из полей формы.
// Как и в task-storage.js, storage передаётся аргументом, а исключения наружу не выпускаются.

export const DRAFT_VERSION = 1;
const PRIORITIES = ["low", "medium", "high"];

export function isValidDraft(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" && value.id.length <= 32 &&
    typeof value.title === "string" && value.title.length <= 100 &&
    PRIORITIES.includes(value.priority)
  );
}

// Результат: { ok: true, draft: null } — черновика нет;
//            { ok: true, draft: {...} } — черновик восстановлен;
//            { ok: false, draft: null, error } — запись есть, но повреждена или недоступна.
export function loadDraft(storage, key) {
  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return { ok: false, draft: null, error: `Не удалось прочитать черновик: ${error.message}` };
  }
  if (raw === null) return { ok: true, draft: null };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, draft: null, error: "Черновик повреждён (не JSON) и будет удалён." };
  }
  if (data === null || typeof data !== "object" || data.version !== DRAFT_VERSION || !isValidDraft(data.draft)) {
    return { ok: false, draft: null, error: "Черновик имеет неверный формат и будет удалён." };
  }
  const { id, title, priority } = data.draft;
  return { ok: true, draft: { id, title, priority } };
}

export function saveDraft(storage, key, draft) {
  if (!isValidDraft(draft)) return { ok: false, error: "Черновик не прошёл проверку, запись отменена." };
  try {
    storage.setItem(key, JSON.stringify({ version: DRAFT_VERSION, draft }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить черновик: ${error.message}` };
  }
}

export function removeDraft(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить черновик: ${error.message}` };
  }
}
