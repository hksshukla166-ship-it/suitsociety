import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/shop/info-page-shell";
import { SITE_CONFIG } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for shopping at Suit Society.",
};

export default function TermsPage() {
  return (
    <InfoPageShell
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before placing an order."
    >
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
        <p>
          Welcome to Suit Society. By accessing or using suitsociety.in, you agree to be bound by the
          following terms and conditions. Please read them carefully before placing an order. We may
          update these terms from time to time, and changes take effect as soon as they&apos;re posted here.
        </p>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">1. About Us</h2>
          <p>
            Suit Society is a women&apos;s ethnic clothing brand offering suits, kurtis, 3-piece sets,
            western wear, etc. Our store is located at Kewdabadi Bus Stand Road, Near SBI Bank Chowk,
            Raigarh, Chhattisgarh, 496001.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">2. Eligibility</h2>
          <p>
            By using our website and placing an order, you confirm that you are at least 18 years of age,
            or are placing the order under the supervision of a parent or guardian.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">3. Products &amp; Pricing</h2>
          <p>
            We make every effort to display our products, colours, and details accurately, but slight
            variations may occur due to photography, lighting, or screen settings. All prices listed on the
            website are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.
            We reserve the right to change prices, descriptions, or availability of products at any time
            without prior notice.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">4. Orders</h2>
          <p>
            Placing an order on suitsociety.in constitutes an offer to purchase, which we may accept or
            decline at our discretion — for instance, in cases of stock unavailability, pricing errors, or
            suspected fraud. Once an order is confirmed, it cannot be modified or cancelled. Please refer
            to our Size Guide and check your measurements carefully before ordering, as we do not accept
            returns or exchanges for size or fit issues.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">5. Payments</h2>
          <p>
            All payments are processed securely through Razorpay. We do not store your card, UPI, or banking
            details on our servers. By making a payment, you agree to Razorpay&apos;s applicable terms and
            security protocols.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">6. Shipping</h2>
          <p>
            We currently coordinate shipping and courier tracking manually. Once your order is dispatched,
            our team will share courier and tracking details with you directly over WhatsApp using the
            phone number provided at checkout. Delivery timelines are estimates and may vary due to courier
            delays, weather, or other circumstances beyond our control.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">7. Returns, Exchanges &amp; Refunds</h2>
          <p>
            All sales on Suit Society are final. We do not offer returns, exchanges, or refunds, except in
            cases of a verified manufacturing defect, as outlined in our{" "}
            <Link href="/refund" className="text-gold hover:underline">
              Return &amp; Exchange Policy
            </Link>
            . Please review that policy before placing your order.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">8. Intellectual Property</h2>
          <p>
            All content on this website, including images, product designs, logos, and text, is the property
            of Suit Society and may not be copied, reproduced, or used without our prior written consent.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">9. Limitation of Liability</h2>
          <p>
            Suit Society is not liable for any indirect, incidental, or consequential damages arising from
            the use of our website or products, including delays in delivery or issues beyond our reasonable
            control. Our liability, where applicable, is limited to the value of the order in question.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">10. Governing Law</h2>
          <p>
            These terms are governed by the laws of India, and any disputes arising from them shall be subject
            to the jurisdiction of the courts in Raigarh, Chhattisgarh.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">11. Contact Us</h2>
          <p>For any questions about these terms, reach out to us at:</p>
          <p className="mt-3 font-medium text-foreground">Suit Society</p>
          <p>{SITE_CONFIG.address}</p>
          <p>
            WhatsApp:{" "}
            <a href={`https://wa.me/${SITE_CONFIG.whatsapp}`} className="text-gold hover:underline">
              7974100362
            </a>
          </p>
          <p>
            Email:{" "}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-gold hover:underline">
              {SITE_CONFIG.email}
            </a>
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
