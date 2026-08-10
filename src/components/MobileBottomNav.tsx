import React, { useEffect, useState } from "react";
import { 
  Home, Film, Tv, Heart, Menu, UserRound, LayoutDashboard, 
  Crown, Sparkles, LogOut, LogIn, Settings, X, Globe, ChevronRight 
} from "lucide-react";
import { User } from "../types";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedContentType: "all" | "movie" | "series";
  onSelectContentType: (type: "all" | "movie" | "series") => void;
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
  const [showDrawer, setShowDrawer] = useState(false);
  const brandColor = "#00ADB5";

  const activeProfile = currentUser?.profiles?.find(p => p.id === currentUser.activeProfileId);
  const profileAvatar = activeProfile?.avatar || currentUser?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const profileName = activeProfile?.name || currentUser?.name;

  const handleAction = (cb: () => void) => {
    if (onCloseActiveStream) {
      onCloseActiveStream();
    }
    cb();
  };

  const navItems = [
    {
      id: "home-all",
      label: t?.home || "Home",
      icon: Home,
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
      isActive: activeTab === "home" && selectedContentType === "movie",
      action: () => handleAction(() => {
        setActiveTab("home");
        onSelectContentType("movie");
      })
    },
    {
      id: "home-series",
      label: t?.tvSeries || "Series",
      icon: Tv,
      isActive: activeTab === "home" && selectedContentType === "series",
      action: () => handleAction(() => {
        setActiveTab("home");
        onSelectContentType("series");
      })
    },
    {
      id: "favorites",
      label: t?.myList || "My List",
      icon: Heart,
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
      label: currentLanguage === "en" ? "English" : currentLanguage === "id" ? "Bahasa" : "Español",
      icon: Globe,
      isActive: false,
      action: () => handleAction(() => {
        const nextLang = currentLanguage === "en" ? "id" : currentLanguage === "id" ? "es" : "en";
        onLanguageChange(nextLang);
      })
    }
  ];

  return (
    <>
      {/* Fixed Mobile Bottom Navigation Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/80 pb-[env(safe-area-inset-bottom,0.25rem)] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 select-none"
        style={{ touchAction: "manipulation" }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;
            const isLang = item.id === "language";

            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`flex flex-col items-center justify-center flex-1 h-full relative py-1.5 rounded-lg transition-all duration-150 active:scale-90 active:bg-white/10 touch-manipulation cursor-pointer ${
                  isActive ? "text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide-Up Mobile Navigation Drawer Sheet */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowDrawer(false)} 
          />

          {/* Sheet Content */}
          <div className="relative z-10 w-full bg-[#0d0d0e] border-t border-zinc-800/90 rounded-t-3xl p-5 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-1 mb-2 opacity-60" />

            {/* Header / User Card */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={profileAvatar} 
                    alt={profileName} 
                    className="w-11 h-11 rounded-full object-cover border border-white/20 shadow-md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate max-w-[150px]">{profileName}</p>
                      {currentUser.isPremium && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <UserRound className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t?.guestUser || "Guest User"}</p>
                    <p className="text-xs text-zinc-500">{t?.loginToSync || "Sign in for VIP access"}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDrawer(false)}
                className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="space-y-1 text-sm font-medium text-zinc-200">
              <button
                onClick={() => {
                  setActiveTab("home");
                  onSelectContentType("all");
                  setShowDrawer(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/80 active:bg-zinc-900 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5" style={{ color: brandColor }} />
                  <span>{t?.home || "Home (All Content)"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("home");
                  onSelectContentType("movie");
                  setShowDrawer(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/80 active:bg-zinc-900 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5" style={{ color: brandColor }} />
                  <span>{t?.movies || "Movies"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("home");
                  onSelectContentType("series");
                  setShowDrawer(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/80 active:bg-zinc-900 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Tv className="w-5 h-5" style={{ color: brandColor }} />
                  <span>{t?.tvSeries || "TV Series"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth();
                  } else {
                    setActiveTab("favorites");
                  }
                  setShowDrawer(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/80 active:bg-zinc-900 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>{t?.myList || "My Favorites & Watchlist"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>

              {/* Admin Dashboard Entry */}
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => {
                    setActiveTab("admin");
                    setShowDrawer(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 hover:bg-zinc-900 active:scale-[0.98] transition-all cursor-pointer text-white"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5" style={{ color: brandColor }} />
                    <span className="font-bold">{t?.adminDashboard || "Admin CMS Dashboard"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              )}
            </div>

            {/* Quick Actions & Settings */}
            <div className="pt-2 border-t border-zinc-900 space-y-2">
              {/* Language Selector in Menu */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-900">
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>{t?.language || "Language"}</span>
                </div>
                <select
                  value={currentLanguage}
                  onChange={(e) => onLanguageChange(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-2.5 py-1.5 rounded-lg focus:outline-hidden cursor-pointer"
                >
                  <option value="en">English (EN)</option>
                  <option value="id">Indonesia (ID)</option>
                  <option value="es">Español (ES)</option>
                </select>
              </div>

              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      onOpenProfileSwitcher("account");
                      setShowDrawer(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/80 active:bg-zinc-900 transition-all cursor-pointer text-xs text-zinc-300"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span>{t?.accountSettings || "Account Settings"}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </button>

                  {!currentUser.isPremium && (
                    <button
                      onClick={() => {
                        onOpenSubscription();
                        setShowDrawer(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold active:scale-[0.98] transition-all cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>{t?.upgradePlan || "Upgrade to VIP Premium"}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-500/60" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setShowDrawer(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/10 text-red-500 active:scale-[0.98] transition-all cursor-pointer text-xs font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4" />
                      <span>{t?.logout || "Sign Out"}</span>
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setShowDrawer(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-white font-bold text-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                  style={{ backgroundColor: brandColor }}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t?.signInRegister || "Sign In / Register"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
