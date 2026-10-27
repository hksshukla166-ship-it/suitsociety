import type { Metadata } from "next";
import { Package, MessageCircle, Truck } from "lucide-react";
import { InfoPageShell } from "@/components/shop/info-page-shell";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your Suit Society order and delivery updates.",
};

const cards = [
  {
    icon: Package,
    title: "Order Confirmation",
    description:
      "Once your order is successfully placed, a confirmation message containing your complete order details will be sent to the WhatsApp number provided during checkout.",
  },
  {
    icon: MessageCircle,
    title: "Tracking Information",
    description:
      "Your courier tracking number will be shared on your registered WhatsApp number within approximately 3 days after order placement.",
  },
  {
    icon: Truck,
    title: "Track Shipment",
    description:
      "Use the tracking number to monitor your shipment directly from the courier company's official tracking website.",
  },
];

export default function TrackOrderPage() {
  return (
    <InfoPageShell
      title="Track Order"
      subtitle="Stay updated on your order from confirmation to delivery."
    >
      <div className="grid gap-5 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-border/60 bg-muted/20 p-6 md:p-8 flex gap-4 md:gap-5"
          >
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <card.icon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-xl tracking-wide mb-2">{card.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </InfoPageShell>
  );
}
