"use strict";

// Задание 1. Первая программа: данные студента и среда запуска.
const studentName = "Ахметгалиев Арслан Альбертович";
const groupName = "ЭФБО-17-25";
const practiceNumber = 1;

console.log("Студент: " + studentName);
console.log("Группа: " + groupName);
console.log("Практическая работа №" + practiceNumber);
console.log("Программа успешно запущена");
// В браузере document есть (object), в Node.js его нет (undefined).
console.log("typeof document: " + typeof document);
