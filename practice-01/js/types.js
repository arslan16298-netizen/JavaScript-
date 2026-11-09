"use strict";

// Задание 2. Типы и преобразования.
// Сначала в отчёте записан прогноз, потом файл запущен.
// Для каждого выражения выводится значение и тип результата.
// Все результаты хранятся в разных const, повторяющихся имён нет.

const r1 = "8" + 2;
const r2 = "8" - 2;
const r3 = Number("8") + 2;
const r4 = "12" > "3";
const r5 = 12 === "12";
const r6 = Number("");
const r7 = Number("text");
const r8 = Boolean("false");
// Для строк 9 и 10 важно различать две вещи:
// значение выражения typeof ... (это строка) и тип этого результата (тоже string).
const r9 = typeof null;
const r10 = typeof NaN;

console.log('1.  "8" + 2          ->', r1, "| тип:", typeof r1);
console.log('2.  "8" - 2          ->', r2, "| тип:", typeof r2);
console.log('3.  Number("8") + 2  ->', r3, "| тип:", typeof r3);
console.log('4.  "12" > "3"       ->', r4, "| тип:", typeof r4);
console.log('5.  12 === "12"      ->', r5, "| тип:", typeof r5);
console.log('6.  Number("")       ->', r6, "| тип:", typeof r6);
console.log('7.  Number("text")   ->', r7, "| тип:", typeof r7);
console.log('8.  Boolean("false") ->', r8, "| тип:", typeof r8);
console.log('9.  typeof null      ->', r9, "| тип:", typeof r9);
console.log('10. typeof NaN       ->', r10, "| тип:", typeof r10);
