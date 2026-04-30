(function () {
  const statusNode = document.getElementById("lab-result-status");
  const outputNode = document.getElementById("lab-result-output");

  if (!statusNode || !outputNode) {
    return;
  }

  const menuItems = [
    {
      id: "M-001",
      name: "Brasa Burger",
      category: "Meat",
      basePrice: { USD: 8.5, COP: 34000 },
      status: "Active"
    },
    {
      id: "M-002",
      name: "Parrilla Familiar",
      category: "Combo",
      basePrice: { USD: 22, COP: 88000 },
      status: "Active"
    },
    {
      id: "M-003",
      name: "Yuca Frita",
      category: "Side",
      basePrice: { USD: 3, COP: 12000 },
      status: "Active"
    },
    {
      id: "M-004",
      name: "Limonada de Coco",
      category: "Beverage",
      basePrice: { USD: 4, COP: 16000 },
      status: "Seasonal"
    },
    {
      id: "M-005",
      name: "Volcan de Arequipe",
      category: "Dessert",
      basePrice: { USD: 5, COP: 20000 },
      status: "Active"
    }
  ];

  const locations = [
    {
      id: "LOC-CO-MDE-01",
      name: "Brasaland El Poblado",
      country: "Colombia",
      city: "Medellin",
      seatingCapacity: 120,
      status: "Active"
    },
    {
      id: "LOC-CO-BOG-01",
      name: "Brasaland Usaquen",
      country: "Colombia",
      city: "Bogota",
      seatingCapacity: 95,
      status: "Active"
    },
    {
      id: "LOC-US-MIA-01",
      name: "Brasaland Brickell",
      country: "USA",
      city: "Miami",
      seatingCapacity: 110,
      status: "Active"
    },
    {
      id: "LOC-US-ORL-01",
      name: "Brasaland Downtown",
      country: "USA",
      city: "Orlando",
      seatingCapacity: 80,
      status: "Temporarily closed"
    }
  ];

  const sales = [
    {
      id: "S-001",
      locationId: "LOC-CO-MDE-01",
      itemId: "M-001",
      quantity: 12,
      totalPrice: { USD: 102, COP: 408000 }
    },
    {
      id: "S-002",
      locationId: "LOC-US-MIA-01",
      itemId: "M-002",
      quantity: 6,
      totalPrice: { USD: 132, COP: 528000 }
    },
    {
      id: "S-003",
      locationId: "LOC-CO-BOG-01",
      itemId: "M-003",
      quantity: 20,
      totalPrice: { USD: 60, COP: 240000 }
    },
    {
      id: "S-004",
      locationId: "LOC-US-ORL-01",
      itemId: "M-004",
      quantity: 9,
      totalPrice: { USD: 36, COP: 144000 }
    },
    {
      id: "S-005",
      locationId: "LOC-CO-MDE-01",
      itemId: "M-002",
      quantity: 4,
      totalPrice: { USD: 88, COP: 352000 }
    },
    {
      id: "S-006",
      locationId: "LOC-US-MIA-01",
      itemId: "M-001",
      quantity: 7,
      totalPrice: { USD: 59.5, COP: 238000 }
    }
  ];

  function renderResult(title, payload) {
    statusNode.textContent = title;
    outputNode.textContent = JSON.stringify(payload, null, 2);
  }

  function filterMenuItemsByCategory(items, category) {
    return items.filter(function (item) {
      return item.category === category;
    });
  }

  function findMenuItemByName(items, name) {
    const normalizedName = name.trim().toLowerCase();

    for (const item of items) {
      if (item.name.trim().toLowerCase() === normalizedName) {
        return item;
      }
    }

    return null;
  }

  function sortLocationsByCapacity(items, order) {
    const factor = order === "asc" ? 1 : -1;
    return [...items].sort(function (a, b) {
      return (a.seatingCapacity - b.seatingCapacity) * factor;
    });
  }

  function sortMenuItemsByPrice(items, currency, order) {
    const factor = order === "asc" ? 1 : -1;
    return [...items].sort(function (a, b) {
      return (a.basePrice[currency] - b.basePrice[currency]) * factor;
    });
  }

  function calculateCountryComparison(salesData, locationsData) {
    const metrics = {
      Colombia: { totalRevenue: { USD: 0, COP: 0 }, totalSales: 0 },
      USA: { totalRevenue: { USD: 0, COP: 0 }, totalSales: 0 }
    };

    const countryByLocation = new Map();
    locationsData.forEach(function (location) {
      countryByLocation.set(location.id, location.country);
    });

    salesData.forEach(function (sale) {
      const country = countryByLocation.get(sale.locationId);
      if (!country || !metrics[country]) {
        return;
      }

      metrics[country].totalRevenue.USD += sale.totalPrice.USD;
      metrics[country].totalRevenue.COP += sale.totalPrice.COP;
      metrics[country].totalSales += 1;
    });

    return metrics;
  }

  function findTopSellingItems(salesData, items, topN) {
    const soldByItem = new Map();

    salesData.forEach(function (sale) {
      soldByItem.set(sale.itemId, (soldByItem.get(sale.itemId) || 0) + sale.quantity);
    });

    return [...soldByItem.entries()]
      .map(function (entry) {
        const item = items.find(function (candidate) {
          return candidate.id === entry[0];
        });

        if (!item) {
          return null;
        }

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          quantitySold: entry[1]
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return b.quantitySold - a.quantitySold;
      })
      .slice(0, topN);
  }

  const filterCategorySelect = document.getElementById("op-filter-category");
  const filterBtn = document.getElementById("btn-filter-category");
  const searchInput = document.getElementById("op-search-term");
  const searchBtn = document.getElementById("btn-search-item");
  const sortTargetSelect = document.getElementById("op-sort-target");
  const sortOrderSelect = document.getElementById("op-sort-order");
  const sortBtn = document.getElementById("btn-sort");
  const reportBtn = document.getElementById("btn-report");

  if (
    !filterCategorySelect ||
    !filterBtn ||
    !searchInput ||
    !searchBtn ||
    !sortTargetSelect ||
    !sortOrderSelect ||
    !sortBtn ||
    !reportBtn
  ) {
    return;
  }

  filterBtn.addEventListener("click", function () {
    const category = filterCategorySelect.value;
    const filtered = filterMenuItemsByCategory(menuItems, category);

    renderResult("Filtro ejecutado: menú por categoría", {
      category,
      totalResults: filtered.length,
      items: filtered
    });
  });

  searchBtn.addEventListener("click", function () {
    const term = searchInput.value;
    const foundItem = findMenuItemByName(menuItems, term);

    renderResult("Búsqueda ejecutada: ítem por nombre", {
      searchTerm: term,
      found: Boolean(foundItem),
      item: foundItem
    });
  });

  sortBtn.addEventListener("click", function () {
    const target = sortTargetSelect.value;
    const order = sortOrderSelect.value;

    if (target === "locations-capacity") {
      renderResult("Ordenamiento ejecutado: ubicaciones por capacidad", {
        target,
        order,
        locations: sortLocationsByCapacity(locations, order)
      });
      return;
    }

    renderResult("Ordenamiento ejecutado: menú por precio COP", {
      target,
      order,
      items: sortMenuItemsByPrice(menuItems, "COP", order)
    });
  });

  reportBtn.addEventListener("click", function () {
    const comparison = calculateCountryComparison(sales, locations);
    const topSelling = findTopSellingItems(sales, menuItems, 3);

    renderResult("Reporte generado", {
      summary: {
        activeLocations: locations.filter(function (location) {
          return location.status === "Active";
        }).length,
        totalSalesRecords: sales.length
      },
      countryComparison: comparison,
      topSellingItems: topSelling
    });
  });
})();
