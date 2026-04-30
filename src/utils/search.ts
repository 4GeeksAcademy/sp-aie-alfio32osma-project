import type { Location, MenuItem } from "../types/models";

export function findLocationById(locations: Location[], id: string): Location | null {
  for (const location of locations) {
    if (location.id === id) {
      return location;
    }
  }

  return null;
}

export function findMenuItemByName(items: MenuItem[], name: string): MenuItem | null {
  const normalizedName = name.trim().toLowerCase();

  for (const item of items) {
    if (item.name.trim().toLowerCase() === normalizedName) {
      return item;
    }
  }

  return null;
}

export function binarySearchLocationByCapacity(
  sortedLocations: Location[],
  targetCapacity: number,
): number {
  let left = 0;
  let right = sortedLocations.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleCapacity = sortedLocations[middle].seatingCapacity;

    if (middleCapacity === targetCapacity) {
      return middle;
    }

    if (middleCapacity < targetCapacity) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return -1;
}
