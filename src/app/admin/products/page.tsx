import Link from "next/link";

import { getAllProductsAdmin } from "@/actions/products";

import { Button } from "@/components/ui/button";

import { Plus, Upload } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";

import { ProductsTable } from "@/components/admin/products-table";



export default async function AdminProductsPage() {

  const products = await getAllProductsAdmin();



  return (

    <AdminLayout>

      <div className="space-y-6">

        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div>

            <h1 className="text-2xl font-serif tracking-wider">Products</h1>

            <p className="text-muted-foreground text-sm">{products.length} products</p>

          </div>

          <div className="flex items-center gap-2">

            <Link href="/admin/import">

              <Button variant="outline">

                <Upload className="w-4 h-4 mr-1" /> Import Excel

              </Button>

            </Link>

            <Link href="/admin/products/new">

              <Button variant="luxury">

                <Plus className="w-4 h-4 mr-1" /> Add Product

              </Button>

            </Link>

          </div>

        </div>



        <ProductsTable products={products} />

      </div>

    </AdminLayout>

  );

}

