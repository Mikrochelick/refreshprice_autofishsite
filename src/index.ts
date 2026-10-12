import { prismaHP } from "./prismaHP";
import { recalculateActivePrice } from "./recalculateActivePrice";

async function main(): Promise<void> {
  if (!process.env.DATABASE_HP_URL) {
    throw new Error("Переменная окружения DATABASE_HP_URL не задана");
  }

  console.log("=== Car price recalculator ===");
  console.log(`Старт: ${new Date().toISOString()}`);

  await prismaHP.$connect();

  const result = await recalculateActivePrice();

  console.log("=== Итог ===");
  console.log(`Всего автомобилей: ${result.totalVehicles}`);
  console.log(`Успешно пересчитано: ${result.successfullyRecalculated}`);
  console.log(`Автомобилей с ошибками: ${result.errorCount}`);
  console.log(`Ошибки топлива: ${result.fuelErrors}`);
  console.log(`Ошибки объёма двигателя: ${result.engineErrors}`);
  console.log(`Ошибки даты: ${result.dateErrors}`);
  console.log(`Ошибки цены: ${result.priceErrors}`);
  console.log(`Ошибки л.с.: ${result.horsePowerErrors}`);
  console.log(`Ошибки расчёта: ${result.calculationErrors}`);
  console.log(`Ошибки обновления БД: ${result.updateErrors}`);
  console.log(`Завершение: ${new Date().toISOString()}`);
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("Критическая ошибка:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaHP.$disconnect();
  });
