import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { InfoPageShell } from "@/components/shop/info-page-shell";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Suit Society for orders, support, and enquiries.",
};

export default function ContactPage() {
  return (
    <InfoPageShell
      title="Contact Us"
      subtitle="We would love to hear from you. Reach out for orders, styling advice, or support."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-medium mb-1">Store Address</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{SITE_CONFIG.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gold shrink-0" />
            <div>
              <h2 className="font-medium mb-1">Phone</h2>
              <a href={`tel:${SITE_CONFIG.phone}`} className="text-sm text-muted-foreground hover:text-gold">
                {SITE_CONFIG.phone}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gold shrink-0" />
            <div>
              <h2 className="font-medium mb-1">Email</h2>
              <a href={`mailto:${SITE_CONFIG.email}`} className="text-sm text-muted-foreground hover:text-gold">
                {SITE_CONFIG.email}
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-6 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-gold mt-0.5 shrink-0" />
              <div>
                <h2 className="font-medium mb-1">WhatsApp Support</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For quick order updates and assistance, message us on WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="luxury" className="flex-1">
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/track-order">Track Order</Link>
            </Button>
          </div>
        </div>
      </div>
    </InfoPageShell>
  );
}
