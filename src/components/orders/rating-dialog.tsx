"use client";

import { useState } from "react";
import { Loader2, Star, X } from "lucide-react";

import { useRateOrder } from "@/hooks/use-orders";
import { toast } from "@/lib/toast";

interface RatingDialogProps {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export function RatingDialog({ orderId, orderNumber, onClose }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const rateOrder = useRateOrder();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    try {
      await rateOrder.mutateAsync({ orderId, rating, comment });
      toast.success("Thanks for your rating!");
      onClose();
    } catch {
      toast.error("Failed to submit rating. Please try again.");
    }
  };

  const displayed = hovered || rating;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-background p-6 shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Rate your order</h2>
            <p className="text-sm text-muted-foreground">Order #{orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Stars */}
        <div className="mb-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform active:scale-90"
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={`size-10 transition-colors ${
                  star <= displayed
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Label */}
        <p className="mb-4 text-center text-sm font-medium text-primary min-h-[20px]">
          {displayed > 0 ? LABELS[displayed] : ""}
        </p>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share what you loved or what could be improved... (optional)"
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/500</p>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || rateOrder.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {rateOrder.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
}
