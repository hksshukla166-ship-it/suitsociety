import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/shop/info-page-shell";
import { SITE_CONFIG } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Return & Exchange Policy",
  description: "Return and exchange policy for Suit Society orders.",
};

export default function RefundPage() {
  return (
    <InfoPageShell
      title="Return & Exchange Policy"
      subtitle="All sales are final — no returns, no exchanges, no refunds. Please read this policy fully before placing your order."
    >
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">1. Orders are final</h2>
          <p>
            Once an order is placed, it cannot be cancelled, returned, or exchanged. We&apos;re unable to
            make changes after checkout, so please confirm your details before you order.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">2. No refunds, no exchanges</h2>
          <p>
            This applies to all products across the Suit Society catalogue, without exception, including
            sizing preferences and change of mind.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">3. Quality, checked by hand</h2>
          <p>
            Every article passes through a dedicated quality and packaging team before it ships, so you can
            trust that what arrives is free of defects.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">4. Measure before you order</h2>
          <p>
            Use our size guide to measure your garment correctly before placing your order.{" "}
            <Link href="/size-chart" className="text-gold hover:underline">
              View the size guide
            </Link>
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">5. If something&apos;s genuinely wrong</h2>
          <p>
            In the rare case of a manufacturing defect, send us an <strong>unboxing video</strong> of the
            article over WhatsApp within 48 hours of delivery along with Order ID. Claims sent after this
            window can&apos;t be reviewed.
          </p>
          <p className="mt-3">
            If our team confirms the defect, we will issue store credit for the value of the item, redeemable
            on any other product on{" "}
            <a href="https://suitsociety.in" className="text-gold hover:underline">
              suitsociety.in
            </a>
            .
          </p>
          <p className="mt-3">
            WhatsApp:{" "}
            <a href={`https://wa.me/${SITE_CONFIG.whatsapp}`} className="text-gold hover:underline">
              7974100362
            </a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
