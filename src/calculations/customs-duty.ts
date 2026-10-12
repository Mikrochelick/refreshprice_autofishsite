export function CustomsDuty(
  origin_price: number, // цена в вонах
  KRW: number, // курс воны
  EUR: number, // курс евро
  engine: number, // двигатель объем
  fuel: string, // тип топлива
  year: number, // сколько полных лет машине
  horse_power: number, // лошадиные силы
  K: number // коэффицент для курса вон?
) {
  let result = 0;

  if (fuel === "Electricity") {
    result =
      origin_price * 0.001 * KRW * 0.15 +
      horse_power * K +
      (origin_price * 0.001 * KRW +
        origin_price * 0.001 * KRW * 0.15 +
        horse_power * K) *
        0.2;
  } else {
    if (year < 3) {
      if (origin_price * 0.001 * KRW <= 8500 * EUR) {
        if (origin_price * 0.001 * KRW * 0.54 >= engine * 2.5 * EUR) {
          result = origin_price * 0.001 * KRW * 0.54;
        } else {
          result = engine * 2.5 * EUR;
        }
      } else if (
        origin_price * 0.001 * KRW > 8500 * EUR &&
        origin_price * 0.001 * KRW <= 16700 * EUR
      ) {
        if (origin_price * 0.001 * KRW * 0.48 >= engine * 3.5 * EUR) {
          result = origin_price * 0.001 * KRW * 0.48;
        } else {
          result = engine * 3.5 * EUR;
        }
      } else if (
        origin_price * 0.001 * KRW > 16700 * EUR &&
        origin_price * 0.001 * KRW <= 42300 * EUR
      ) {
        if (origin_price * 0.001 * KRW * 0.48 >= engine * 5.5 * EUR) {
          result = origin_price * 0.001 * KRW * 0.48;
        } else {
          result = engine * 5.5 * EUR;
        }
      } else if (
        origin_price * 0.001 * KRW > 42300 * EUR &&
        origin_price * 0.001 * KRW <= 84500 * EUR
      ) {
        if (origin_price * 0.001 * KRW * 0.48 >= engine * 7.5 * EUR) {
          result = origin_price * 0.001 * KRW * 0.48;
        } else {
          result = engine * 7.5 * EUR;
        }
      } else if (
        origin_price * 0.001 * KRW > 84500 * EUR &&
        origin_price * 0.001 * KRW <= 169000 * EUR
      ) {
        if (origin_price * 0.001 * KRW * 0.48 >= engine * 15 * EUR) {
          result = origin_price * 0.001 * KRW * 0.48;
        } else {
          result = engine * 15 * EUR;
        }
      } else if (origin_price * 0.001 * KRW > 169000 * EUR) {
        if (origin_price * 0.001 * KRW * 0.48 >= engine * 20 * EUR) {
          result = origin_price * 0.001 * KRW * 0.48;
        } else {
          result = engine * 20 * EUR;
        }
      }
    } else if (year >= 3 && year <= 5) {
      if (engine <= 1000) {
        result = engine * 1.5 * EUR;
      } else if (engine > 1000 && engine <= 1500) {
        result = engine * 1.7 * EUR;
      } else if (engine > 1500 && engine <= 1800) {
        result = engine * 2.5 * EUR;
      } else if (engine > 1800 && engine <= 2300) {
        result = engine * 2.7 * EUR;
      } else if (engine > 2300 && engine <= 3000) {
        result = engine * 3 * EUR;
      } else if (engine > 3000) {
        result = engine * 3.6 * EUR;
      }
    } else if (year > 5) {
      if (engine <= 1000) {
        result = engine * 3 * EUR;
      } else if (engine > 1000 && engine <= 1500) {
        result = engine * 3.2 * EUR;
      } else if (engine > 1500 && engine <= 1800) {
        result = engine * 3.5 * EUR;
      } else if (engine > 1800 && engine <= 2300) {
        result = engine * 4.8 * EUR;
      } else if (engine > 2300 && engine <= 3000) {
        result = engine * 5 * EUR;
      } else if (engine > 3000) {
        result = engine * 5.7 * EUR;
      }
    }
  }
  return Math.floor(result);
}
