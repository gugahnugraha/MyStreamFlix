import React, { useState, useEffect } from "react";
import { Film, Github, Twitter, Instagram, Youtube, Mail, HelpCircle, Shield, Globe, Heart, ExternalLink, Tv } from "lucide-react";
import { CMSSettings } from "../types";

interface FooterProps {
  settings: CMSSettings;
  setActiveTab: (tab: string) => void;
  onSelectContentType: (type: "all" | "movie" | "series") => void;
  onOpenSubscription: () => void;
  onOpenAuth: () => void;
  t: any;
}

export default function Footer({
  settings,
  setActiveTab,
  onSelectContentType,
  onOpenSubscription,
  onOpenAuth,
  t,
}: FooterProps) {
  const [userThemeColor, setUserThemeColor] = useState<string | null>(null);

  useEffect(() => {
    const handleThemeSync = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user-theme-primary");
        setUserThemeColor(stored);
      }
    };

    handleThemeSync();
    window.addEventListener('themechange', handleThemeSync);
    return () => window.removeEventListener('themechange', handleThemeSync);
  }, []);

  const brandColor = userThemeColor || settings.primaryColor || "#E50914";

  const handleNav = (tab: string, type?: "all" | "movie" | "series") => {
    setActiveTab(tab);
    if (type) {
      onSelectContentType(type);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#070708] border-t border-zinc-900/80 pt-16 pb-8 px-4 md:px-8 mt-auto overflow-hidden">
      {/* Decorative top ambient glow matching site theme */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] opacity-30 blur-xs"
        style={{
          background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`
        }}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-900">
        {/* Brand & Tagline Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNav("home", "all")}>
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300 ring-1 ring-white/10" 
              style={{ backgroundColor: brandColor }}
            >
              <Film className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-black tracking-wider text-white">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.logoText || "Logo"} className="max-h-6 object-contain" />
              ) : (
                settings.logoText || "FLIXSPHERE"
              )}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            {t.footerBrandDesc || "Experience ultimate cinematic high-definition streaming. Browse thousands of catalog movies, check trailer highlights, and track watch histories dynamically."}
          </p>
          {/* Social Icons Row */}
          <div className="flex items-center gap-3 pt-2">
            {[
              { icon: <Twitter className="w-4 h-4" />, href: "#" },
              { icon: <Github className="w-4 h-4" />, href: "#" },
              { icon: <Instagram className="w-4 h-4" />, href: "#" },
              { icon: <Youtube className="w-4 h-4" />, href: "#" }
            ].map((soc, i) => (
              <a
                key={i}
                href={soc.href}
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center transition-all hover:text-white"
                style={{ ["--hover-color" as any]: brandColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColor;
                  e.currentTarget.style.backgroundColor = `${brandColor}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.backgroundColor = "";
                }}
              >
                {soc.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Link Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
            {t.explore || "Explore Content"}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button 
                onClick={() => handleNav("home", "all")} 
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {t.browse || "Home Library"}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNav("home", "movie")} 
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {t.movies || "Movies Catalog"}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNav("home", "series")} 
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {t.tvSeries || "TV Series Collection"}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNav("favorites")} 
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {t.myList || "My Pinned Watchlist"}
              </button>
            </li>
          </ul>
        </div>

        {/* Support & Services Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
            {t.supportServices || "Support & Service"}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button 
                onClick={onOpenSubscription} 
                className="text-amber-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-bold"
              >
                {t.subscribeVip || "Join VIP Premium"}
                <ExternalLink className="w-3 h-3" />
              </button>
            </li>
            <li>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Help Center FAQ
              </a>
            </li>
            <li>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                Supported Devices
              </a>
            </li>
            <li>
              <button 
                onClick={onOpenAuth}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Account Authentication
              </button>
            </li>
          </ul>
        </div>

        {/* Corporate / Contact Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
            {t.corporateLegal || "Corporate & Legal"}
          </h4>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              Privacy & Security Policies
            </li>
            <li className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              Content Guidelines (PG)
            </li>
            <li className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-zinc-500" />
              press@flixsphere.org
            </li>
            <li className="pt-2 text-[10px] text-zinc-600 border-t border-zinc-900/60 leading-relaxed">
              Sandbox model presentation interface constructed for portfolio testing.
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal / Details Row */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-600 text-xs">
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <p>© 2026 {settings.siteName}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
