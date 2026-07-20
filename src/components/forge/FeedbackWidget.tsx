"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle2, Loader2, Star } from "lucide-react";
import { useForge } from "@/lib/forge/store";
import { cn } from "@/lib/utils";

type SubmitState = "idle" | "loading" | "success" | "error";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const view = useForge((s) => s.view);

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      setErrorMsg("Please write at least a few words.");
      return;
    }
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
          rating: rating ?? undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          view,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState("success");
      setMessage("");
      setEmail("");
      setRating(null);
      // Auto-close after 2.5s
      setTimeout(() => {
        setOpen(false);
        setState("idle");
      }, 2500);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setErrorMsg(err?.message ?? "Something went wrong.");
      setState("error");
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setState("idle"); setErrorMsg(null); } }}>
      <PopoverTrigger asChild>
        <button
          className="group fixed bottom-5 left-5 z-[700] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-violet-500/40 active:scale-95"
          aria-label="Send feedback"
          title="Tell us what's broken, what's confusing, or what's missing"
        >
          <MessageSquare className="h-5 w-5 transition-transform group-hover:-rotate-12" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-80 p-0 border-slate-200 shadow-xl"
      >
        {state === "success" ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900">Thanks for the feedback!</div>
            <div className="text-xs text-slate-500">We read every message.</div>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 p-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-slate-900">Send feedback</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                What broke? What confused you? What's missing? Be honest — we read everything.
              </p>
            </div>
            <div className="space-y-3 p-3">
              {/* Rating */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-600">How's it going so far? <span className="text-slate-400">(optional)</span></Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? null : n)}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-md transition-colors",
                        rating && n <= rating
                          ? "text-amber-400"
                          : "text-slate-300 hover:text-amber-300"
                      )}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star className={cn("h-4 w-4", rating && n <= rating && "fill-current")} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-message" className="text-[11px] font-medium text-slate-600">
                  Your feedback
                </Label>
                <Textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="The auditor scored my page 40 but I can't tell why…"
                  rows={4}
                  className="text-xs resize-none"
                  maxLength={5000}
                />
                <div className="text-right text-[10px] text-slate-400">{message.length}/5000</div>
              </div>
              {/* Email (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-email" className="text-[11px] font-medium text-slate-600">
                  Email <span className="text-slate-400">(if you want a reply)</span>
                </Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-8 text-xs"
                />
              </div>
              {/* Error */}
              {errorMsg && (
                <div className="rounded-md bg-red-50 border border-red-200 px-2.5 py-1.5 text-[11px] text-red-700">
                  {errorMsg}
                </div>
              )}
              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={state === "loading" || message.trim().length < 5}
                className="w-full h-8 gap-1.5 text-xs bg-gradient-to-br from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600"
              >
                {state === "loading" ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Send feedback</>
                )}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
