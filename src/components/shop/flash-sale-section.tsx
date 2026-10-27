"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlashSale } from "@/types";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex gap-3">
      {[
        { val: timeLeft.hours, label: "HRS" },
        { val: timeLeft.minutes, label: "MIN" },
        { val: timeLeft.seconds, label: "SEC" },
      ].map((t) => (
        <div key={t.label} className="text-center">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center font-mono text-xl font-bold">
            {pad(t.val)}
          </div>
          <p className="text-xs mt-1 text-white/60">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

export function FlashSaleSection({ flashSales }: { flashSales: FlashSale[] }) {
  const sale = flashSales[0];
  if (!sale) return null;

  return (
    <section className="bg-gradient-to-r from-luxury-black via-luxury-charcoal to-luxury-black text-white py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <Zap className="w-8 h-8 text-gold" />
          <div>
            <h2 className="font-serif text-2xl md:text-3xl tracking-wider">{sale.title}</h2>
            <p className="text-gold text-lg mt-1">{sale.discount_percentage}% OFF on selected items</p>
          </div>
        </div>
        <CountdownTimer endsAt={sale.ends_at} />
        <Link href="/flash-sale">
          <Button variant="gold" size="lg">Shop Flash Sale</Button>
        </Link>
      </div>
    </section>
  );
}
