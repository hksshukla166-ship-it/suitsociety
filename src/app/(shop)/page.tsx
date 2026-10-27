import Link from "next/link";

import Image from "next/image";

import { getHomepageData, getProducts } from "@/actions/products";

import { ProductCard } from "@/components/shop/product-card";

import { Button } from "@/components/ui/button";

import { HeroCarousel } from "@/components/shop/hero-carousel";

import { FlashSaleSection } from "@/components/shop/flash-sale-section";

import { HomepageVideos } from "@/components/shop/homepage-videos";

import { CustomerReviewsSection } from "@/components/shop/customer-reviews-section";

import { NewsletterForm } from "@/components/shop/newsletter-form";

import { ArrowRight, Sparkles } from "lucide-react";

const HOMEPAGE_PRODUCT_LIMIT = 20;

export default async function HomePage() {
  const [homepage, { products, total }] = await Promise.all([
    getHomepageData(),
    getProducts({ limit: HOMEPAGE_PRODUCT_LIMIT, sort: "newest" }),
  ]);



  return (

    <div className="space-y-12 md:space-y-16">

      {/* Hero — compact when products exist */}

      {homepage.heroes.length > 0 ? (

        <HeroCarousel heroes={homepage.heroes} compact />

      ) : (

        <section className="relative h-[45vh] md:h-[55vh] bg-luxury-black flex items-center justify-center">

          <div className="text-center text-white space-y-4 px-4">

            <p className="text-gold tracking-[0.3em] text-sm uppercase">Premium Luxury Fashion</p>

            <h1 className="font-serif text-3xl md:text-6xl tracking-wider">

              SUIT <span className="text-gold">SOCIETY</span>

            </h1>

            <p className="text-white/70 max-w-lg mx-auto text-sm md:text-base">Crafted with excellence for the modern gentleman</p>

          </div>

        </section>

      )}



      {/* Watch & Shop — videos first */}
      <HomepageVideos videos={homepage.videos} />

      {/* Shop Collection — products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="font-serif text-2xl md:text-4xl tracking-wider">SHOP COLLECTION</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {total > 0 ? `${total}+ premium styles` : "New arrivals coming soon"}
            </p>
          </div>
          <Link href="/products" className="text-sm tracking-wider hover:text-gold flex items-center gap-1 shrink-0">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} showBadge={p.is_new_arrival ? "new" : p.is_trending ? "trending" : null} />
              ))}
            </div>
            {total > HOMEPAGE_PRODUCT_LIMIT && (
              <div className="flex justify-center mt-8 md:mt-10">
                <Link href="/products">
                  <Button variant="luxury" size="lg" className="px-10 tracking-wider">
                    View More <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-xl">
            <p className="text-muted-foreground mb-4">Products will appear here once added from admin panel.</p>
            <Link href="/admin/login"><Button variant="luxury">Admin Panel</Button></Link>
          </div>
        )}
      </section>



      {/* Flash Sale */}

      {homepage.flashSales.length > 0 && <FlashSaleSection flashSales={homepage.flashSales} />}



      {/* Promotional Banners */}

      {homepage.banners.length > 0 && (

        <section className="container mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {homepage.banners.map((banner) => (

              <Link key={banner.id} href={banner.link_url || "/products"} className="group relative aspect-[16/7] overflow-hidden rounded-lg">

                <Image src={banner.image_url} alt={banner.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">

                  <div>

                    <h3 className="text-white font-serif text-xl">{banner.title}</h3>

                    {banner.subtitle && <p className="text-white/70 text-sm">{banner.subtitle}</p>}

                  </div>

                </div>

              </Link>

            ))}

          </div>

        </section>

      )}



      {/* Categories */}

      {homepage.categories.length > 0 && (

        <section id="shop-by-category" className="container mx-auto px-4">

          <div className="text-center mb-8">

            <h2 className="font-serif text-3xl tracking-wider">SHOP BY CATEGORY</h2>

          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-md md:max-w-none mx-auto md:mx-0">

            {homepage.categories.map((cat) => (

              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">

                {cat.image_url ? (

                  <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />

                ) : (

                  <div className="absolute inset-0 luxury-gradient" />

                )}

                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">

                  <h3 className="text-white font-serif text-sm md:text-base tracking-wider text-center px-2">{cat.name}</h3>

                </div>

              </Link>

            ))}

          </div>

        </section>

      )}



      {/* Active Coupons */}

      {homepage.coupons.length > 0 && (

        <section className="bg-luxury-black text-white py-10">

          <div className="container mx-auto px-4">

            <div className="flex items-center gap-2 mb-6">

              <Sparkles className="w-5 h-5 text-gold" />

              <h2 className="font-serif text-2xl tracking-wider">FLASH OFFERS</h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {homepage.coupons.map((coupon) => (

                <div key={coupon.id} className="border border-gold/30 rounded-lg p-5">

                  <p className="text-gold text-xs tracking-widest uppercase mb-1">Use Code</p>

                  <p className="font-serif text-xl tracking-wider">{coupon.code}</p>

                  <p className="text-white/70 text-sm mt-1">{coupon.title}</p>

                </div>

              ))}

            </div>

          </div>

        </section>

      )}



      {/* Happy Customers */}

      {homepage.happyCustomers.length > 0 && (

        <section className="container mx-auto px-4">

          <h2 className="font-serif text-3xl tracking-wider text-center mb-8">HAPPY CUSTOMERS</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {homepage.happyCustomers.map((customer) => (

              <div key={customer.id} className="relative aspect-square rounded-lg overflow-hidden">

                <Image src={customer.image_url} alt={customer.customer_name || "Happy Customer"} fill className="object-cover" />

              </div>

            ))}

          </div>

        </section>

      )}



      {/* Customer Reviews */}

      {homepage.reviews.length > 0 && (
        <CustomerReviewsSection reviews={homepage.reviews} />
      )}



      {/* Newsletter */}

      <section className="bg-luxury-black text-white py-14">

        <div className="container mx-auto px-4 text-center max-w-xl">

          <h2 className="font-serif text-3xl tracking-wider mb-4">STAY IN STYLE</h2>

          <p className="text-white/70 mb-6">Subscribe for exclusive offers and new collection updates</p>

          <NewsletterForm />

        </div>

      </section>

    </div>

  );

}

