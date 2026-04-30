import type {
  Country,
  CountryMetrics,
  Location,
  MenuItem,
  PaymentMethod,
  SaleTransaction,
  WasteReason,
  WasteRecord,
} from "../types/models";

const EXCHANGE_RATE_USD_TO_COP = 4000;

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Credit card",
  "Debit card",
  "Digital wallet",
];

const WASTE_REASONS: WasteReason[] = [
  "Expired",
  "Cooking error",
  "Customer return",
  "Damage",
  "Other",
];

const roundTo2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const isSameUTCDate = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

const filterSalesByLocation = (
  sales: SaleTransaction[],
  locationId: string,
): SaleTransaction[] => sales.filter((sale) => sale.locationId === locationId);

export function calculateDailyRevenue(
  sales: SaleTransaction[],
  date: Date,
  currency: "USD" | "COP",
): number {
  const total = sales
    .filter((sale) => isSameUTCDate(sale.timestamp, date))
    .reduce((sum, sale) => sum + sale.totalPrice[currency], 0);

  return roundTo2(total);
}

export function calculateLocationMargin(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  locationId: string,
  currency: "USD" | "COP",
): number {
  const salesForLocation = filterSalesByLocation(sales, locationId);
  const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

  const totalRevenue = salesForLocation.reduce(
    (sum, sale) => sum + sale.totalPrice[currency],
    0,
  );

  if (totalRevenue <= 0) {
    return 0;
  }

  const totalIngredientCost = salesForLocation.reduce((sum, sale) => {
    const item = menuItemsById.get(sale.itemId);
    if (!item) {
      return sum;
    }

    return sum + item.ingredientCost[currency] * sale.quantity;
  }, 0);

  const margin = ((totalRevenue - totalIngredientCost) / totalRevenue) * 100;
  return roundTo2(Math.max(0, Math.min(100, margin)));
}

export function calculateWasteCost(
  wasteRecords: WasteRecord[],
  locationId: string,
  currency: "USD" | "COP",
): number {
  const total = wasteRecords
    .filter((record) => record.locationId === locationId)
    .reduce((sum, record) => sum + record.cost[currency], 0);

  return roundTo2(total);
}

export function convertCurrency(
  amount: number,
  fromCurrency: "USD" | "COP",
  toCurrency: "USD" | "COP",
): number {
  if (fromCurrency === toCurrency) {
    return roundTo2(amount);
  }

  const converted =
    fromCurrency === "USD"
      ? amount * EXCHANGE_RATE_USD_TO_COP
      : amount / EXCHANGE_RATE_USD_TO_COP;

  return roundTo2(converted);
}

