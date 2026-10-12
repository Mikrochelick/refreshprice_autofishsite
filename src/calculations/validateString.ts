export function validateString(value: any, fieldName: string) {
  interface IResult {
    isValid: boolean;
    value: string | null;
    error: string | null;
  }
  const result: IResult = {
    isValid: false,
    value: null,
    error: null
  };
  
  if (value === null || value === undefined) {
    result.error = `${fieldName} отсутствует`;
    return result;
  }
  
  const str = String(value).trim();
  
  if (str.length === 0) {
    result.error = `${fieldName} пустая строка`;
  } else {
    result.isValid = true;
    result.value = str;
  }
  
  return result;
}