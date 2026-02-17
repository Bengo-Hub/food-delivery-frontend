"use client";

import { CheckCircle2, Loader2, MailIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { api } from "@/lib/api/base";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const next = [...digits];
      next[index] = value.slice(-1);
      setDigits(next);

      // Auto-advance to next field
      if (value && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
      if (!pasted) return;
      e.preventDefault();
      const next = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);
      const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
    },
    [digits],
  );

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  async function handleVerify() {
    if (!isComplete) return;
    setVerifying(true);
    try {
      await api.post(`${orgSlug}/auth/verify-email`, { email, code });
      setVerified(true);
      toast.success("Email verified successfully!");
      setTimeout(() => {
        router.push(orgRoute(orgSlug, "/menu"));
      }, 1500);
    } catch {
      toast.error("Invalid code. Please try again.");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await api.post(`${orgSlug}/auth/resend-verification`, { email });
      toast.success("Verification code resent!");
      setResendTimer(RESEND_COOLDOWN);
    } catch {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-12">
        <Card className="w-full">
          <CardHeader className="items-center text-center">
            {verified ? (
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <CheckCircle2 className="size-8" />
              </div>
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis">
                <MailIcon className="size-8" />
              </div>
            )}
            <h1 className="mt-4 text-2xl font-semibold text-foreground">
              {verified ? "Email Verified!" : "Verify your email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {verified ? (
                "Redirecting you to the menu..."
              ) : email ? (
                <>
                  We sent a {CODE_LENGTH}-digit code to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </>
              ) : (
                `Enter the ${CODE_LENGTH}-digit code sent to your email`
              )}
            </p>
          </CardHeader>

          {!verified && (
            <CardContent className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <Input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="size-12 text-center text-xl font-semibold sm:size-14 sm:text-2xl"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <Button
                className="w-full"
                disabled={!isComplete || verifying}
                onClick={() => void handleVerify()}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              {/* Resend */}
              <div className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    onClick={() => void handleResend()}
                    disabled={resending}
                    className="font-medium text-brand-emphasis hover:underline disabled:opacity-50"
                  >
                    {resending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </SiteShell>
  );
}
