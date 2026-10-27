"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Loader2 } from "lucide-react";
import { AdminLayout, AdminHeader, AdminCard, StatCard } from "@/components/admin/AdminLayout";
import { formatPrice } from "@/lib/utils";
import { IndianRupee, ShoppingCart, Package, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  dailySales: { date: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; sales_count: number; price: number }[];
  couponUsage: { code: string; title?: string; usage_count: number }[];
  inventory: { lowStock: number; outOfStock: number };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  return (
    <AdminLayout>
      <AdminHeader title="Analytics" description="Sales and performance insights (last 30 days)" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue (30d)" value={formatPrice(data.totalRevenue)} icon={IndianRupee} />
        <StatCard label="Orders (30d)" value={data.totalOrders} icon={ShoppingCart} />
        <StatCard label="Low Stock" value={data.inventory.lowStock} icon={AlertTriangle} />
        <StatCard label="Out of Stock" value={data.inventory.outOfStock} icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AdminCard>
          <h3 className="text-white font-medium mb-4">Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 10 }} />
              <YAxis stroke="#888" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #333" }} />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard>
          <h3 className="text-white font-medium mb-4">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 10 }} />
              <YAxis stroke="#888" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #333" }} />
              <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <h3 className="text-white font-medium mb-4">Top Selling Products</h3>
          {!data.topProducts.length ? (
            <p className="text-zinc-500 text-sm">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">
                    <span className="text-amber-400 mr-2">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="text-zinc-500">{p.sales_count} sold</span>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <h3 className="text-white font-medium mb-4">Coupon Usage</h3>
          {!data.couponUsage.length ? (
            <p className="text-zinc-500 text-sm">No coupon usage yet</p>
          ) : (
            <div className="space-y-3">
              {data.couponUsage.map((c) => (
                <div key={c.code} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">
                    <span className="text-amber-400 font-mono mr-2">{c.code}</span>
                    {c.title}
                  </span>
                  <span className="text-zinc-500">{c.usage_count} uses</span>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
