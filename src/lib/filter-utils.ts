import { parseFilterList } from "@/lib/product-utils";

export function parseSearchParam(value?: string): string | string[] | undefined {
  if (!value) return undefined;
  if (value.includes(",")) return parseFilterList(value);
  return value;
}

export function toFilterArray(value?: string | string[]): string[] {
  if (!value) return [];
  return parseFilterList(value);
}

export function toggleFilterValue(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

export function buildFilterParams(
  searchParams: URLSearchParams,
  key: string,
  values: string[]
): URLSearchParams {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  if (values.length) params.set(key, values.join(","));
  else params.delete(key);
  return params;
}
