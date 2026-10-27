"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { AdminLayout, AdminHeader, AdminCard, AdminButton } from "@/components/admin/AdminLayout";
import { formatPrice, formatDateTime } from "@/lib/utils";

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  dailySales: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; sales_count: number; price: number }[];
  couponUsage: { code: string; usage_count: number }[];
  inventory: { lowStock: number; outOfStock: number };
}

interface ProfitRow {
  product_name: string;
  order_number: string;
  selling_price: number;
  cost_price: number;
  quantity: number;
  total_sale: number;
  profit: number;
  sale_date: string;
}

interface ProfitData {
  rows: ProfitRow[];
  summary: {
    totalProfit: number;
    totalSales: number;
    itemCount: number;
    days: number;
  };
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/analytics").then((r) => r.json()),
      fetch("/api/admin/profit-reports?days=30").then((r) => r.json()),
    ])
      .then(([analytics, profit]) => {
        setData(analytics);
        setProfitData(profit);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Suit Society - Sales Report"],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Summary"],
      ["Total Revenue (30d)", data.totalRevenue],
      ["Total Orders (30d)", data.totalOrders],
      ["Low Stock Products", data.inventory.lowStock],
      ["Out of Stock Products", data.inventory.outOfStock],
      [],
      ["Daily Sales"],
      ["Date", "Revenue", "Orders"],
      ...data.dailySales.map((d) => [d.date, d.revenue, d.orders]),
      [],
      ["Top Products"],
      ["Name", "Sold Count", "Price"],
      ...data.topProducts.map((p) => [p.name, p.sales_count, p.price]),
    ];
    downloadCsv(rows, "suit-society-report");
  };

  const exportProfitCsv = () => {
    if (!profitData?.rows.length) return;
    const rows = [
      ["Suit Society - Profit Report"],
      ["Generated", new Date().toLocaleString("en-IN")],
      ["Total Profit", profitData.summary.totalProfit],
      ["Total Sales", profitData.summary.totalSales],
      [],
      [
        "Product Name",
        "Order ID",
        "Selling Price",
        "Cost Price",
        "Quantity",
        "Total Sale",
        "Profit",
        "Date",
      ],
      ...profitData.rows.map((row) => [
        row.product_name,
        row.order_number,
        row.selling_price,
        row.cost_price,
        row.quantity,
        row.total_sale,
        row.profit,
        row.sale_date,
      ]),
    ];
    downloadCsv(rows, "suit-society-profit-report");
  };

  const downloadCsv = (rows: (string | number)[][], prefix: string) => {
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-6">
        <AdminHeader title="Reports" description="Generate and export business reports" />
        <div className="flex gap-2">
          <AdminButton onClick={exportProfitCsv} disabled={!profitData?.rows.length}>
            <Download className="w-4 h-4 mr-1 inline" /> Export Profit CSV
          </AdminButton>
          <AdminButton onClick={exportCsv} disabled={!data}>
            <Download className="w-4 h-4 mr-1 inline" /> Export Sales CSV
          </AdminButton>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {data && (
            <AdminCard>
              <h3 className="text-white font-medium mb-4">Sales Summary (Last 30 Days)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Total Revenue</p>
                  <p className="text-xl text-white font-medium">{formatPrice(data.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Total Orders</p>
                  <p className="text-xl text-white font-medium">{data.totalOrders}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Low Stock</p>
                  <p className="text-xl text-yellow-400 font-medium">{data.inventory.lowStock}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Out of Stock</p>
                  <p className="text-xl text-red-400 font-medium">{data.inventory.outOfStock}</p>
                </div>
              </div>
            </AdminCard>
          )}

          {profitData && (
            <AdminCard>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-white font-medium">Profit Reports (Last 30 Days)</h3>
                  <p className="text-zinc-500 text-sm mt-1">
                    Profit = (Selling Price − Cost Price) × Quantity Sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-sm">Total Profit</p>
                  <p className="text-2xl text-emerald-400 font-semibold">
                    {formatPrice(profitData.summary.totalProfit)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 border-b border-white/10">
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-right py-2">Selling</th>
                      <th className="text-right py-2">Cost</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Sale</th>
                      <th className="text-right py-2">Profit</th>
                      <th className="text-right py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitData.rows.length ? (
                      profitData.rows.map((row, index) => (
                        <tr key={`${row.order_number}-${index}`} className="border-b border-white/5 text-zinc-300">
                          <td className="py-2">{row.product_name}</td>
                          <td className="py-2">{row.order_number}</td>
                          <td className="py-2 text-right">{formatPrice(row.selling_price)}</td>
                          <td className="py-2 text-right">{formatPrice(row.cost_price)}</td>
                          <td className="py-2 text-right">{row.quantity}</td>
                          <td className="py-2 text-right">{formatPrice(row.total_sale)}</td>
                          <td className="py-2 text-right text-emerald-400">{formatPrice(row.profit)}</td>
                          <td className="py-2 text-right text-zinc-500">{formatDateTime(row.sale_date)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-zinc-500">
                          No paid orders in the last 30 days
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          )}

          {data && (
            <AdminCard>
              <h3 className="text-white font-medium mb-4">Top Products Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 border-b border-white/10">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Sold</th>
                      <th className="text-right py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.name} className="border-b border-white/5 text-zinc-300">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-right">{p.sales_count}</td>
                        <td className="py-2 text-right">{formatPrice(p.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
