// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Индивидуальный вариант. Номер в журнале N = 2, поэтому ((2 - 1) % 8) + 1 = 2.
// Тема варианта 2: «Подготовка выступления». K = 1: первая задача выполнена, остальные нет.
// Идентификаторы по порядку: 11, 23, 37, 41, 58, 64. Приоритеты: low, medium и high.
export const variantNumber = 2;
export const variantTasks = [
  { id: 11, title: "Выбрать тему выступления", completed: true, priority: "medium" },
  { id: 23, title: "Составить план доклада", completed: false, priority: "high" },
  { id: 37, title: "Подготовить слайды", completed: false, priority: "high" },
  { id: 41, title: "Отрепетировать выступление", completed: false, priority: "medium" },
  { id: 58, title: "Проверить проектор и ноутбук", completed: false, priority: "low" },
  { id: 64, title: "Подготовить ответы на вопросы", completed: false, priority: "low" },
];
