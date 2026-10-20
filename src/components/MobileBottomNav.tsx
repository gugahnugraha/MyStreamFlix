import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Home, Film, Tv, Heart, Menu, UserRound, LayoutDashboard, 
  Crown, Sparkles, LogOut, LogIn, Settings, X, Globe, ChevronRight 
} from "lucide-react";
import { User } from "../types";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedContentType: "all" | "movie" | "series" | "livetv";
  onSelectContentType: (type: "all" | "movie" | "series" | "livetv") => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenMobileSearch: () => void;
  onOpenSubscription: () => void;
  onOpenProfileSwitcher: (mode?: "select" | "account" | "create") => void;
  onLogout: () => void;
  currentLanguage: "en" | "id" | "es";
  onLanguageChange: (lang: "en" | "id" | "es") => void;
  onCloseActiveStream?: () => void;
  favoritesCount?: number;
  t: any;
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  selectedContentType,
  onSelectContentType,
  currentUser,
  onOpenAuth,
  onOpenSubscription,
  onOpenProfileSwitcher,
  onLogout,
  currentLanguage,
  onLanguageChange,
  onCloseActiveStream,
  favoritesCount = 0,
  t
}: MobileBottomNavProps) {
  const brandColor = "#00ADB5";

  const handleAction = (cb: () => void) => {
    if (onCloseActiveStream) {
      onCloseActiveStream();
    }
    cb();
  };

  const cycleLanguage = () => {
    const nextLang = currentLanguage === "en" ? "id" : currentLanguage === "id" ? "es" : "en";
    onLanguageChange(nextLang);
  };

  const navItems = [
    {
      id: "home-all",
      label: t?.home || "Home",
      icon: Home,
      href: "/",
      isActive: activeTab === "home" && selectedContentType === "all",
      action: () => handleAction(() => {
        setActiveTab("home");
        onSelectContentType("all");
      })
    },
    {
      id: "home-movies",
      label: t?.movies || "Movies",
      icon: Film,
      href: "/movies",
      isActive: activeTab === "home" && selectedContentType === "movie",
      action: () => handleAction(() => {
        setActiveTab("home");
        onSelectContentType("movie");
      })
    },
    {
      id: "home-livetv",
      label: t?.liveTv || "Live TV",
      icon: Tv,
      href: "/livetv",
      isActive: activeTab === "home" && selectedContentType === "livetv",
      action: () => handleAction(() => {
        setActiveTab("home");
        onSelectContentType("livetv");
      })
    },
    {
      id: "favorites",
      label: t?.myList || "My List",
      icon: Heart,
      href: "/favorites",
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      isActive: activeTab === "favorites",
      action: () => handleAction(() => {
        if (!currentUser) {
          onOpenAuth();
        } else {
          setActiveTab("favorites");
        }
      })
    },
    {
      id: "language",
      label: currentLanguage.toUpperCase(),
      icon: Globe,
      isActive: false,
      action: cycleLanguage
    }
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/80 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 select-none"
      style={{ touchAction: "manipulation" }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          const isLang = item.id === "language";

          const content = (
            <>
              {/* Active Indicator Bar */}
              {isActive && (
                <div
                  className="absolute top-0 w-8 h-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: brandColor, boxShadow: `0 0 12px ${brandColor}` }}
                />
              )}

              <div className="relative flex items-center justify-center">
                <Icon
                  className="w-5 h-5 transition-transform duration-200"
                  style={{ color: isActive ? brandColor : isLang ? "#00ADB5" : undefined }}
                />
                {item.badge !== undefined && (
                  <span
                    className="absolute -top-1.5 -right-2.5 text-[9px] font-black text-white px-1.5 py-0.2 rounded-full shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    {item.badge}
                  </span>
                )}
                {isLang && (
                  <span 
                    className="absolute -top-1.5 -right-3 text-[8px] font-black px-1 py-0.2 rounded-md border shadow-xs tracking-widest uppercase"
                    style={{ backgroundColor: "rgba(0, 173, 181, 0.2)", color: "#00ADB5", borderColor: "rgba(0, 173, 181, 0.4)" }}
                  >
                    {currentLanguage.toUpperCase()}
                  </span>
                )}
              </div>

              <span 
                className={`text-[10px] mt-1 tracking-tight truncate max-w-[64px] ${
                  isActive ? "font-bold" : "font-medium"
                }`}
                style={isActive ? { color: brandColor } : isLang ? { color: "#00ADB5" } : undefined}
              >
                {item.label}
              </span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  item.action();
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full relative py-1.5 rounded-lg transition-all duration-150 active:scale-90 active:bg-white/10 touch-manipulation cursor-pointer no-underline ${
                  isActive ? "text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center flex-1 h-full relative py-1.5 rounded-lg transition-all duration-150 active:scale-90 active:bg-white/10 touch-manipulation cursor-pointer ${
                isActive ? "text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
