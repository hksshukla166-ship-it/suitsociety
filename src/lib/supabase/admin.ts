import { createDbClient } from "@/lib/db/query-builder";

export function createServiceClient() {
  return createDbClient();
}
