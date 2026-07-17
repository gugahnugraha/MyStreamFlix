import React, { useEffect, useMemo, useState } from "react";
import { Film, Heart, LayoutDashboard, LogIn, LogOut, Search, Crown, Sparkles, Users, Globe, Clapperboard, Tv, UserRound, ChevronDown, X } from "lucide-react";
import { User, CMSSettings } from "../types";

import { Movie } from "../types";

type SearchSuggestion = {
  id: string;
  type: "movie" | "series" | "cast";
  title: string;
  subtitle: string;
  posterUrl?: string;
  query: string;
  source: "local" | "tmdb";
};

interface HeaderProps {
  currentUser: User | null;
  settings: CMSSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedContentType: "all" | "movie" | "series";
  onSelectContentType: (type: "all" | "movie" | "series") => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSubscription: () => void;
  onOpenProfileSwitcher: (mode?: "select" | "account" | "create") => void;
  currentLanguage: "en" | "id" | "es";
  onLanguageChange: (lang: "en" | "id" | "es") => void;
  t: any;
  movies: Movie[];
}

export default function Header({
  currentUser,
  settings,
  activeTab,
  setActiveTab,
  selectedContentType,
  onSelectContentType,
  onOpenAuth,
  onLogout,
  searchQuery,
  setSearchQuery,
  onOpenSubscription,
  onOpenProfileSwitcher,
  currentLanguage,
  onLanguageChange,
  t,
  movies,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [userThemeColor, setUserThemeColor] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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

  // Dynamic profile calculation matching Prime/Disney+
  const activeProfile = currentUser?.profiles?.find(p => p.id === currentUser.activeProfileId);
  const profileAvatar = activeProfile?.avatar || currentUser?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const profileName = activeProfile?.name || currentUser?.name;
  const brandColor = userThemeColor || settings?.primaryColor || "#E50914";
  const localSuggestions = useMemo<SearchSuggestion[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const titleMatches = movies
      .filter(m => m.title.toLowerCase().includes(q) || m.cast.some(c => c.toLowerCase().includes(q)))
      .slice(0, 5)
      .map(m => ({
        id: `local-${m.id}`,
        type: (m.contentType === "series" ? "series" : "movie") as "series" | "movie",
        title: m.title,
        subtitle: `${m.contentType === "series" ? "TV Series" : "Movie"} • ${m.releaseYear}`,
        posterUrl: m.posterUrl,
        query: m.title,
        source: "local" as const
      }));

    const castMatches = Array.from(new Set(
      movies.flatMap(m => m.cast).filter(c => c.toLowerCase().includes(q))
    )).slice(0, 3).map(name => ({
      id: `cast-${name}`,
      type: "cast" as const,
      title: name,
      subtitle: "Cast",
      query: name,
      source: "local" as const
    }));

    return [...titleMatches, ...castMatches].slice(0, 8);
  }, [movies, searchQuery]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSearchSuggestions(localSuggestions);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setSearchSuggestions(data.length ? data : localSuggestions);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setSearchSuggestions(localSuggestions);
        }
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [localSuggestions, searchQuery]);

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    if (type === "series") return <Tv className="w-4 h-4" style={{ color: brandColor }} />;
    if (type === "cast") return <UserRound className="w-4 h-4" style={{ color: brandColor }} />;
    return <Clapperboard className="w-4 h-4" style={{ color: brandColor }} />;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#070708]/75 backdrop-blur-xl border-b border-white/[0.06] px-4 md:px-8 py-3.5 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => {
          setActiveTab("home");
          setSearchQuery("");
        }}
        id="header-brand-logo"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ring-1 ring-white/10" style={{ backgroundColor: brandColor, boxShadow: `0 12px 28px ${brandColor}38` }}>
          <Film className="w-5 h-5 text-white group-hover:animate-pulse" />
        </div>
        <span className="text-xl font-bold tracking-wider text-white font-sans flex items-center gap-1.5">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.logoText || "Logo"} className="max-h-7 object-contain" />
          ) : (
            <span style={{ color: brandColor }}>{settings.logoText}</span>
          )}
          {currentUser?.isPremium && (
            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-sm font-black tracking-widest uppercase flex items-center gap-1">
              <Crown className="w-2.5 h-2.5 fill-amber-500 shrink-0" />
              VIP
            </span>
          )}
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-400 bg-white/[0.03] border border-white/10 rounded-lg p-1" id="header-nav">
        <button
          onClick={() => {
            setActiveTab("home");
            onSelectContentType("all");
            setSearchQuery("");
          }}
          className={`relative px-3 py-1.5 rounded-md transition-all cursor-pointer group ${
            activeTab === "home" && selectedContentType === "all" ? "text-white font-semibold" : "hover:bg-white/[0.04]"
          }`}
          style={activeTab === "home" && selectedContentType === "all" ? { backgroundColor: `${brandColor}18`, color: brandColor } : {}}
          id="nav-home"
        >
          {t.browse}
        </button>
        <button
          onClick={() => {
            setActiveTab("home");
            onSelectContentType("movie");
            setSearchQuery("");
          }}
          className={`relative px-3 py-1.5 rounded-md transition-all cursor-pointer group ${
            activeTab === "home" && selectedContentType === "movie" ? "text-white font-semibold" : "hover:bg-white/[0.04]"
          }`}
          style={activeTab === "home" && selectedContentType === "movie" ? { backgroundColor: `${brandColor}18`, color: brandColor } : {}}
          id="nav-movies"
        >
          {t.movies || "Movies"}
        </button>
        <button
          onClick={() => {
            setActiveTab("home");
            onSelectContentType("series");
            setSearchQuery("");
          }}
          className={`relative px-3 py-1.5 rounded-md transition-all cursor-pointer group ${
            activeTab === "home" && selectedContentType === "series" ? "text-white font-semibold" : "hover:bg-white/[0.04]"
          }`}
          style={activeTab === "home" && selectedContentType === "series" ? { backgroundColor: `${brandColor}18`, color: brandColor } : {}}
          id="nav-series"
        >
          {t.tvSeries || "Series"}
        </button>
        {currentUser && (
          <button
            onClick={() => {
              setActiveTab("favorites");
              setSearchQuery("");
            }}
            className={`relative px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 group ${
              activeTab === "favorites" ? "text-white font-semibold" : "hover:bg-white/[0.04]"
            }`}
            style={activeTab === "favorites" ? { backgroundColor: `${brandColor}18`, color: brandColor } : {}}
            id="nav-favorites"
          >
            <Heart
              className={`w-4 h-4 transition-transform ${activeTab === "favorites" ? "fill-current" : "group-hover:scale-110"}`}
              style={activeTab === "favorites" ? { color: brandColor } : {}}
            />
            {t.myList}
          </button>
        )}

      </nav>

      {/* Search Bar & User Actions */}
      <div className="flex items-center gap-3 sm:gap-4" id="header-actions">
        {/* Search Input */}
        {activeTab === "home" && (
          <>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 transition-colors duration-300" style={showSearchSuggestions ? { color: brandColor } : {}} />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSearchSuggestions(false), 120)}
                className="w-32 sm:w-36 focus:w-56 focus:sm:w-64 focus:lg:w-80 hover:w-44 focus:hover:w-56 focus:sm:hover:w-64 focus:lg:hover:w-80 bg-white/[0.03] text-xs text-white pl-9 pr-4 py-2 rounded-full border border-white/10 focus:outline-hidden focus:ring-2 transition-all duration-300 ease-in-out placeholder:text-zinc-500"
                style={showSearchSuggestions ? { borderColor: `${brandColor}80`, boxShadow: `0 0 0 2px ${brandColor}20` } : {}}
                id="header-search-input"
              />
              {showSearchSuggestions && searchQuery.trim() && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-white/10 bg-zinc-950/98 shadow-2xl shadow-black/60 overflow-hidden z-50">
                  {suggestionsLoading && searchSuggestions.length === 0 ? (
                    <div className="px-3 py-3 text-[11px] text-zinc-500">{t.loadingSuggestions || "Loading suggestions..."}</div>
                  ) : searchSuggestions.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto py-1">
                      {searchSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setSearchQuery(item.query || item.title);
                            setShowSearchSuggestions(false);
                          }}
                          className="w-full px-2.5 py-2 text-left flex items-center gap-2.5 hover:bg-zinc-900 transition-colors"
                        >
                          {item.posterUrl ? (
                            <img src={item.posterUrl} alt="" className="w-8 h-11 object-cover rounded bg-zinc-900 border border-zinc-800" />
                          ) : (
                            <span className="w-8 h-11 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                              {getSuggestionIcon(item.type)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-zinc-100 truncate">{item.title}</span>
                            <span className="block text-[10px] text-zinc-550 truncate">{item.subtitle}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-[11px] text-zinc-500">{t.noResultsFound || "No matching titles or cast found."}</div>
                  )}
                </div>
              )}
            </div>
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setShowMobileSearch(true)}
              className="sm:hidden w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              title={t.searchPlaceholder}
              id="header-search-mobile-toggle"
            >
              <Search className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Premium Multi-Language Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-md px-2 py-1.5 text-xs text-zinc-300">
          <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value as any)}
            className="bg-transparent text-[11px] sm:text-xs font-bold text-zinc-200 focus:outline-hidden cursor-pointer"
            title="Language"
          >
            <option value="en" className="bg-zinc-950 text-white">🇬🇧 EN</option>
            <option value="id" className="bg-zinc-950 text-white">🇮🇩 ID</option>
            <option value="es" className="bg-zinc-950 text-white">🇪🇸 ES</option>
          </select>
        </div>

        {/* User Account / Auth Trigger */}
        {currentUser ? (
          <div className="relative">
          <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="flex items-center gap-2 focus:outline-hidden cursor-pointer group"
              id="header-profile-menu-trigger"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <div className="relative">
                <img
                  src={profileAvatar}
                  alt={profileName}
                  className="w-8 h-8 rounded-md object-cover border transition-colors"
                  style={{ borderColor: showProfileMenu ? brandColor : "rgba(255,255,255,0.15)" }}
                />
                {activeProfile?.isKids && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[7px] font-black px-1 rounded-sm shadow-xs shrink-0">
                    {t.kids}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                {profileName}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* Account Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-[49]"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2.5 w-60 bg-[#111112]/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.7)] p-1.5 z-50 origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2.5 border-b border-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate max-w-[140px]">{profileName}</p>
                      {currentUser.isPremium && (
                        <Crown className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{currentUser.email}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className={`px-1.5 py-0.5 text-[9px] rounded-sm font-semibold tracking-wider ${
                        currentUser.role === "admin" 
                          ? "border" 
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                      style={currentUser.role === "admin" ? { backgroundColor: `${brandColor}10`, color: brandColor, borderColor: `${brandColor}25` } : undefined}
                      >
                        {currentUser.role === "admin" ? "ADMIN" : t.freeTier}
                      </span>
                      {currentUser.isPremium ? (
                        <span className="px-1.5 py-0.5 text-[9px] rounded-sm font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t.premiumVip}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] rounded-sm font-semibold bg-zinc-800 text-zinc-500">
                          {t.freeTier}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin Dashboard Section */}
                  {currentUser.role === "admin" && (
                    <div className="py-1 border-b border-zinc-900">
                      <button
                        onClick={() => { setActiveTab("admin"); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md flex items-center gap-2 transition-colors cursor-pointer"
                        id="dropdown-admin-btn"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" style={{ color: brandColor }} />
                        {t.adminDashboard}
                      </button>
                    </div>
                  )}

                  {/* Profile Management Section */}
                  <div className="py-1 border-b border-zinc-900">
                    <button
                      onClick={() => { onOpenProfileSwitcher("select"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" style={{ color: brandColor }} />
                      {t.switchProfile}
                    </button>
                    <button
                      onClick={() => { onOpenProfileSwitcher("account"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md flex items-center gap-2 transition-colors cursor-pointer"
                      id="dropdown-profile-settings-btn"
                    >
                      <UserRound className="w-3.5 h-3.5" style={{ color: brandColor }} />
                      {t.accountSettings || "Account Settings"}
                    </button>
                    {!currentUser.isPremium && (
                      <button
                        onClick={() => { onOpenSubscription(); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 rounded-md flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        {t.upgradePlan}
                      </button>
                    )}
                  </div>

                  {/* Mobile Nav Links Inside Dropdown */}
                  <div className="block md:hidden border-b border-zinc-900 py-1">
                    <button
                      onClick={() => { setActiveTab("home"); onSelectContentType("all"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      {t.browse}
                    </button>
                    <button
                      onClick={() => { setActiveTab("home"); onSelectContentType("movie"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      {t.movies || "Movies"}
                    </button>
                    <button
                      onClick={() => { setActiveTab("home"); onSelectContentType("series"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      {t.tvSeries || "Series"}
                    </button>
                    <button
                      onClick={() => { setActiveTab("favorites"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      {t.myList}
                    </button>
                  </div>

                  <button
                    onClick={() => { onLogout(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white rounded-md flex items-center gap-2 transition-colors mt-1 cursor-pointer"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${brandColor}10`;
                      e.currentTarget.style.color = brandColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.color = "";
                    }}
                    id="header-logout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t.signOut}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-md transition-colors cursor-pointer hover:brightness-110"
            style={{ backgroundColor: brandColor }}
            id="header-signin-btn"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t.signIn}
          </button>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="absolute inset-0 bg-[#070708] px-4 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <button
            onClick={() => {
              setShowMobileSearch(false);
              setSearchQuery("");
            }}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            id="mobile-search-close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 text-xs text-white pl-9 pr-4 py-2 rounded-full border border-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-red-500 placeholder:text-zinc-500"
              autoFocus
              id="mobile-search-input"
            />
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-950/98 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {suggestionsLoading && searchSuggestions.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-zinc-500">{t.loadingSuggestions || "Loading suggestions..."}</div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="py-1">
                    {searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(item.query || item.title);
                          setShowMobileSearch(false);
                        }}
                        className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-zinc-900 border-b border-zinc-900 last:border-b-0 transition-colors"
                      >
                        {item.posterUrl ? (
                          <img src={item.posterUrl} alt="" className="w-8 h-11 object-cover rounded bg-zinc-900 border border-zinc-800" />
                        ) : (
                          <span className="w-8 h-11 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            {getSuggestionIcon(item.type)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-zinc-100 truncate">{item.title}</span>
                          <span className="block text-[10px] text-zinc-500 truncate">{item.subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-[11px] text-zinc-500">{t.noResultsFound || "No matching titles or cast found."}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
