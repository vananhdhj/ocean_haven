import Link from "next/link";
import { Waves, MapPin, PhoneIncoming, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white pt-12 pb-6 mt-auto border-t border-slate-800" id="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-7 h-7 rounded-md bg-[#0c266d] text-white flex items-center justify-center shadow-xs">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white font-sans text-base">Ocean Haven Hotel</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-sans">
              22 rooms. 3 floors. One ocean view. Da Nang, Vietnam.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-sans not-italic">
              Contact
            </h3>
            <div className="flex flex-col gap-3 text-sm text-slate-300 font-sans">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>123 Vo Nguyen Giap, Da Nang</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIncoming className="w-4 h-4 text-slate-400 shrink-0" />
                <span>+84 236 888 888</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>hello@oceanhavenhotel.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 font-sans">
          <p>© 2025 Ocean Haven Hotel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
