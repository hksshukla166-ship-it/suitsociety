import { getDashboardStats, getAllProductsAdmin } from "@/actions/products";
import { getOrders } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, IndianRupee, AlertTriangle, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default async function AdminDashboard() {  const [stats, recentOrders, products] = await Promise.all([
    getDashboardStats(),
    getOrders(),
    getAllProductsAdmin(),
  ]);

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 5));
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  return (
    <AdminLayout>
    <div className="space-y-8">      <div>
        <h1 className="text-2xl font-serif tracking-wider">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome to Suit Society Admin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: formatPrice(stats.totalRevenue), icon: IndianRupee, color: "text-emerald-600" },
          { label: "Orders", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600" },
          { label: "Products", value: stats.totalProducts.toString(), icon: Package, color: "text-gold" },
          { label: "Customers", value: stats.totalCustomers.toString(), icon: Users, color: "text-purple-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-muted-foreground">{order.shipping_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" /> Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 3).map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-yellow-600 font-medium">{p.stock} left</span>
                </div>
              ))}
              {outOfStockProducts.slice(0, 3).map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-red-600 font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Out of stock</span>
                </div>
              ))}
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                <p className="text-muted-foreground text-sm">All stock levels healthy</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}