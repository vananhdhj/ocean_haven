"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Waves, Menu, Shield, User, LogOut, X } from "lucide-react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { RegisterDialog } from "@/components/auth/register-dialog";
import { logout } from "@/lib/actions/auth";

interface NavbarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    role: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("login") === "1") {
      setLoginOpen(true);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("login");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group text-left">
            <div className="w-8 h-8 rounded-lg bg-[#3d64b0] text-white flex items-center justify-center shadow-xs group-hover:bg-[#0c266d] transition-colors">
              <Waves className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 font-sans not-italic">
                Ocean Haven
              </span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-bold font-sans not-italic">
                Hotel
              </span>
            </div>
          </Link>

          {/* Desktop Menu Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                pathname === "/"
                  ? "bg-slate-100 text-[#3d64b0]"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Home
            </Link>
            <Link
              href="/rooms"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                pathname.startsWith("/rooms")
                  ? "bg-slate-100 text-[#3d64b0]"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Rooms
            </Link>
            <a
              href="#footer"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Contact
            </a>
            {user && user.role === "admin" && (
              <Link
                href="/admin"
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-1 text-sky-700 hover:bg-sky-50 ${
                  pathname.startsWith("/admin") ? "bg-sky-100 font-bold" : ""
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-900/15 to-sky-500/15 border border-slate-900 text-[#3d64b0] hover:border-slate-500 font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
                  title={user.name || user.email}
                  aria-label="Open profile"
                >
                  <span>{getUserInitial()}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:inline-flex p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-1.5 rounded-full font-semibold text-sm transition-colors shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="w-9 h-9 rounded-lg border border-slate-200 flex md:hidden items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 shadow-md flex flex-col gap-1 z-39">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              pathname === "/"
                ? "bg-slate-100 text-[#3d64b0]"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Home
          </Link>
          <Link
            href="/rooms"
            onClick={() => setMobileOpen(false)}
            className={`w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              pathname.startsWith("/rooms")
                ? "bg-slate-100 text-[#3d64b0]"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Rooms
          </Link>
          <a
            href="#footer"
            onClick={() => setMobileOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Contact
          </a>

          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                My Account
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg text-sky-700 hover:bg-sky-50 flex items-center gap-2 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setMobileOpen(false);
                  setLoginOpen(true);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0ea5e9] hover:bg-sky-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setMobileOpen(false);
                  setRegisterOpen(true);
                }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auth Modals */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </>
  );
}
