"use strict";

// Задание 5. ИСХОДНАЯ версия с ошибками (до отладки). Хранится для отчёта.
// Рабочая исправленная версия лежит в debug.js.
const completedMorning = "3";
const completedEvening = "2";
const totalTasks = "8";

const completedTotal = completedMorning + completedEvening;
const remaining = totalTasks - completedTotal;

let controlSum = 0;
for (let taskNumber = 1; taskNumber < 4; taskNumber++) {
  controlSum += taskNumber;
}

console.log("Выполнено: " + completedTotal);
console.log("Осталось: " + remaining);
console.log("Контрольная сумма: " + controlSum);
