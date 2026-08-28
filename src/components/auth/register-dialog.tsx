"use client";

import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

const initialState = {
  success: false,
  message: "",
};

export function RegisterDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
}: RegisterDialogProps) {
  const [state, formAction, isPending] = useActionState<any, FormData>(
    register,
    initialState
  );

  if (state?.success && open) {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 bg-white shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle
            className="text-2xl font-semibold italic text-slate-900"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            Create an Account
          </DialogTitle>
          <p className="text-xs text-slate-500 font-sans">
            Join Ocean Haven Hotel to easily make and manage bookings
          </p>
        </DialogHeader>

        <form action={formAction} className="space-y-3.5 pt-2 font-sans">
          {state?.message && !state?.success && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {state.message}
            </div>
          )}

          <div>
            <label
              htmlFor="reg-name"
              className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
            >
              Full Name
            </label>
            <Input
              id="reg-name"
              name="name"
              type="text"
              placeholder="Your Name"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-email"
                className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
              >
                Email Address
              </label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                placeholder="your_email@gmail.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reg-phone"
                className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
              >
                Phone Number
              </label>
              <Input
                id="reg-phone"
                name="phone"
                type="tel"
                placeholder="+84 xxx xxx xxx"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="reg-password"
                className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
              >
                Password
              </label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                placeholder="password"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reg-confirm"
                className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1"
              >
                Confirm Password
              </label>
              <Input
                id="reg-confirm"
                name="confirm"
                type="password"
                placeholder="password"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm shadow-xs transition-colors mt-2 h-auto"
          >
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500 font-sans">
          Already have an account?{" "}
          <button
            type="button"
            className="text-[#3d64b0] hover:text-[#0c266d] font-bold hover:underline cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              onSwitchToLogin();
            }}
          >
            Sign In
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
