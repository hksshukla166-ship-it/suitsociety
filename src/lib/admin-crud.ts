import { getAdminSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function createSlugCrudHandlers(
  table: string,
  slugField = "name",
  orderBy = "created_at"
) {
  return {
    async GET() {
      const session = await requireAdmin();
      if (!session) return unauthorized();

      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy, { ascending: false });

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ data });
    },

    async POST(request: Request) {
      const session = await requireAdmin();
      if (!session) return unauthorized();

      const body = await request.json();
      const supabase = createServiceClient();
      const slug = body.slug || slugify(body[slugField] || body.name || body.title || "item");

      const { data, error } = await supabase
        .from(table)
        .insert({ ...body, slug })
        .select()
        .single();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ data });
    },

    async PUT(request: Request) {
      const session = await requireAdmin();
      if (!session) return unauthorized();

      const body = await request.json();
      const { id, ...updates } = body;
      if (!id) return Response.json({ error: "ID required" }, { status: 400 });

      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ data });
    },

    async DELETE(request: Request) {
      const session = await requireAdmin();
      if (!session) return unauthorized();

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (!id) return Response.json({ error: "ID required" }, { status: 400 });

      const supabase = createServiceClient();
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true });
    },
  };
}
