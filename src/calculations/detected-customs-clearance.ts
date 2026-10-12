export function DetectedCustomsClearance(price: number) {
  let stavka = 0;
  if (price <= 200000) {
    stavka = 1231;
  } else if (price > 200000 && price <= 450000) {
    stavka = 2462;
  } else if (price > 450000 && price <= 1200000) {
    stavka = 4924;
  } else if (price > 1200000 && price <= 2700000) {
    stavka = 13541;
  } else if (price > 2700000 && price <= 4200000) {
    stavka = 18465;
  } else if (price > 4200000 && price <= 5500000) {
    stavka = 21344;
  } else if (price > 5500000 && price <= 10000000) {
    stavka = 49240;
  } else if (price > 10000000) {
    stavka = 73860;
  }
  return stavka;
}
