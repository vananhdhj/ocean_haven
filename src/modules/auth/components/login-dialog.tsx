"use client";

import { useActionState } from "react";
import { login } from "../actions/auth";
import { AuthActionResult } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

const initialState: AuthActionResult = {
  success: false,
  message: "",
};

export function LoginDialog({
  open,
  onOpenChange,
  onSwitchToRegister,
}: LoginDialogProps) {
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    login,
    initialState
  );

  if (state?.success && open) {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white shadow-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle
            className="text-2xl font-semibold italic text-slate-900"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            Welcome Back
          </DialogTitle>
          <p className="text-xs text-slate-500 font-sans">
            Sign in to manage your bookings and profile
          </p>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 font-sans">
          {state?.message && !state?.success && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {state.message}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
            >
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your_email@gmail.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm shadow-xs transition-colors mt-2 h-auto"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500 font-sans">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="text-[#3d64b0] hover:text-[#0c266d] font-bold hover:underline cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              onSwitchToRegister();
            }}
          >
            Create Account
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
