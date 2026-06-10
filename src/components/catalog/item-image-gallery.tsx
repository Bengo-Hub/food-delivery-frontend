"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { cn, getMediaUrl } from "@/lib/utils";

interface ItemImageGalleryProps {
  images: string[];
  alt: string;
}

export function ItemImageGallery({ images, alt }: ItemImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const navigateLightbox = useCallback(
    (direction: -1 | 1) => {
      if (lightboxIndex === null) return;
      const next = lightboxIndex + direction;
      if (next >= 0 && next < images.length) {
        setLightboxIndex(next);
      }
    },
    [lightboxIndex, images.length],
  );

  // No images — fallback placeholder
  if (!images.length) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <div className="flex size-full items-center justify-center">
          <span className="text-6xl opacity-30">🍽️</span>
        </div>
      </div>
    );
  }

  // Single image — simple display
  if (images.length === 1) {
    return (
      <>
        <div
          className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-muted"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={getMediaUrl(images[0])}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            alt={alt}
            onClose={closeLightbox}
            onNavigate={navigateLightbox}
          />
        )}
      </>
    );
  }

  // Multiple images — horizontal scroll strip
  return (
    <>
      <div className="space-y-2">
        {/* Main large image */}
        <div
          className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-muted"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={getMediaUrl(images[0])}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            1 / {images.length}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openLightbox(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 transition",
                i === 0 ? "ring-primary" : "ring-transparent hover:ring-primary/50",
              )}
            >
              <Image src={getMediaUrl(src)} alt={`${alt} ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          alt={alt}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
}

/** Fullscreen lightbox overlay */
function Lightbox({
  images,
  index,
  alt,
  onClose,
  onNavigate,
}: {
  images: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="size-6" />
      </button>

      {/* Previous */}
      {index > 0 && (
        <button
          type="button"
          className="absolute left-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(-1);
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative h-[80vh] w-[90vw] max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={getMediaUrl(images[index])}
          alt={`${alt} ${index + 1}`}
          fill
          className="object-contain"
          sizes="90vw"
        />
      </div>

      {/* Next */}
      {index < images.length - 1 && (
        <button
          type="button"
          className="absolute right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(1);
          }}
          aria-label="Next image"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-sm text-white">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
