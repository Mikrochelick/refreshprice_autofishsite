export function validateDate(value: any, fieldName: string) {
  interface IResult {
    isValid: boolean;
    value: Date | null;
    error: string | null;
  }
  const result: IResult = {
    isValid: false,
    value: null,
    error: null
  };
  
  if (!value) {
    result.error = `${fieldName} отсутствует`;
    return result;
  }
 
  let date;
  
  // Если это уже Date объект
  if (value instanceof Date) {
    date = value;
  } 
  // Если это timestamp
  else if (typeof value === 'number') {
    date = new Date(value);
  }
  // Если это строка
  else {
    date = new Date(String(value));
  }
  
  // Проверяем, что дата валидна
  if (isNaN(date.getTime())) {
    result.error = `${fieldName} не является валидной датой`;
  } else {
    result.isValid = true;
    result.value = date;
  }
  
  return result;
}