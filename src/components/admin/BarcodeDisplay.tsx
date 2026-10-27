"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface BarcodeDisplayProps {
  value: string;
  productName?: string;
  className?: string;
  showDownload?: boolean;
}

function renderBarcode(svg: SVGSVGElement, value: string) {
  JsBarcode(svg, value, {
    format: "CODE128",
    width: 1.8,
    height: 56,
    displayValue: true,
    fontSize: 14,
    margin: 10,
    background: "#ffffff",
    lineColor: "#000000",
  });
}

function safeFilename(value: string, productName?: string) {
  const base = (productName || value)
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return `${base || value}-barcode`;
}

export function BarcodeDisplay({
  value,
  productName,
  className,
  showDownload = true,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        renderBarcode(svgRef.current, value);
      } catch {
        // invalid barcode value
      }
    }
  }, [value]);

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(value, productName)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new window.Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${safeFilename(value, productName)}.png`;
        link.click();
        URL.revokeObjectURL(pngUrl);
      });
      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  if (!value) return null;

  return (
    <div className={className}>
      <div className="inline-block rounded-lg border bg-white p-3">
        <svg ref={svgRef} />
      </div>
      {showDownload && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
            <Download className="w-4 h-4 mr-1" />
            Download PNG
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
            <Download className="w-4 h-4 mr-1" />
            Download SVG
          </Button>
        </div>
      )}
    </div>
  );
}
