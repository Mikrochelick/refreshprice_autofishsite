import { DetectedFullYear } from './detected-full-years';
import { CustomsDuty } from './customs-duty';
import { DetectedCustomsClearance } from './detected-customs-clearance';
import { CalculationUtilSborNew } from './calculation-util-sbor-new';


export const calculationCar = (
  isNoProhodCar: boolean,
  origin_price: number, // цена в вонах в тысячах
  KRW: number, // курс воны (берем из currensy_rates)
  EUR: number, // курс евро (берем из currensy_rates)
  engine: number, // объем двигателя
  fuel: string, // топливо (в оригинальном calculation-car - это аргумент fuel)
  release_date: Date, // год выпуска автомобиля (в оригинальном calculation-car - это аргумент year)
  broker: number, // цена услуг брокера (берем из currensy_rates)
  fraht: number, // сопутствующие расходы в Корее в вонах (берем из currensy_rates)
  K_KRW: number, // коэффицент для курса вон (берем из currensy_rates)
  company_comission: number, // комиссия (берем из currensy_rates)
  horse_power: number | null, // лошадиные силы (будем брать из таблицы vehicle_details?)
) => {

  horse_power = horse_power ?? 1;

  const differentYear = DetectedFullYear(release_date); // cколько полных лет машине (актуальный возраст)

  const priceInWon = origin_price * 10000; // воны в единицах

  const priceCarInRubles = Math.floor(priceInWon * 0.001 * KRW * K_KRW); // цена автомобиля в рублях

  const expensesInKoreaInRubles = Math.floor(fraht * KRW * 0.001 * K_KRW); // получаем сопутствующие расходы в Корее в рублях

  const customsOformlenie = DetectedCustomsClearance(priceInWon * 0.001 * KRW); // таможенное оформление

  const utilOrdinary = Math.floor(CalculationUtilSborNew(differentYear, engine, fuel, horse_power)); // Считаем утиль

  const poshlinaOrdinary = CustomsDuty(
    priceInWon,
    Number(KRW),
    Number(EUR),
    engine,
    fuel,
    differentYear,
    horse_power,
    K_KRW
  ); // Считаем пошлину

  const expensesInRussia = broker + poshlinaOrdinary + utilOrdinary + customsOformlenie + company_comission;

  const totalExpensesInKoreaInRubles = priceCarInRubles + expensesInKoreaInRubles

  const totalPriceInRubles = Math.floor(priceCarInRubles + expensesInKoreaInRubles + expensesInRussia); // получаем итоговую цену в рублях

  let utilProhod;
  let poshlinaProhod;
  let totalPriceInRublesProhod;
  let expensesInRussiaProhod;

  if (isNoProhodCar) {
    utilProhod = Math.floor(CalculationUtilSborNew(4, engine, fuel, horse_power)); // Считаем утиль как проходной
    poshlinaProhod = CustomsDuty(
      priceInWon,
      Number(KRW),
      Number(EUR),
      engine,
      fuel,
      4,
      horse_power,
      K_KRW
    ); // Считаем пошлину как проходную
    expensesInRussiaProhod = broker + poshlinaProhod + utilProhod + customsOformlenie + company_comission; // Считаем расходы в России как проходные
    totalPriceInRublesProhod = Math.floor(priceCarInRubles + expensesInKoreaInRubles + expensesInRussiaProhod); // получаем итоговую цену в рублях как за проходную
  }

  return {
    priceCarInRubles,
    expensesInKoreaInRubles,
    customsOformlenie,
    utilOrdinary,
    poshlinaOrdinary,
    broker,
    company_comission,
    expensesInRussia,
    totalExpensesInKoreaInRubles,
    totalPriceInRubles,
    utilProhod: isNoProhodCar ? utilProhod : null,
    poshlinaProhod: isNoProhodCar ? poshlinaProhod : null,
    totalPriceInRublesProhod: isNoProhodCar ? totalPriceInRublesProhod : null,
    expensesInRussiaProhod: isNoProhodCar ? expensesInRussiaProhod : null,
  }
}