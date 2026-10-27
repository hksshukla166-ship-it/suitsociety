import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/components/providers/cart-provider";
import { WishlistProvider } from "@/context/WishlistContext";
import { SITE_CONFIG } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} | Premium Luxury Fashion`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: "Premium luxury fashion for the modern gentleman. Suits, Blazers, Kurtas, Sherwanis & more. Crafted with excellence in Raigarh.",
  keywords: ["suits", "blazers", "luxury fashion", "raigarh", "menswear", "kurta", "sherwani"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_CONFIG.name,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
