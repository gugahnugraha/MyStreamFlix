import React, { useState } from "react";
import { Film, User as UserIcon, ShieldAlert, Heart, LayoutDashboard, LogIn, LogOut, RefreshCw, Search, Crown, Sparkles, Users, Globe } from "lucide-react";
import { User, CMSSettings } from "../types";

interface HeaderProps {
  currentUser: User | null;
  settings: CMSSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleRole: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSubscription: () => void;
  onOpenProfileSwitcher: () => void;
  currentLanguage: "en" | "id" | "es";
  onLanguageChange: (lang: "en" | "id" | "es") => void;
  t: any;
}

export default function Header({
  currentUser,
  settings,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onToggleRole,
  searchQuery,
  setSearchQuery,
  onOpenSubscription,
  onOpenProfileSwitcher,
  currentLanguage,
  onLanguageChange,
  t,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Dynamic profile calculation matching Prime/Disney+
  const activeProfile = currentUser?.profiles?.find(p => p.id === currentUser.activeProfileId);
  const profileAvatar = activeProfile?.avatar || currentUser?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const profileName = activeProfile?.name || currentUser?.name;

  return (
    <header className="sticky top-0 z-40 bg-linear-to-b from-black/95 to-black/80 backdrop-blur-md border-b border-zinc-800/40 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => setActiveTab("home")}
        id="header-brand-logo"
      >
        <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform duration-300">
          <Film className="w-5 h-5 text-white animate-pulse" />
        </div>
        <span className="text-xl font-bold tracking-wider text-white font-sans flex items-center gap-1.5">
          {settings.logoText}
          {currentUser?.isPremium && (
            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-sm font-black tracking-widest uppercase flex items-center gap-1">
              <Crown className="w-2.5 h-2.5 fill-amber-500 shrink-0" />
              VIP
            </span>
          )}
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400" id="header-nav">
        <button
          onClick={() => setActiveTab("home")}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeTab === "home" ? "text-red-500 font-semibold" : ""
          }`}
          id="nav-home"
        >
          {t.browse}
        </button>
        {currentUser && (
          <button
            onClick={() => setActiveTab("favorites")}
            className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "favorites" ? "text-red-500 font-semibold" : ""
            }`}
            id="nav-favorites"
          >
            <Heart className="w-4 h-4" />
            {t.myList}
          </button>
        )}
        {currentUser?.role === "admin" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "admin" ? "text-red-500 font-semibold" : ""
            }`}
            id="nav-admin"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t.adminDashboard}
          </button>
        )}

        {/* Dynamic Subscribe / Premium Banner in Nav */}
        {currentUser && !currentUser.isPremium && (
          <button
            onClick={onOpenSubscription}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow-md animate-bounce cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3 fill-black" />
            {t.subscribeVip}
          </button>
        )}
      </nav>

      {/* Search Bar & User Actions */}
      <div className="flex items-center gap-3 sm:gap-4" id="header-actions">
        {/* Search Input */}
        {activeTab === "home" && (
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 lg:w-56 bg-zinc-900/90 text-xs text-white pl-9 pr-4 py-2 rounded-full border border-zinc-800 focus:outline-hidden focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-zinc-500"
              id="header-search-input"
            />
          </div>
        )}

        {/* Premium Multi-Language Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-zinc-300">
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

        {/* Role Access Testing Switch */}
        {currentUser && (
          <button
            onClick={onToggleRole}
            title={`Switch to ${currentUser.role === "admin" ? "User" : "Admin"} role`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono text-zinc-400 border border-zinc-800/80 transition-all"
            id="header-role-toggle"
          >
            <RefreshCw className="w-3 h-3 text-red-500 animate-spin-slow" />
            <span className="hidden lg:inline">{t.testRole}</span>
            <span className="font-bold text-white capitalize">{currentUser.role}</span>
          </button>
        )}

        {/* User Account / Auth Trigger */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 focus:outline-hidden cursor-pointer"
              id="header-profile-menu-trigger"
            >
              <div className="relative">
                <img
                  src={profileAvatar}
                  alt={profileName}
                  className="w-8 h-8 rounded-md object-cover border border-zinc-700 hover:border-red-500 transition-colors"
                />
                {activeProfile?.isKids && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[7px] font-black px-1 rounded-sm shadow-xs shrink-0">
                    {t.kids}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-zinc-200 hover:text-white transition-colors">
                {profileName}
              </span>
            </button>

            {/* Account Dropdown */}
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2.5 w-56 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                          ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}>
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

                  {/* Profile Management Section */}
                  <div className="py-1 border-b border-zinc-900">
                    <button
                      onClick={() => { onOpenProfileSwitcher(); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-md flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      {t.switchProfile}
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
                      onClick={() => { setActiveTab("home"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      {t.browse}
                    </button>
                    <button
                      onClick={() => { setActiveTab("favorites"); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
                    >
                      {t.myList}
                    </button>
                    {currentUser.role === "admin" && (
                      <button
                        onClick={() => { setActiveTab("admin"); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-900 rounded-md transition-colors"
                      >
                        {t.adminDashboard}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => { onLogout(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-red-900/10 hover:text-red-400 rounded-md flex items-center gap-2 transition-colors mt-1 cursor-pointer"
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
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-md transition-colors cursor-pointer"
            id="header-signin-btn"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t.signIn}
          </button>
        )}
      </div>
    </header>
  );
}
