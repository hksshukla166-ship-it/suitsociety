import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: paidOrders },
    { data: topProducts },
    { data: couponUsage },
    { count: lowStock },
    { count: outOfStock },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, created_at, payment_status")
      .eq("payment_status", "paid")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("products")
      .select("id, name, sales_count, price")
      .order("sales_count", { ascending: false })
      .limit(10),
    supabase
      .from("coupons")
      .select("code, usage_count")
      .gt("usage_count", 0)
      .order("usage_count", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .gt("stock", 0)
      .lte("stock", 5),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("stock", 0),
  ]);

  const totalRevenue = (paidOrders || []).reduce((s, o) => s + Number(o.total), 0);

  const dailyMap: Record<string, { revenue: number; orders: number }> = {};
  for (const order of paidOrders || []) {
    const day = order.created_at.split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 };
    dailyMap[day].revenue += Number(order.total);
    dailyMap[day].orders += 1;
  }

  const dailySales = Object.entries(dailyMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return Response.json({
    totalRevenue,
    totalOrders: paidOrders?.length || 0,
    dailySales,
    topProducts: topProducts || [],
    couponUsage: couponUsage || [],
    inventory: { lowStock: lowStock || 0, outOfStock: outOfStock || 0 },
  });
}
