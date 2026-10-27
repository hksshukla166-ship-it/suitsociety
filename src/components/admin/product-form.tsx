"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct, updateProduct } from "@/actions/products";
import { calculateSellingPrice } from "@/lib/product-catalog";
import { parseSizeStock } from "@/lib/inventory";
import { barcodeFromProductCode } from "@/lib/barcode-utils";
import { formatPrice, calculateDiscountPercentage } from "@/lib/utils";
import { BarcodeDisplay } from "@/components/admin/BarcodeDisplay";
import {
  ProductImagesManager,
  buildInitialImages,
  type ImageEntry,
} from "@/components/admin/product-images-manager";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types";

type AdminProduct = Product & {
  images?: { id: string; url: string; sort_order?: number; is_primary?: boolean }[];
  fabric?: { id: string; name: string } | null;
};

interface Props {
  categories: { id: string; name: string }[];
  fabrics: { id: string; name: string }[];
  availableColors?: string[];
  product?: AdminProduct | null;
  availableSizes?: string[];
}

function getInitialPrices(product?: AdminProduct | null) {
  const mrp = product?.compare_at_price != null ? String(product.compare_at_price) : "";
  const sellingPrice = product?.price != null ? String(product.price) : "";
  const discountPercent =
    product?.discount_percent != null ? String(product.discount_percent) : "";
  return { mrp, sellingPrice, discountPercent };
}

