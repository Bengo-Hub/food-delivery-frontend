"use client";

import { ShieldAlert } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AGE_VERIFIED_KEY = "age_verified";

/**
 * Checks if the user has already confirmed age verification in this session.
 */
function isAgeVerified(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AGE_VERIFIED_KEY) === "true";
}

function setAgeVerified(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AGE_VERIFIED_KEY, "true");
}

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgeVerificationModal({ open, onConfirm, onCancel }: AgeVerificationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
            <ShieldAlert className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">Age Verification Required</DialogTitle>
          <DialogDescription className="text-center">
            This item requires age verification. You must be 18 years or older to purchase this
            product.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setAgeVerified();
              onConfirm();
            }}
            className="w-full sm:w-auto"
          >
            I confirm I am 18+
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook that manages age verification state.
 * Shows the modal only once per session.
 */
export function useAgeVerification() {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const showModal = pendingAction !== null;

  const requireVerification = useCallback(
    (action: () => void) => {
      if (isAgeVerified()) {
        action();
      } else {
        setPendingAction(() => action);
      }
    },
    [],
  );

  const onConfirm = useCallback(() => {
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const onCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  return { showModal, requireVerification, onConfirm, onCancel };
}
