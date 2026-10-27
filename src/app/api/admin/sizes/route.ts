import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { getManagedCatalogSizes, saveManagedCatalogSizes } from "@/lib/catalog-sizes";
import { sortSizes } from "@/lib/product-utils";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const sizes = await getManagedCatalogSizes();
  return Response.json({
    data: sizes.map((name) => ({ id: name, name })),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const name = String(body.name || "").trim().toUpperCase();
  if (!name) {
    return Response.json({ error: "Size name is required" }, { status: 400 });
  }

  const sizes = await getManagedCatalogSizes();
  if (sizes.some((s) => s.toUpperCase() === name)) {
    return Response.json({ error: "Size already exists" }, { status: 400 });
  }

  await saveManagedCatalogSizes(sortSizes([...sizes, name]));
  return Response.json({ data: { id: name, name } });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim().toUpperCase();
  if (!id || !name) {
    return Response.json({ error: "ID and name are required" }, { status: 400 });
  }

  const sizes = await getManagedCatalogSizes();
  const index = sizes.findIndex((s) => s === id);
  if (index === -1) {
    return Response.json({ error: "Size not found" }, { status: 404 });
  }

  sizes[index] = name;
  await saveManagedCatalogSizes(sortSizes(sizes));
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

  const sizes = await getManagedCatalogSizes();
  const filtered = sizes.filter((s) => s !== id);
  if (filtered.length === sizes.length) {
    return Response.json({ error: "Size not found" }, { status: 404 });
  }

  await saveManagedCatalogSizes(filtered);
  return Response.json({ success: true });
}
