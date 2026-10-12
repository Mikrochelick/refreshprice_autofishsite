import { prismaHP } from "./prismaHP";
import { validateNumber } from "./calculations/validateNumber";
import { validateDate } from "./calculations/validateDate";
import { validateString } from "./calculations/validateString";
import { NoProhodCar } from "./calculations/is-no-prohod-car";
import { calculationCar } from "./calculations/calculationCar";

interface VehicleUpdate {
  vehicle_id: number;
  total_price_rub: number;
  detailed_calculation: {
      priceCarInRubles: number;
      expensesInKoreaInRubles: number;
      customsOformlenie: number;
      utilOrdinary: number;
      poshlinaOrdinary: number;
      broker: number;
      company_comission: number;
      expensesInRussia: number;
      totalExpensesInKoreaInRubles: number;
      totalPriceInRubles: number;
      utilProhod: number | null | undefined;
      poshlinaProhod: number | null | undefined;
      totalPriceInRublesProhod: number | null | undefined;
      expensesInRussiaProhod: number | null | undefined;
  };
}

interface VehicleErrorInfo {
  vehicle_id: number;               // ID автомобиля
  noFuel: boolean;                 // ошибка валидации топлива
  noEngine: boolean;              // ошибка валидации объёма
  noDate: boolean;               // ошибка валидации даты
  noPrice: boolean;             // ошибка валидации цены
  noHorsePower: boolean;       // ошибка валидации ЛС (не критична)
  calculationFailed: boolean; // ошибка при расчёте цены
  updateFailed: boolean;     // ошибка при сохранении в БД
  errorMessages?: {         // детальные сообщения (опционально)
    fuel?: string;
    engine?: string;
    date?: string;
    price?: string;
    horsePower?: string;
    calculation?: string;
    update?: string;
  };
}

interface BatchRecalcResult {
  totalVehicles: number;                // всего автомобилей с такой комбинацией
  successfullyRecalculated: number;    // сколько успешно обновлено в БД
  errorCount: number;                 // количество автомобилей с хотя бы одной ошибкой
  problemVehicles: VehicleErrorInfo[]; // массив проблемных авто (все ошибки)
  fuelErrors: number;
  engineErrors: number;
  dateErrors: number;
  priceErrors: number;
  calculationErrors: number;
  horsePowerErrors: number;
  updateErrors: number;      // добавим счётчик ошибок обновления
  otherErrors: number;      // прочие ошибки
  cbrError: string;        // если не пусто – пересчёт не выполнялся
}

function findOrCreateErrorRecord(
  problemVehicles: VehicleErrorInfo[],
  vehicle_id: number
): number {
  let index = problemVehicles.findIndex((p) => p.vehicle_id === vehicle_id);
  if (index === -1) {
    const newRecord: VehicleErrorInfo = {
      vehicle_id,
      noFuel: false,
      noEngine: false,
      noDate: false,
      noPrice: false,
      noHorsePower: false,
      calculationFailed: false,
      updateFailed: false,
      errorMessages: {},
    };
    problemVehicles.push(newRecord);
    index = problemVehicles.length - 1;
  }
  return index;
}



async function updateVehiclesInBatch(
  updates: VehicleUpdate[]
): Promise<{
  successCount: number;
  failedUpdates: { vehicle_id: number; error: string }[];
}> {
  const result = {
    successCount: 0,
    failedUpdates: [] as { vehicle_id: number; error: string }[],
  };

  if (updates.length === 0) return result;

  const BATCH_UPDATE_SIZE = 100;
  for (let i = 0; i < updates.length; i += BATCH_UPDATE_SIZE) {
    const batch = updates.slice(i, i + BATCH_UPDATE_SIZE);

    try {
      const updatePromises = batch.map((update) =>
        prismaHP.vehicle_details.update({
          where: { vehicle_id: update.vehicle_id },
          data: {
            total_price_rub: update.total_price_rub,
            detailed_calculation: update.detailed_calculation,
          },
        })
      );

      const settled = await Promise.allSettled(updatePromises);
      settled.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          result.successCount++;
        } else {
          result.failedUpdates.push({
            vehicle_id: batch[idx].vehicle_id,
            error: res.reason?.message || "Unknown error",
          });
        }
      });
    } catch (batchError: any) {
      console.error(`❌ Batch update failed:`, batchError.message);
      // Если весь батч упал – пробуем по одному
      for (const update of batch) {
        try {
          await prismaHP.vehicle_details.update({
            where: { vehicle_id: update.vehicle_id },
            data: {
              total_price_rub: update.total_price_rub,
              detailed_calculation: update.detailed_calculation,
            },
          });
          result.successCount++;
        } catch (singleError: any) {
          result.failedUpdates.push({
            vehicle_id: update.vehicle_id,
            error: singleError.message,
          });
        }
      }
    }
  }

  return result;
}

