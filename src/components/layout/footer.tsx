import Link from "next/link";
import { Instagram, Mail, Phone, MapPin, Lock } from "lucide-react";
import { SITE_CONFIG } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="bg-luxury-black text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif text-2xl tracking-widest mb-4">
              SUIT <span className="text-gold">SOCIETY</span>
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Premium luxury fashion for the modern women. Crafted with excellence in Raigarh, Chhattisgarh.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href={SITE_CONFIG.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-4 tracking-wider">QUICK LINKS</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/products" className="hover:text-gold transition-colors">Shop All</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-gold transition-colors">New Arrivals</Link></li>
              <li><Link href="/products?sort=best_selling" className="hover:text-gold transition-colors">Best Sellers</Link></li>
              <li><Link href="/flash-sale" className="hover:text-gold transition-colors">Flash Sale</Link></li>
              <li><Link href="/account" className="hover:text-gold transition-colors">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-4 tracking-wider">CUSTOMER CARE</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/track-order" className="hover:text-gold transition-colors">Track Order</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-gold transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/refund" className="hover:text-gold transition-colors">Refund / Return Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/size-chart" className="hover:text-gold transition-colors">Size Chart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-4 tracking-wider">CONTACT</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                <span>{SITE_CONFIG.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                <div className="flex flex-col gap-1">
                  {SITE_CONFIG.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone}`} className="hover:text-gold">
                      {phone}
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-gold">{SITE_CONFIG.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div className="text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} Suit Society. All rights reserved.</p>
            <p className="mt-1">Made by HKS Web Development Company — 9406112110</p>
          </div>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-white/60 hover:text-gold transition-colors"
          >
            <Lock className="w-4 h-4" />
            Admin Portal Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
