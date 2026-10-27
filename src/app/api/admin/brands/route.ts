import { createSlugCrudHandlers } from "@/lib/admin-crud";

const handlers = createSlugCrudHandlers("brands");

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