export async function recalculateActivePrice(): Promise<BatchRecalcResult> {
  // Инициализация результата
  const result: BatchRecalcResult = {
    totalVehicles: 0,
    successfullyRecalculated: 0,
    errorCount: 0,
    problemVehicles: [],
    fuelErrors: 0,
    engineErrors: 0,
    dateErrors: 0,
    priceErrors: 0,
    calculationErrors: 0,
    horsePowerErrors: 0,
    updateErrors: 0,
    otherErrors: 0,
    cbrError: "",
  };

  try {
    console.log("Запуск пересчёта активных автомобилей...");

    // --- Получение курсов валют (без изменений) ---
    const cbr = await prismaHP.currency_rates.findMany({
      select: { char_code: true, name: true, value: true },
    });
    const cbrMap = new Map(cbr.map((item) => [item.char_code, item.value]));

    const krw = validateNumber(cbrMap.get("KRW"), "KRW");
    if (!krw.isValid) throw new Error("Отсутствуют данные о курсе воны");
    const k_krw = validateNumber(cbrMap.get("K_KRW"), "K_KRW");
    if (!k_krw.isValid) throw new Error("Отсутствуют данные о коэффициенте воны");
    const fraht = validateNumber(cbrMap.get("fraht"), "FRAHT");
    if (!fraht.isValid) throw new Error("Отсутствуют данные о фрахте");
    const eur = validateNumber(cbrMap.get("EUR"), "EUR");
    if (!eur.isValid) throw new Error("Отсутствуют данные о курсе евро");
    const comission = validateNumber(cbrMap.get("company_comission"), "COMPANY_COMISSION", true);
    if (!comission.isValid) throw new Error("Отсутствуют данные о комиссии");
    const broker = validateNumber(cbrMap.get("broker"), "BROKER");
    if (!broker.isValid) throw new Error("Отсутствуют данные об услугах брокера");

    const cbrObj = {
      KRW: krw.value!,
      K_KRW: k_krw.value!,
      fraht: fraht.value!,
      EUR: eur.value!,
      company_comission: comission.value!,
      broker: broker.value!,
    };

    // --- Подсчёт общего количества автомобилей с данной комбинацией ---
    result.totalVehicles = await prismaHP.active_lots.count();
    console.log(`Всего автомобилей: ${result.totalVehicles}`);

    // --- Пагинация по id ---
    const SELECT_PAGE_SIZE = 1000;
    let lastId = 0;
    let hasMore = true;
    let processedCount = 0;

    while (hasMore) {
      const cars = await prismaHP.active_lots.findMany({
        where: { id: { gt: lastId }, },
        select: {
          id: true,
          vehicle_id: true,     
          encar: {
            select: {
              details: {
                select: {
                  engine_displacement: true,       // объем двигателя
                  release_date: true,  // получение года выпуска автомобиля
                  fuel: {
                    select: {
                      fuel_english: true   // для получения типа топлива
                    }
                  },
                  engine_horse_power: true,
                }
              },
              advertisements: {
                select: {
                  price: true,        // для получения цены в вонах (тысячах)
                }
              }
            }
          }
        },
        orderBy: { id: "asc" },
        take: SELECT_PAGE_SIZE,
      });

      if (cars.length === 0) {
        hasMore = false;
        break;
      }

      const updates: VehicleUpdate[] = [];

      for (const vehicle of cars) {
        // --- Инициализируем запись об ошибках для текущего авто ---
        const errorIdx = findOrCreateErrorRecord(result.problemVehicles, Number(vehicle.vehicle_id));
        const err = result.problemVehicles[errorIdx];

        // Флаг, что у этого авто есть хотя бы одна ошибка (будет использован позже)
        let hasError = false;
        // Флаг, что все обязательные поля валидны и можно выполнять расчёт
        let canCalculate = true;

        // --- 1. Валидация топлива ---
        const fuelVal = validateString(vehicle.encar?.details?.fuel.fuel_english, "тип топлива");
        if (!fuelVal.isValid) {
          err.noFuel = true;
          err.errorMessages!.fuel = fuelVal.error || "Неизвестная ошибка";
          result.fuelErrors++;
          hasError = true;
          canCalculate = false;
        }
        const fuel = fuelVal.isValid ? fuelVal.value! : null;

        // --- 2. Валидация объёма двигателя ---
        let engine: number | null = null;
        if (fuel === "Electricity") {
          const engineVal = validateNumber(vehicle.encar?.details?.engine_displacement, "Engine Displacement", true);
          if (!engineVal.isValid) {
            err.noEngine = true;
            err.errorMessages!.engine = engineVal.error || "Ошибка валидации объёма";
            result.engineErrors++;
            hasError = true;
            canCalculate = false;
          } else {
            engine = engineVal.value!;
          }
        } else {
          const engineVal = validateNumber(vehicle.encar?.details?.engine_displacement, "Engine Displacement");
          if (!engineVal.isValid) {
            err.noEngine = true;
            err.errorMessages!.engine = engineVal.error || "Ошибка валидации объёма";
            result.engineErrors++;
            hasError = true;
            canCalculate = false;
          } else {
            engine = engineVal.value!;
          }
        }

        // --- 3. Валидация даты выпуска ---
        const dateVal = validateDate(vehicle.encar?.details?.release_date, "Дата выпуска");
        if (!dateVal.isValid) {
          err.noDate = true;
          err.errorMessages!.date = dateVal.error || "Ошибка валидации даты";
          result.dateErrors++;
          hasError = true;
          canCalculate = false;
        }
        const releaseDate = dateVal.isValid ? dateVal.value! : null;

        // --- 4. Валидация цены ---
        const priceVal = validateNumber(vehicle.encar?.advertisements?.price, "Цена");
        if (!priceVal.isValid) {
          err.noPrice = true;
          err.errorMessages!.price = priceVal.error || "Ошибка валидации цены";
          result.priceErrors++;
          hasError = true;
          canCalculate = false;
        }
        const priceInWonThousand = priceVal.isValid ? priceVal.value! : null;

        
        
        const hpVal = validateNumber(vehicle.encar?.details?.engine_horse_power, "Лошадиные силы");
        if (!hpVal.isValid) {
          err.noHorsePower = true;
          err.errorMessages!.horsePower = hpVal.error || "Ошибка валидации ЛС";
          result.horsePowerErrors++;
          // hasError = true;
          // canCalculate = false;
        }
        const horsePower = hpVal.isValid ? hpVal.value! : null;

        // --- Если обязательных полей достаточно для расчёта ---
        if (canCalculate && fuel && engine && releaseDate && priceInWonThousand) {
          try {
            const isNoProhodCar = NoProhodCar(releaseDate);
            const priceResult = calculationCar(
              isNoProhodCar,
              priceInWonThousand,
              cbrObj.KRW,
              cbrObj.EUR,
              engine,
              fuel,
              releaseDate,
              cbrObj.broker,
              cbrObj.fraht,
              cbrObj.K_KRW,
              cbrObj.company_comission,
              horsePower
            );

            const finalPrice = isNoProhodCar
              ? priceResult.totalPriceInRublesProhod
              : priceResult.totalPriceInRubles;

            const priceCheck = validateNumber(finalPrice, "Calculated price");
            if (!priceCheck.isValid) {
              throw new Error(`Invalid calculation result: ${priceCheck.error}`);
            }

            updates.push({
              vehicle_id: Number(vehicle.vehicle_id),
              total_price_rub: finalPrice!,
              detailed_calculation: priceResult,
            });
          } catch (calcError: any) {
            err.calculationFailed = true;
            err.errorMessages!.calculation = calcError.message;
            result.calculationErrors++;
            hasError = true;
          }
        }
      }

      // --- Массовое обновление ---
      if (updates.length > 0) {
        const batchResult = await updateVehiclesInBatch(updates);
        result.successfullyRecalculated += batchResult.successCount;

        // Обрабатываем ошибки обновления
        for (const fail of batchResult.failedUpdates) {
          const errorIdx = findOrCreateErrorRecord(result.problemVehicles, fail.vehicle_id);
          const err = result.problemVehicles[errorIdx];
          err.updateFailed = true;
          err.errorMessages!.update = fail.error;
          result.updateErrors++;
        }

      }
      processedCount += cars.length;
      const progress = Math.round((processedCount / result.totalVehicles) * 100);
      console.log(`Обработано: ${processedCount} / ${result.totalVehicles} (${progress}%)`);

      lastId = Number(cars[cars.length - 1].id);
      if (cars.length < SELECT_PAGE_SIZE) hasMore = false;
    }

    result.problemVehicles = result.problemVehicles.filter(
      (v) =>
        v.noFuel ||
        v.noEngine ||
        v.noDate ||
        v.noPrice ||
        v.noHorsePower ||
        v.calculationFailed ||
        v.updateFailed
    );
    result.errorCount = result.problemVehicles.length;

    // Очищаем пустые errorMessages
    result.problemVehicles.forEach((p) => {
      if (p.errorMessages && Object.keys(p.errorMessages).length === 0) {
        p.errorMessages = undefined;
      }
    });

    console.log(`Пересчёт завершён. Успешно: ${result.successfullyRecalculated}, ошибок: ${result.errorCount}`);

    return result;

  } catch (error: any) {
    if (error.message?.includes("Отсутствуют данные")) {
      result.cbrError = error.message;
    }

    console.error("Ошибка пересчёта:", error);
    throw error;
  }
}