export function ProductForm({
  categories,
  fabrics,
  availableColors = [],
  product,
  availableSizes,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const initialPrices = getInitialPrices(product);
  const initialSizeStock = parseSizeStock(product?.size_stock);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageEntry[]>(() => buildInitialImages(product));
  const [sellingPriceManual, setSellingPriceManual] = useState(isEdit);
  const [form, setForm] = useState({
    product_code: product?.sku || "",
    name: product?.name || "",
    mrp: initialPrices.mrp,
    selling_price: initialPrices.sellingPrice,
    discount_percent: initialPrices.discountPercent,
    cost_price: product?.cost_price != null ? String(product.cost_price) : "",
    category_id: product?.category_id || "",
    color: product?.colors?.[0] || "",
    fabric_id: product?.fabric_id || "",
    sizes: product?.sizes || ([] as string[]),
    size_stock: initialSizeStock as Record<string, number>,
    description: product?.description || "",
    is_active: product?.is_active ?? true,
  });

  const mrpValue = parseFloat(form.mrp) || 0;
  const sellingPriceValue = parseFloat(form.selling_price) || 0;
  const discountPercentValue = parseFloat(form.discount_percent) || 0;
  const computedDiscount =
    mrpValue > sellingPriceValue
      ? calculateDiscountPercentage(mrpValue, sellingPriceValue)
      : 0;

  const colorOptions = availableColors.length ? availableColors : [];
  const sizeOptions = availableSizes?.length ? availableSizes : [];
  const displaySizes = [...new Set([...sizeOptions, ...form.sizes])];
  const displayColors = [...new Set([...colorOptions, ...(form.color ? [form.color] : [])])];

  const barcodePreview =
    product?.barcode || barcodeFromProductCode(form.product_code) || "";

  useEffect(() => {
    if (sellingPriceManual || !mrpValue || !discountPercentValue) return;
    const calculated = calculateSellingPrice(mrpValue, discountPercentValue);
    setForm((prev) => ({ ...prev, selling_price: String(calculated) }));
  }, [form.mrp, form.discount_percent, sellingPriceManual, mrpValue, discountPercentValue]);

  const handleDiscountChange = (value: string) => {
    setSellingPriceManual(false);
    setForm((prev) => ({ ...prev, discount_percent: value }));
  };

  const handleSellingPriceChange = (value: string) => {
    setSellingPriceManual(true);
    setForm((prev) => ({ ...prev, selling_price: value }));
  };

  const toggleSize = (size: string) => {
    setForm((prev) => {
      const hasSize = prev.sizes.includes(size);
      const sizes = hasSize
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      const size_stock = { ...prev.size_stock };
      if (!hasSize && size_stock[size] == null) {
        size_stock[size] = 0;
      }
      if (hasSize) {
        delete size_stock[size];
      }
      return { ...prev, sizes, size_stock };
    });
  };

  const setSizeStock = (size: string, qty: number) => {
    setForm((prev) => ({
      ...prev,
      size_stock: { ...prev.size_stock, [size]: Math.max(0, qty) },
    }));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("product_code", form.product_code);
    fd.append("name", form.name);
    fd.append("mrp", form.mrp);
    fd.append("price", form.selling_price);
    fd.append("selling_price", form.selling_price);
    fd.append("compare_at_price", form.mrp);
    fd.append("cost_price", form.cost_price);
    fd.append(
      "discount_percent",
      form.discount_percent || String(computedDiscount || "")
    );
    fd.append("category_id", form.category_id);
    fd.append("fabric_id", form.fabric_id);
    fd.append("description", form.description);
    fd.append("colors", JSON.stringify(form.color ? [form.color] : []));
    fd.append("sizes", JSON.stringify(form.sizes));
    fd.append("size_stock", JSON.stringify(form.size_stock));
    const totalStock = Object.values(form.size_stock).reduce((sum, qty) => sum + qty, 0);
    fd.append("stock", String(totalStock));
    fd.append("is_active", form.is_active.toString());

    const existingImages = images
      .filter((img) => !img.isNew)
      .map((img, index) => ({ id: img.id, sort_order: index }));
    fd.append("existing_images", JSON.stringify(existingImages));

    const primary = images.find((img) => img.is_primary);
    if (primary && !primary.isNew) {
      fd.append("primary_image_id", primary.id);
    }

    images
      .filter((img) => img.isNew && img.file)
      .forEach((img) => {
        if (img.file) fd.append("images", img.file);
      });

    return fd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.category_id) {
      toast.error("Select a category");
      return;
    }
    if (!form.cost_price || Number.isNaN(parseFloat(form.cost_price))) {
      toast.error("Cost price is required");
      return;
    }

    setLoading(true);
    const fd = buildFormData();
    const result = isEdit && product
      ? await updateProduct(product.id, fd)
      : await createProduct(fd);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Product updated!" : "Product created!");
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Product" : "Add New Product"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Product Code, Name, MRP, Cost Price, Discount %, Selling Price, Category, Color, Fabric, Sizes, Size Inventory, Photos, Description.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Product Photos</CardTitle></CardHeader>
        <CardContent>
          <ProductImagesManager images={images} onChange={setImages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product Code</Label>
              <Input
                placeholder="e.g. SS997401"
                value={form.product_code}
                onChange={(e) => setForm({ ...form, product_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Product Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>MRP / Original Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Original price"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
            </div>
            <div>
              <Label>Cost Price (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="Purchase cost"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 20"
                value={form.discount_percent}
                onChange={(e) => handleDiscountChange(e.target.value)}
              />
            </div>
            <div>
              <Label>Selling Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Auto-calculated or edit manually"
                value={form.selling_price}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
              />
            </div>
          </div>

          {mrpValue > 0 && sellingPriceValue > 0 && (
            <div className="rounded-md bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p>
                Customer will see:{" "}
                <span className="line-through text-muted-foreground">{formatPrice(mrpValue)}</span>{" "}
                <strong>{formatPrice(sellingPriceValue)}</strong>
              </p>
              {(discountPercentValue > 0 || computedDiscount > 0) && (
                <p className="text-emerald-600 font-medium">
                  {discountPercentValue || computedDiscount}% OFF
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Category *</Label>
              <select
                className="w-full h-10 border rounded-md px-3 text-sm"
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Color</Label>
              <select
                className="w-full h-10 border rounded-md px-3 text-sm"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              >
                <option value="">Select color</option>
                {displayColors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fabric</Label>
              <select
                className="w-full h-10 border rounded-md px-3 text-sm"
                value={form.fabric_id}
                onChange={(e) => setForm({ ...form, fabric_id: e.target.value })}
              >
                <option value="">Select fabric</option>
                {fabrics.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Available Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {displaySizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    form.sizes.includes(size)
                      ? "bg-gold/20 border-gold text-gold"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {form.sizes.length > 0 && (
            <div>
              <Label className="mb-2 block">Size-wise Inventory</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Set quantity per size. Use 0 to mark a size as out of stock.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {form.sizes.map((size) => (
                  <div key={size}>
                    <Label className="text-xs">{size}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.size_stock[size] ?? 0}
                      onChange={(e) => setSizeStock(size, parseInt(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Description</Label>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Product is active
            </label>
          )}
        </CardContent>
      </Card>

      {barcodePreview && (
        <Card>
          <CardHeader>
            <CardTitle>Barcode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Short barcode from product code. Download PNG or SVG for printing labels.
            </p>
            <BarcodeDisplay
              value={barcodePreview}
              productName={form.name}
              showDownload
            />
          </CardContent>
        </Card>
      )}

      <Button type="submit" variant="luxury" size="lg" disabled={loading}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : isEdit ? (
          "Save Changes"
        ) : (
          "Create Product"
        )}
      </Button>
    </form>
  );
}
