"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeDownloadButtonProps {
  value: string;
  productName?: string;
}

function renderBarcode(svg: SVGSVGElement, value: string) {
  JsBarcode(svg, value, {
    format: "CODE128",
    width: 1.5,
    height: 40,
    displayValue: true,
    fontSize: 12,
    margin: 6,
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

export function BarcodeDownloadButton({ value, productName }: BarcodeDownloadButtonProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        renderBarcode(svgRef.current, value);
      } catch {
        // ignore invalid values
      }
    }
  }, [value]);

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

  if (!value) return null;

  return (
    <div className="inline-flex items-center gap-1">
      <svg ref={svgRef} className="hidden" aria-hidden />
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={downloadPng}>
        <Download className="w-3 h-3 mr-1" />
        PNG
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={downloadSvg}>
        <Download className="w-3 h-3 mr-1" />
        SVG
      </Button>
    </div>
  );
}
