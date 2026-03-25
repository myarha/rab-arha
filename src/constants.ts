import { BudgetCategory } from "./types";

export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  {
    id: "cat-1",
    name: "Venue & Catering",
    items: [
      { id: "item-1-1", name: "Sewa Gedung", estimatedCost: 10000000, actualCost: 0 },
      { id: "item-1-2", name: "Katering (500 pax)", estimatedCost: 25000000, actualCost: 0 },
    ],
  },
  {
    id: "cat-2",
    name: "Dekorasi & Dokumentasi",
    items: [
      { id: "item-2-1", name: "Dekorasi Pelaminan", estimatedCost: 7000000, actualCost: 0 },
      { id: "item-2-2", name: "Fotografer & Videografer", estimatedCost: 5000000, actualCost: 0 },
    ],
  },
  {
    id: "cat-3",
    name: "Busana & Rias",
    items: [
      { id: "item-3-1", name: "Baju Pengantin", estimatedCost: 3000000, actualCost: 0 },
      { id: "item-3-2", name: "Makeup Artist (MUA)", estimatedCost: 2000000, actualCost: 0 },
    ],
  },
  {
    id: "cat-4",
    name: "Undangan & Souvenir",
    items: [
      { id: "item-4-1", name: "Cetak Undangan", estimatedCost: 1500000, actualCost: 0 },
      { id: "item-4-2", name: "Souvenir", estimatedCost: 2000000, actualCost: 0 },
    ],
  },
];
