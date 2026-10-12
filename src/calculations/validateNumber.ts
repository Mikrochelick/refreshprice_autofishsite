export function validateNumber(value: any, fieldName: string, allowZero: boolean = false) {
  interface IResult {
    isValid: boolean;
    value: number | null;
    error: string | null;
  }
  const result: IResult = {
    isValid: false,
    value: null,
    error: null
  };
  
  if (value === null || value === undefined || value === '') {
    result.error = `${fieldName} отсутствует`;
    return result;
  }
  
  // Если значение уже число
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      result.error = `${fieldName} не является валидным числом`;
    } else if (value === 0 && !allowZero) {
      result.error = `${fieldName} равно 0`;
    } else {
      result.isValid = true;
      result.value = value;
    }
    return result;
  }
  
  // Пытаемся преобразовать в число
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    result.error = `${fieldName} "${value}" не является числом`;
  } else if (num === 0 && !allowZero) {
    result.error = `${fieldName} равно 0`;
  } else {
    result.isValid = true;
    result.value = num;
  }
  
  return result;
}