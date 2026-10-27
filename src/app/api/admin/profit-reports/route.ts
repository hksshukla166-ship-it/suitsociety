import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export interface ProfitReportRow {
  product_name: string;
  order_id: string;
  order_number: string;
  selling_price: number;
  cost_price: number;
  quantity: number;
  total_sale: number;
  profit: number;
  sale_date: string;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: paidOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, created_at")
    .eq("payment_status", "paid")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return Response.json({ error: ordersError.message }, { status: 500 });
  }

  if (!paidOrders?.length) {
    return Response.json({
      rows: [],
      summary: { totalProfit: 0, totalSales: 0, itemCount: 0, days },
    });
  }

  type PaidOrder = { id: string; order_number: string; created_at: string };
  const orderMap = new Map<string, PaidOrder>(
    (Array.isArray(paidOrders) ? paidOrders : []).map((o: PaidOrder) => [o.id, o])
  );
  const orderIds = paidOrders.map((o) => o.id);

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, quantity, price, total, order_id")
    .in("order_id", orderIds);

  if (itemsError) {
    return Response.json({ error: itemsError.message }, { status: 500 });
  }

  const productIds = [
    ...new Set((items || []).map((item) => item.product_id).filter(Boolean)),
  ] as string[];

  const costByProduct = new Map<string, number>();
  if (productIds.length) {
    const { data: products } = await supabase
      .from("products")
      .select("id, cost_price")
      .in("id", productIds);

    for (const product of products || []) {
      costByProduct.set(product.id, Number(product.cost_price) || 0);
    }
  }

  const rows: ProfitReportRow[] = (items || [])
    .map((item) => {
      const order = orderMap.get(item.order_id);
      if (!order) return null;

      const costPrice = item.product_id ? costByProduct.get(item.product_id) || 0 : 0;
      const sellingPrice = Number(item.price);
      const quantity = Number(item.quantity);
      const profit = (sellingPrice - costPrice) * quantity;

      return {
        product_name: item.product_name,
        order_id: order.id,
        order_number: order.order_number,
        selling_price: sellingPrice,
        cost_price: costPrice,
        quantity,
        total_sale: Number(item.total),
        profit,
        sale_date: order.created_at,
      };
    })
    .filter((row): row is ProfitReportRow => row !== null)
    .sort((a, b) => b.sale_date.localeCompare(a.sale_date));

  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
  const totalSales = rows.reduce((sum, row) => sum + row.total_sale, 0);

  return Response.json({
    rows,
    summary: {
      totalProfit,
      totalSales,
      itemCount: rows.length,
      days,
    },
  });
}
