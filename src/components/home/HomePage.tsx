"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Play, Tag } from "lucide-react";
import { ProductCard, CountdownTimer } from "@/components/product/ProductCard";
import type { Product, HeroSlide, Banner, Category, HomepageVideo, HappyCustomer, Coupon, FlashSale } from "@/types";
import { formatPrice } from "@/lib/utils";

interface HomePageProps {
  heroSlides: HeroSlide[];
  banners: Banner[];
  featuredProducts: Product[];
  newArrivals: Product[];
  trending: Product[];
  bestSellers: Product[];
  todaysDeals: Product[];
  categories: Category[];
  videos: HomepageVideo[];
  happyCustomers: HappyCustomer[];
  flashSales: FlashSale[];
  activeCoupons: Coupon[];
}

export function HomePage({
  heroSlides,
  banners,
  featuredProducts,
  newArrivals,
  trending,
  bestSellers,
  todaysDeals,
  categories,
  videos,
  happyCustomers,
  flashSales,
  activeCoupons,
}: HomePageProps) {
  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <PromoBannerStrip banners={banners} />

      {flashSales.length > 0 && (
        <FlashSaleSection flashSales={flashSales} />
      )}

      {activeCoupons.length > 0 && (
        <FlashOffersSection coupons={activeCoupons} />
      )}

      {categories.length > 0 && (
        <CategorySection categories={categories} />
      )}

      {featuredProducts.length > 0 && (
        <ProductSection title="Featured Collections" products={featuredProducts} viewAllHref="/shop?featured=true" />
      )}

      {newArrivals.length > 0 && (
        <ProductSection title="New Arrivals" products={newArrivals} viewAllHref="/shop?sort=newest" />
      )}

      {videos.length > 0 && (
        <VideoSection videos={videos} />
      )}

      {todaysDeals.length > 0 && (
        <ProductSection title="Today's Deals" products={todaysDeals} viewAllHref="/shop?todaysDeal=true" dark />
      )}

      {trending.length > 0 && (
        <ProductSection title="Trending Now" products={trending} viewAllHref="/shop?sort=popular" />
      )}

      {bestSellers.length > 0 && (
        <ProductSection title="Best Sellers" products={bestSellers} viewAllHref="/shop?sort=best_selling" />
      )}

      {happyCustomers.length > 0 && (
        <HappyCustomersSection customers={happyCustomers} />
      )}
    </>
  );
}

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="relative h-[60vh] md:h-[80vh] luxury-gradient flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="font-serif text-4xl md:text-6xl mb-4">SUIT SOCIETY</h1>
          <p className="text-white/70 text-lg mb-8">Premium Luxury Menswear</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-charcoal font-medium tracking-wider hover:bg-gold-light transition-colors">
            Explore Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[60vh] md:h-[80vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image_url}
            alt={slides[current].title || "Hero"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-white"
          >
            {slides[current].subtitle && (
              <p className="text-gold tracking-[0.3em] uppercase text-sm mb-3">{slides[current].subtitle}</p>
            )}
            {slides[current].title && (
              <h1 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">{slides[current].title}</h1>
            )}
            {slides[current].link_url && (
              <Link
                href={slides[current].link_url!}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-charcoal font-medium tracking-wider hover:bg-gold-light transition-colors"
              >
                {slides[current].button_text || "Shop Now"} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gold w-6" : "bg-white/50"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function PromoBannerStrip({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;

  return (
    <div className="bg-gold py-3 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex">
        {[...banners, ...banners].map((banner, i) => (
          <span key={i} className="mx-8 text-charcoal text-sm font-medium tracking-wider">
            {banner.title} {banner.subtitle && `— ${banner.subtitle}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlashSaleSection({ flashSales }: { flashSales: FlashSale[] }) {
  const sale = flashSales[0];
  if (!sale) return null;

  return (
    <section className="py-16 bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <p className="text-gold tracking-[0.3em] uppercase text-sm mb-2">Limited Time</p>
            <h2 className="font-serif text-3xl md:text-4xl">{sale.title}</h2>
          </div>
          <CountdownTimer endDate={sale.ends_at} />
        </div>
        <Link href="/flash-sale" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
          View All Flash Sale Items <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function FlashOffersSection({ coupons }: { coupons: Coupon[] }) {
  return (
    <section className="py-12 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-serif text-2xl md:text-3xl text-center mb-8">Flash Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="glass rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-medium">{coupon.title}</p>
                <p className="text-sm text-gray-500">
                  Use code: <span className="font-mono font-bold text-gold">{coupon.code}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}% off`
                    : `${formatPrice(coupon.discount_value)} off`}
                  {coupon.min_order_value > 0 && ` on orders above ${formatPrice(coupon.min_order_value)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-serif text-3xl text-center mb-10">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden"
            >
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal to-zinc-700" />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-end p-4">
                <span className="text-white font-serif text-lg">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection({
  title,
  products,
  viewAllHref,
  dark = false,
}: {
  title: string;
  products: Product[];
  viewAllHref: string;
  dark?: boolean;
}) {
  return (
    <section className={`py-16 ${dark ? "bg-charcoal text-white" : ""}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="font-serif text-3xl">{title}</h2>
          <Link href={viewAllHref} className="text-sm tracking-wider uppercase hover:text-gold transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoSection({ videos }: { videos: HomepageVideo[] }) {
  return (
    <section className="py-16 bg-cream">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-serif text-3xl text-center mb-10">Experience Suit Society</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="relative aspect-video rounded-xl overflow-hidden group">
              {video.thumbnail_url ? (
                <Image src={video.thumbnail_url} alt={video.title || "Video"} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-charcoal" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-charcoal ml-1" />
                </div>
              </div>
              {video.title && (
                <div className="absolute bottom-4 left-4 text-white font-medium">{video.title}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HappyCustomersSection({ customers }: { customers: HappyCustomer[] }) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-serif text-3xl text-center mb-10">Happy Customers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {customers.map((customer) => (
            <div key={customer.id} className="relative aspect-square rounded-lg overflow-hidden group">
              <Image src={customer.image_url} alt={customer.customer_name || "Customer"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
