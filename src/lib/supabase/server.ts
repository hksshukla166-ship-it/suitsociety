import { createDbClient } from "@/lib/db/query-builder";

export async function createClient() {
  return createDbClient();
}

export function createServiceClient() {
  return createDbClient();
}
