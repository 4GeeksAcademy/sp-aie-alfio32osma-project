import type { Location, MenuItem, Price, SaleTransaction } from "../types/models";

const isValidPositivePrice = (price: Price): boolean => price.USD > 0 && price.COP > 0;

export function validateMenuItem(item: MenuItem): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push("MenuItem.name no debe estar vacío.");
  }

  if (!isValidPositivePrice(item.basePrice)) {
    errors.push("MenuItem.basePrice debe tener USD y COP mayores que 0.");
  }

  if (!isValidPositivePrice(item.ingredientCost)) {
    errors.push("MenuItem.ingredientCost debe tener USD y COP mayores que 0.");
  }

  if (item.prepTimeMinutes <= 0 || item.prepTimeMinutes > 60) {
    errors.push("MenuItem.prepTimeMinutes debe ser > 0 y <= 60.");
  }

  if (!item.isAvailableInColombia && !item.isAvailableInUSA) {
    errors.push("MenuItem debe estar disponible al menos en un país.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSaleTransaction(
  sale: SaleTransaction,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (sale.quantity <= 0) {
    errors.push("SaleTransaction.quantity debe ser mayor que 0.");
  }

  if (!isValidPositivePrice(sale.totalPrice)) {
    errors.push("SaleTransaction.totalPrice debe tener USD y COP mayores que 0.");
  }

  if (!sale.waiterName || sale.waiterName.trim().length === 0) {
    errors.push("SaleTransaction.waiterName no debe estar vacío.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLocation(
  location: Location,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const currentYear = new Date().getUTCFullYear();

  if (location.openingYear < 2008 || location.openingYear > currentYear) {
    errors.push(`Location.openingYear debe estar entre 2008 y ${currentYear}.`);
  }

  if (location.seatingCapacity <= 0) {
    errors.push("Location.seatingCapacity debe ser mayor que 0.");
  }

  if (location.staffCount <= 0) {
    errors.push("Location.staffCount debe ser mayor que 0.");
  }

  if (!isValidPositivePrice(location.monthlyRentCost)) {
    errors.push("Location.monthlyRentCost debe tener USD y COP mayores que 0.");
  }

  if (!isValidPositivePrice(location.averageMonthlyUtilities)) {
    errors.push("Location.averageMonthlyUtilities debe tener USD y COP mayores que 0.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
