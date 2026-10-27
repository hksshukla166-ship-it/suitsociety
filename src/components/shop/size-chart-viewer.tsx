"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SizeChartViewerProps {
  imageUrl: string;
}

export function SizeChartViewer({ imageUrl }: SizeChartViewerProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setZoomed((prev) => !prev)}
          className="gap-2"
        >
          {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          {zoomed ? "Zoom Out" : "Zoom In"}
        </Button>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20 ${
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        onClick={() => setZoomed((prev) => !prev)}
      >
        <div className={`relative w-full ${zoomed ? "aspect-auto min-h-[70vh]" : "aspect-[3/4] md:aspect-[16/10]"}`}>
          <Image
            src={imageUrl}
            alt="Size Chart"
            fill
            className={`object-contain transition-transform duration-300 ${zoomed ? "scale-150" : "scale-100"}`}
            sizes="(max-width: 768px) 100vw, 900px"
            loading="lazy"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tap or click the image to toggle zoom. Measurements may vary slightly by style.
      </p>
    </div>
  );
}
