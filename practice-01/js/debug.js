"use strict";

// Задание 5. Поиск ошибок через DevTools.
// ИСПРАВЛЕННАЯ ВЕРСИЯ. Исходная версия с ошибками приведена в README (раздел «Отладка»).
// Данные приходят строками, как будто их прочитали из полей формы.
const completedMorning = "3";
const completedEvening = "2";
const totalTasks = "8";

// Ошибка 1 была здесь: "3" + "2" давало строку "32".
// Исправление: сначала Number(), потом сложение.
const completedTotal = Number(completedMorning) + Number(completedEvening);

// Ошибка 2: вычитание "8" - "32" работало через скрытое приведение типов и дало -24.
// Теперь оба операнда явно числа, и результат читается однозначно.
const remaining = Number(totalTasks) - completedTotal;

// Ошибка 3 была в условии цикла: taskNumber < 4 не включало число 4.
let controlSum = 0;
for (let taskNumber = 1; taskNumber <= 4; taskNumber++) {
  controlSum += taskNumber;
}

console.log("Выполнено: " + completedTotal);
console.log("Осталось: " + remaining);
console.log("Контрольная сумма: " + controlSum);
