import type { Metadata } from "next";
import { InfoPageShell } from "@/components/shop/info-page-shell";
import { SITE_CONFIG } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Suit Society — how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell
      title="Privacy Policy"
      subtitle="How we handle your personal information when you shop with Suit Society."
    >
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
        <p>
          We value the trust you place in Suit Society. By using and/or accessing our website, you agree to
          the terms of this privacy policy. This policy may be updated from time to time, and changes take
          effect as soon as they&apos;re posted here — please check back periodically.
        </p>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">1. Information We Collect</h2>
          <p>
            When you place an order with us, we collect your name, email address, phone number, and
            shipping/billing address. We use this information to process your order, communicate with you
            about it, and occasionally send you offers and updates.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">2. How We Use Your Information</h2>
          <p>
            We use your information to fulfil your order, respond to queries, resolve any issues, and improve
            our products and service. We may use your contact details, including WhatsApp, to send you order
            and shipping updates, since we currently coordinate courier and tracking details manually rather
            than through automated website integration. We use your information for marketing — you can opt
            out at any time by messaging us.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">3. Payments</h2>
          <p>
            All payments on suitsociety.in are processed securely through Razorpay. We do not store your card,
            UPI, or banking details on our servers — this information is handled directly and securely by
            Razorpay in accordance with their own security standards.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">4. Order &amp; Shipping Communication</h2>
          <p>
            As we don&apos;t currently have courier tracking integrated with our website, our team sends
            shipping and tracking details to you directly over WhatsApp using the phone number provided at
            checkout. Please ensure your contact number is accurate so we can keep you updated on your order.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">5. Cookies</h2>
          <p>
            Our website may use cookies to remember your preferences and improve your browsing experience.
            Cookies don&apos;t contain any personally identifiable information. You can disable cookies through
            your browser settings, though this may affect how parts of the website function.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">6. Sharing of Information</h2>
          <p>
            We do not sell or rent your personal information to third parties. We only share your information
            where necessary — for example, with Razorpay to process payments, or with couriers to deliver your
            order. We may also disclose information if required by law.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">7. Security</h2>
          <p>
            We take reasonable precautions to protect your personal information against unauthorized access,
            misuse, or loss. Access to customer data is limited to what&apos;s needed to process and fulfil
            your orders.
          </p>
        </section>

        <section className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h2 className="font-serif text-xl text-foreground mb-3">8. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or how your information is handled, you can
            reach us at:
          </p>
          <p className="mt-3">
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
          <p className="mt-3 font-medium text-foreground">Suit Society</p>
          <p>{SITE_CONFIG.address}</p>
        </section>
      </div>
    </InfoPageShell>
  );
}
