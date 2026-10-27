import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { getManagedCatalogColors, saveManagedCatalogColors } from "@/lib/catalog-colors";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const colors = await getManagedCatalogColors();
  return Response.json({
    data: colors.map((name) => ({ id: name, name })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return Response.json({ error: "Color name is required" }, { status: 400 });
  }

  const colors = await getManagedCatalogColors();
  if (colors.some((c) => c.toLowerCase() === name.toLowerCase())) {
    return Response.json({ error: "Color already exists" }, { status: 400 });
  }

  await saveManagedCatalogColors([...colors, name]);
  return Response.json({ data: { id: name, name } });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  if (!id || !name) {
    return Response.json({ error: "ID and name are required" }, { status: 400 });
  }

  const colors = await getManagedCatalogColors();
  const index = colors.findIndex((c) => c === id);
  if (index === -1) {
    return Response.json({ error: "Color not found" }, { status: 404 });
  }

  colors[index] = name;
  await saveManagedCatalogColors(colors);
  return Response.json({ data: { id: name, name } });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 });
  }

  const colors = await getManagedCatalogColors();
  const filtered = colors.filter((c) => c !== id);
  if (filtered.length === colors.length) {
    return Response.json({ error: "Color not found" }, { status: 404 });
  }

  await saveManagedCatalogColors(filtered);
  return Response.json({ success: true });
}