export function scoreLocationPerformance(
  location: Location,
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[],
): number {
  const locationSales = filterSalesByLocation(sales, location.id);
  const totalRevenueUSD = locationSales.reduce((sum, sale) => sum + sale.totalPrice.USD, 0);

  const openingDate = new Date(Date.UTC(location.openingYear, 0, 1));
  const now = new Date();
  const daysSinceOpening = Math.max(
    1,
    Math.ceil((now.getTime() - openingDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const averageDailyRevenueUSD = totalRevenueUSD / daysSinceOpening;
  const revenueScore = Math.min(40, (averageDailyRevenueUSD / 1000) * 40);

  const seatEfficiencyScore = Math.min(
    30,
    location.seatingCapacity > 0 ? (locationSales.length / location.seatingCapacity) * 30 : 0,
  );

  const totalWasteUSD = calculateWasteCost(wasteRecords, location.id, "USD");
  const wastePercentage = totalRevenueUSD > 0 ? (totalWasteUSD / totalRevenueUSD) * 100 : 100;
  const wasteControlScore = Math.max(0, 20 - wastePercentage * 2);

  const marginPercentage = calculateLocationMargin(sales, menuItems, location.id, "USD");
  const marginScore = Math.min(10, marginPercentage / 10);

  const totalScore = revenueScore + seatEfficiencyScore + wasteControlScore + marginScore;
  return roundTo2(Math.max(0, Math.min(100, totalScore)));
}

export function rankLocationsByPerformance(
  locations: Location[],
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[],
): Array<{ location: Location; score: number }> {
  return locations
    .map((location) => ({
      location,
      score: scoreLocationPerformance(location, sales, wasteRecords, menuItems),
    }))
    .sort((a, b) => b.score - a.score);
}

export function countSalesByPaymentMethod(
  sales: SaleTransaction[],
): Record<PaymentMethod, number> {
  const counter: Record<PaymentMethod, number> = {
    Cash: 0,
    "Credit card": 0,
    "Debit card": 0,
    "Digital wallet": 0,
  };

  for (const paymentMethod of PAYMENT_METHODS) {
    counter[paymentMethod] = 0;
  }

  for (const sale of sales) {
    counter[sale.paymentMethod] += 1;
  }

  return counter;
}

export function calculateAverageTicket(
  sales: SaleTransaction[],
  currency: "USD" | "COP",
): number {
  if (sales.length === 0) {
    return 0;
  }

  const total = sales.reduce((sum, sale) => sum + sale.totalPrice[currency], 0);
  return roundTo2(total / sales.length);
}

export function findTopSellingItems(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  topN: number,
): Array<{ item: MenuItem; totalSold: number }> {
  if (topN <= 0) {
    return [];
  }

  const soldByItemId = new Map<string, number>();
  const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

  for (const sale of sales) {
    soldByItemId.set(sale.itemId, (soldByItemId.get(sale.itemId) ?? 0) + sale.quantity);
  }

  return [...soldByItemId.entries()]
    .map(([itemId, totalSold]) => {
      const item = menuItemsById.get(itemId);
      return item ? { item, totalSold } : null;
    })
    .filter((entry): entry is { item: MenuItem; totalSold: number } => entry !== null)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, topN);
}

export function groupWasteByReason(
  wasteRecords: WasteRecord[],
): Record<WasteReason, WasteRecord[]> {
  const grouped: Record<WasteReason, WasteRecord[]> = {
    Expired: [],
    "Cooking error": [],
    "Customer return": [],
    Damage: [],
    Other: [],
  };

  for (const reason of WASTE_REASONS) {
    grouped[reason] = [];
  }

  for (const record of wasteRecords) {
    grouped[record.reason].push(record);
  }

  return grouped;
}

export function calculateCountryComparison(
  sales: SaleTransaction[],
  locations: Location[],
  _menuItems: MenuItem[],
): { Colombia: CountryMetrics; USA: CountryMetrics } {
  const metricsByCountry: Record<Country, CountryMetrics> = {
    Colombia: {
      totalLocations: 0,
      totalRevenue: { USD: 0, COP: 0 },
      averageRevenuePerLocation: { USD: 0, COP: 0 },
      totalSales: 0,
    },
    USA: {
      totalLocations: 0,
      totalRevenue: { USD: 0, COP: 0 },
      averageRevenuePerLocation: { USD: 0, COP: 0 },
      totalSales: 0,
    },
  };

  const countryByLocationId = new Map<string, Country>();

  for (const location of locations) {
    countryByLocationId.set(location.id, location.country);
    metricsByCountry[location.country].totalLocations += 1;
  }

  for (const sale of sales) {
    const country = countryByLocationId.get(sale.locationId);
    if (!country) {
      continue;
    }

    metricsByCountry[country].totalRevenue.USD += sale.totalPrice.USD;
    metricsByCountry[country].totalRevenue.COP += sale.totalPrice.COP;
    metricsByCountry[country].totalSales += 1;
  }

  for (const country of ["Colombia", "USA"] as const) {
    const metrics = metricsByCountry[country];
    const locationCount = metrics.totalLocations;

    metrics.totalRevenue.USD = roundTo2(metrics.totalRevenue.USD);
    metrics.totalRevenue.COP = roundTo2(metrics.totalRevenue.COP);

    metrics.averageRevenuePerLocation = {
      USD: locationCount > 0 ? roundTo2(metrics.totalRevenue.USD / locationCount) : 0,
      COP: locationCount > 0 ? roundTo2(metrics.totalRevenue.COP / locationCount) : 0,
    };
  }

  return {
    Colombia: metricsByCountry.Colombia,
    USA: metricsByCountry.USA,
  };
}
