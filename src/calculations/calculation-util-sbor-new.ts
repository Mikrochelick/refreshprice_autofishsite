import { findElectricRate, findCombustionRate } from "./UTIL_RATES";

export function CalculationUtilSborNew(year: number, engine: number, realFuel: string, horse_power: number) {
  const BASE = 20000; // Базовая ставка
  
  let rate;
  
  // Определяем тип автомобиля и находим соответствующую ставку
  if (realFuel === 'Electricity') {
    rate = findElectricRate(year, horse_power);
  } else {
    rate = findCombustionRate(year, engine, horse_power);
  }
  
  // Вычисляем и возвращаем результат
  return BASE * rate;
}