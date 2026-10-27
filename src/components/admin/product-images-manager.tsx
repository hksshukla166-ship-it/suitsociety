"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImagePlus, Star, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { ProductImage } from "@/types";

export type ImageEntry = {
  id: string;
  url: string;
  file?: File;
  sort_order: number;
  is_primary: boolean;
  isNew?: boolean;
};

interface Props {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
}

export function ProductImagesManager({ images, onChange }: Props) {
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const next = [...images];
    files.forEach((file, index) => {
      next.push({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        file,
        sort_order: next.length,
        is_primary: next.length === 0,
        isNew: true,
      });
    });
    onChange(next);
    e.target.value = "";
  };

  const setPrimary = (id: string) => {
    onChange(images.map((img) => ({ ...img, is_primary: img.id === id })));
  };

  const removeImage = (id: string) => {
    const filtered = images.filter((img) => img.id !== id);
    if (filtered.length && !filtered.some((img) => img.is_primary)) {
      filtered[0].is_primary = true;
    }
    onChange(filtered.map((img, i) => ({ ...img, sort_order: i })));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((img, i) => ({ ...img, sort_order: i })));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="product-images">Upload Photos</Label>
        <Input
          id="product-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Add multiple photos. Set one as main, reorder, or remove before saving.
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`relative border rounded-lg overflow-hidden bg-muted/30 ${
                img.is_primary ? "ring-2 ring-gold" : ""
              }`}
            >
              <div className="relative aspect-[3/4]">
                <Image src={img.url} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="p-2 flex flex-wrap gap-1">
                <Button type="button" size="sm" variant={img.is_primary ? "luxury" : "outline"} className="h-7 text-xs" onClick={() => setPrimary(img.id)}>
                  <Star className="w-3 h-3 mr-1" /> Main
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-red-500" onClick={() => removeImage(img.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No photos yet</p>
        </div>
      )}
    </div>
  );
}

export function buildInitialImages(product?: { images?: ProductImage[] } | null): ImageEntry[] {
  if (!product?.images?.length) return [];
  return [...product.images]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img, index) => ({
      id: img.id,
      url: img.url,
      sort_order: img.sort_order ?? index,
      is_primary: Boolean(img.is_primary) || index === 0,
    }));
}
