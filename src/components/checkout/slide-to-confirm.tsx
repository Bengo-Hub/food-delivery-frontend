"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlideToConfirmProps {
  onConfirm: () => void;
  loading: boolean;
  label?: string;
  total?: number;
}

const THRESHOLD = 0.85; // 85% of track width to confirm

export function SlideToConfirm({
  onConfirm,
  loading,
  label,
  total,
}: SlideToConfirmProps) {
  const displayLabel =
    label || (total !== undefined ? `Place Order - KES ${total.toLocaleString()}` : "Place Order");

  return (
    <>
      {/* Mobile: slide gesture */}
      <div className="sm:hidden">
        <SlideTrack
          onConfirm={onConfirm}
          loading={loading}
          label={displayLabel}
        />
      </div>

      {/* Desktop: regular button */}
      <div className="hidden sm:block">
        <Button
          className="w-full min-h-[48px]"
          size="lg"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Placing Order...
            </>
          ) : (
            displayLabel
          )}
        </Button>
      </div>
    </>
  );
}

function SlideTrack({
  onConfirm,
  loading,
  label,
}: {
  onConfirm: () => void;
  loading: boolean;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const startXRef = useRef(0);
  const thumbSize = 48;

  const getMaxOffset = useCallback(() => {
    if (!trackRef.current) return 200;
    return trackRef.current.clientWidth - thumbSize - 8; // 8px for padding
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (loading || confirmed) return;
      setIsDragging(true);
      startXRef.current = e.touches[0].clientX - offsetX;
    },
    [loading, confirmed, offsetX],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || loading || confirmed) return;
      const maxOffset = getMaxOffset();
      const x = Math.max(0, Math.min(e.touches[0].clientX - startXRef.current, maxOffset));
      setOffsetX(x);
    },
    [isDragging, loading, confirmed, getMaxOffset],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || loading || confirmed) return;
    setIsDragging(false);
    const maxOffset = getMaxOffset();
    if (offsetX / maxOffset >= THRESHOLD) {
      setConfirmed(true);
      setOffsetX(maxOffset);
      onConfirm();
    } else {
      setOffsetX(0);
    }
  }, [isDragging, loading, confirmed, offsetX, getMaxOffset, onConfirm]);

  // Reset when loading finishes after a failed attempt
  useEffect(() => {
    if (!loading && confirmed) {
      // Keep confirmed state — parent will navigate away on success
    }
    if (!loading && !confirmed) {
      setOffsetX(0);
    }
  }, [loading, confirmed]);

  const maxOffset = getMaxOffset();
  const progress = maxOffset > 0 ? offsetX / maxOffset : 0;

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative flex h-14 items-center rounded-full px-1",
        confirmed || loading ? "bg-primary/20" : "bg-primary",
      )}
    >
      {/* Background label */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-primary-foreground"
        style={{ opacity: Math.max(0, 1 - progress * 2) }}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Placing Order...
          </span>
        ) : (
          <>Slide to confirm &mdash; {label}</>
        )}
      </span>

      {/* Draggable thumb */}
      {!loading && (
        <div
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full bg-white shadow-md",
            isDragging ? "scale-105" : "transition-transform",
          )}
          style={{
            width: thumbSize,
            height: thumbSize,
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <ArrowRight className="size-5 text-primary" />
        </div>
      )}
    </div>
  );
}
