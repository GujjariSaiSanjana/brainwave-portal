import type { ZohoServiceKey } from "./types";

export interface ServiceTheme {
  monogram: string;
  dot: string;
  text: string;
  tint: string;
}

const themes: Record<ZohoServiceKey, ServiceTheme> = {
  crm: { monogram: "C", dot: "bg-service-crm", text: "text-service-crm", tint: "bg-service-crm/12" },
  people: { monogram: "P", dot: "bg-service-people", text: "text-service-people", tint: "bg-service-people/12" },
  desk: { monogram: "D", dot: "bg-service-desk", text: "text-service-desk", tint: "bg-service-desk/12" },
  books: { monogram: "B", dot: "bg-service-books", text: "text-service-books", tint: "bg-service-books/12" },
};

const fallback: ServiceTheme = {
  monogram: "Z",
  dot: "bg-muted-foreground",
  text: "text-muted-foreground",
  tint: "bg-muted",
};

export function serviceTheme(key: string): ServiceTheme {
  return themes[key as ZohoServiceKey] ?? fallback;
}
