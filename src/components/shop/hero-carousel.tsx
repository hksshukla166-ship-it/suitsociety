"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HomepageHero } from "@/types";

export function HeroCarousel({ heroes, compact = false }: { heroes: HomepageHero[]; compact?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {heroes.map((hero) => (
            <div key={hero.id} className={`flex-[0_0_100%] relative ${compact ? "h-[32vh] md:h-[40vh]" : "h-[70vh] md:h-[85vh]"}`}>
              <Image
                src={hero.image_url}
                alt={hero.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4 md:px-8">
                  <div className="max-w-xl text-white space-y-4 animate-slide-up">
                    {hero.subtitle && (
                      <p className="text-gold tracking-[0.3em] text-sm uppercase">{hero.subtitle}</p>
                    )}
                    <h1 className="font-serif text-4xl md:text-6xl tracking-wider leading-tight">{hero.title}</h1>
                    {hero.link_url && (
                      <Link href={hero.link_url}>
                        <Button variant="gold" size="lg" className="mt-4">{hero.button_text}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/40 transition-colors">
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/40 transition-colors">
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {heroes.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex ? "bg-gold w-6" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
