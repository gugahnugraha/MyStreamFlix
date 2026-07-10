/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Baby, Check, Settings, Shield, Save, UserRound, KeyRound, Users, Calendar, Sparkles, Crown } from "lucide-react";
import { User as UserType, UserProfile } from "../types";

interface ProfileModalProps {
  currentUser: UserType | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserType) => void;
  onOpenSubscription?: () => void;
  t?: any;
  initialMode?: "select" | "create" | "account";
}

const PRESET_COLORS = [
  { name: "Netflix Red", value: "#E50914" },
  { name: "Flix Gold", value: "#F5C518" },
  { name: "Cinema Teal", value: "#00ADB5" },
  { name: "Stream Purple", value: "#8B5CF6" },
  { name: "Emerald Green", value: "#10B981" },
  { name: "Neon Pink", value: "#EC4899" },
  { name: "Electric Blue", value: "#3B82F6" },
];

export default function ProfileModal({ 
  currentUser, 
  onClose, 
  onSuccess, 
  onOpenSubscription,
  t, 
  initialMode = "select" 
}: ProfileModalProps) {
  const [mode, setMode] = useState<"select" | "create" | "account">(initialMode);
  const [accountTab, setAccountTab] = useState<"profile" | "password" | "profiles">("profile");
  const [profileName, setProfileName] = useState("");
  const [accountName, setAccountName] = useState(currentUser?.name || "");
  const [accountEmail, setAccountEmail] = useState(currentUser?.email || "");
  const [accountAvatar, setAccountAvatar] = useState(currentUser?.profileImage || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeColor, setActiveColor] = useState("#E50914");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user-theme-primary");
      if (saved) {
        setActiveColor(saved);
      } else {
        const root = document.documentElement;
        const rootColor = root.style.getPropertyValue('--theme-primary') || "#E50914";
        setActiveColor(rootColor.trim());
      }
    }
  }, [currentUser]);

  const handleUpdateThemeColor = (color: string) => {
    if (typeof window !== "undefined") {
      if (!color) {
        localStorage.removeItem("user-theme-primary");
        setActiveColor("#E50914");
        window.dispatchEvent(new Event('themechange'));
        return;
      }
      setActiveColor(color);
      localStorage.setItem("user-theme-primary", color);
      
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', color);
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      root.style.setProperty('--theme-primary-90', `rgba(${r}, ${g}, ${b}, 0.9)`);
      root.style.setProperty('--theme-primary-80', `rgba(${r}, ${g}, ${b}, 0.8)`);
      root.style.setProperty('--theme-primary-50', `rgba(${r}, ${g}, ${b}, 0.5)`);
      root.style.setProperty('--theme-primary-30', `rgba(${r}, ${g}, ${b}, 0.3)`);
      root.style.setProperty('--theme-primary-20', `rgba(${r}, ${g}, ${b}, 0.2)`);
      root.style.setProperty('--theme-primary-10', `rgba(${r}, ${g}, ${b}, 0.1)`);
      
      window.dispatchEvent(new Event('themechange'));
    }
  };

  const sampleAvatars = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", // Blue boy
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", // Yellow man
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", // Violet woman
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80", // Green woman
    "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=150&auto=format&fit=crop&q=80", // Orange boy
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", // Red kids
  ];

  const handleSelectProfile = async (profileId: string) => {
    try {
      const res = await fetch("/api/auth/profile/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId })
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data.user);
        onClose();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || t.failedSwitchProfile || "Failed switching profiles.");
      }
    } catch (err) {
      setErrorMessage(t.netErrorSwitchProfile || "Network error switching profiles.");
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMessage(t.enterProfileName || "Please enter a profile name.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/profile/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName.trim(),
          avatar: selectedAvatar,
          isKids
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubmitting(false);
        setProfileName("");
        setIsKids(false);
        setMode("select");
        onSuccess(data.user);
      } else {
        const errData = await res.json();
        setIsSubmitting(false);
        setErrorMessage(errData.error || t.failedCreateProfile || "Failed creating profile.");
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(t.netErrorCreateProfile || "Network error creating profile.");
    }
  };

  const handleDeleteProfile = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // Avoid triggering profile selection on click
    if (!window.confirm(t.confirmDeleteProfile || "Are you sure you want to delete this profile? All personalized lists will be cleared.")) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/profile/${profileId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data.user);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || t.failedDeleteProfile || "Failed deleting profile.");
      }
    } catch (err) {
      setErrorMessage(t.netErrorDeleteProfile || "Network error deleting profile.");
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accountName,
          email: accountEmail,
          profileImage: accountAvatar,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.failedUpdateProfile || "Failed updating account.");
      setCurrentPassword("");
      setNewPassword("");
      onSuccess(data.user);
      setMode("select");
    } catch (err: any) {
      setErrorMessage(err.message || t.netErrorUpdateProfile || "Network error updating account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="profile-modal-container">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8" id="profile-modal-card">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
          id="profile-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {errorMessage && (
          <div className="mb-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        {mode === "select" ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-white tracking-wide">{t?.manageProfiles || "Who's watching?"}</h2>
              <p className="text-xs text-zinc-500">{t?.selectProfileDesc || "Select a profile to customize your experience."}</p>
            </div>

            {/* Profile Grid */}
            <div className="flex flex-wrap justify-center items-center gap-8 py-4">
              {currentUser.profiles?.map((profile) => {
                const isActive = currentUser.activeProfileId === profile.id;
                return (
                  <div 
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    className="group relative flex flex-col items-center gap-3 cursor-pointer"
                    id={`profile-item-${profile.id}`}
                  >
                    <div className="relative">
                      <img 
                        src={profile.avatar} 
                        alt={profile.name}
                        className={`w-24 h-24 rounded-2xl object-cover transition-all duration-300 border-2 ${
                          isActive 
                            ? "border-red-600 scale-105 shadow-lg shadow-red-950/30" 
                            : "border-transparent group-hover:border-zinc-500 group-hover:scale-105"
                        }`}
                      />
                      {profile.isKids && (
                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-md">
                          <Baby className="w-2.5 h-2.5" />
                          KIDS
                        </span>
                      )}
                      
                      {/* Active profile dot */}
                      {isActive && (
                        <span className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">
                      <span className="truncate max-w-[100px]">{profile.name}</span>
                    </div>

                    {/* Delete Icon (only if it is not the only profile) */}
                    {(currentUser.profiles?.length || 0) > 1 && (
                      <button
                        onClick={(e) => handleDeleteProfile(e, profile.id)}
                        title={t?.deleteProfile || "Delete Profile"}
                        className="opacity-0 group-hover:opacity-100 absolute -top-2 -left-2 bg-zinc-900 border border-zinc-800 p-1 rounded-md text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Profile Box */}
              {(currentUser.profiles?.length || 0) < 5 && (
                <div 
                  onClick={() => setMode("create")}
                  className="flex flex-col items-center gap-3 cursor-pointer group"
                  id="profile-item-add"
                >
                  <div className="w-24 h-24 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-center transition-all group-hover:scale-105">
                    <Plus className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300">{t?.addProfileBtn || "Add Profile"}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-900 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setAccountName(currentUser.name);
                  setAccountEmail(currentUser.email);
                  setAccountAvatar(currentUser.profileImage || "");
                  setMode("account");
                }}
                className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white px-6 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                {t?.accountSettings || "Account Settings"}
              </button>
              <button
                onClick={onClose}
                className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white px-6 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {t?.closeSwitcher || "Close Switcher"}
              </button>
            </div>
          </div>
        ) : mode === "create" ? (
          <form onSubmit={handleCreateProfile} className="space-y-6 animate-in fade-in duration-300" id="profile-create-form">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">{t?.createSubProfile || "Create Sub-Profile"}</h2>
              <p className="text-xs text-zinc-500">{t?.createProfileDesc || "Create a profile with custom avatar and optional G/PG restriction safeguards."}</p>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.profileNameLabel || "Profile Name"}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah, Kids Corner"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                />
              </div>

              <div 
                onClick={() => setIsKids(!isKids)}
                className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-yellow-500" />
                    {t?.kidsProfileQuestion || "Kids Profile?"}
                  </h4>
                  <p className="text-[10px] text-zinc-500">{t?.kidsProfileQuestionDesc || "Restricts maturity rating access to G & PG (Animation, Comedy, Family only)."}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  isKids ? "bg-yellow-500 border-yellow-500 text-black" : "border-zinc-700"
                }`}>
                  {isKids && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Avatar Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.selectAvatar || "Select Avatar Icon"}</label>
                <div className="flex flex-wrap gap-3">
                  {sampleAvatars.map((avUrl, i) => (
                    <img 
                      key={i}
                      src={avUrl}
                      alt="Avatar candidate"
                      onClick={() => setSelectedAvatar(avUrl)}
                      className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition-all ${
                        selectedAvatar === avUrl ? "border-red-500 scale-105" : "border-zinc-800 hover:border-zinc-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="flex-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {t?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t?.saving || "Saving..."}</span>
                  </>
                ) : (
                  <span>{t?.saveProfile || "Save Profile"}</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdateAccount} className="space-y-5 animate-in fade-in duration-300" id="account-edit-form">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                {t?.accountSettings || "Account Settings"}
              </h2>
              <p className="text-xs text-zinc-500">{t?.modifySaaSDesc || "Update account identity, main avatar, and password. Changes sync to MongoDB Atlas."}</p>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-zinc-900 pb-px mb-5 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAccountTab("profile")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  accountTab === "profile"
                    ? "border-red-600 text-white font-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <UserRound className="w-4 h-4" />
                {t?.profileLabel || "Profile Info"}
              </button>
              <button
                type="button"
                onClick={() => setAccountTab("password")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  accountTab === "password"
                    ? "border-red-600 text-white font-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                {t?.passwordLabel || "Change Password"}
              </button>
              <button
                type="button"
                onClick={() => setAccountTab("profiles")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                  accountTab === "profiles"
                    ? "border-red-600 text-white font-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Users className="w-4 h-4" />
                {t?.manageProfiles || "Profiles"}
              </button>
            </div>

            {/* TAB CONTENT: PROFILE INFO */}
            {accountTab === "profile" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4 items-start rounded-xl border border-zinc-900 bg-zinc-950/60 p-4">
                  <div className="flex flex-col items-center gap-2 mx-auto">
                    <img
                      src={accountAvatar || currentUser.profileImage || selectedAvatar}
                      alt={accountName}
                      className="w-20 h-20 rounded-xl object-cover border border-zinc-800"
                    />
                    <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Preview</span>
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.nameLabel || "Name"}</label>
                        <input
                          value={accountName}
                          required
                          onChange={(e) => setAccountName(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.emailLabel || "Email"}</label>
                        <input
                          type="email"
                          required
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t?.avatarUrl || "Main Avatar URL"}</label>
                      <input
                        value={accountAvatar}
                        onChange={(e) => setAccountAvatar(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Account Metadata info */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-zinc-500" />
                      Account Identity
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-zinc-900/60">
                        <span className="text-zinc-500">System Role:</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm ${
                          currentUser.role === "admin" 
                            ? "bg-red-950/40 text-red-400 border border-red-900/30" 
                            : "bg-zinc-900 text-zinc-300"
                        }`}>
                          {currentUser.role === "admin" ? "ADMINISTRATOR" : "MEMBER"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-zinc-500">Member Since:</span>
                        <span className="text-zinc-300 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {new Date(currentUser.createdAt || Date.now()).toLocaleDateString(t?.browse === "Beranda" ? 'id-ID' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Status info */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      Membership Subscription
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-zinc-900/60">
                        <span className="text-zinc-500">Plan Tier:</span>
                        {currentUser.isPremium ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5 fill-amber-500" />
                            VIP PREMIUM
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-sm bg-zinc-900 text-zinc-500">
                            FREE MEMBERSHIP
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-zinc-500">Streaming Access:</span>
                        <span className="text-zinc-300 font-semibold">
                          {currentUser.isPremium ? "Unlimited 4K HDR" : "Ad-supported HD"}
                        </span>
                      </div>
                      {!currentUser.isPremium && onOpenSubscription && (
                        <button
                          type="button"
                          onClick={onOpenSubscription}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] py-1.5 rounded-md transition-colors mt-2 flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-500/10"
                        >
                          <Sparkles className="w-3 h-3 text-black fill-black" />
                          UPGRADE TO VIP PREMIUM
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Personalization (Theme Color Picker) */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                        Theme Color Preference
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Select a personal theme accent color to personalize your interface experience.
                      </p>
                      
                      {/* Presets List */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => handleUpdateThemeColor(preset.value)}
                            title={preset.name}
                            className={`w-5 h-5 rounded-full border transition-all transform hover:scale-110 cursor-pointer ${
                              activeColor.toLowerCase() === preset.value.toLowerCase()
                                ? "border-white scale-105 shadow-md shadow-white/10"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: preset.value }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 mt-3 border-t border-zinc-900/60 pt-2">
                      {/* Custom Picker */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeColor}
                          onChange={(e) => handleUpdateThemeColor(e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0 rounded-sm"
                        />
                        <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">
                          Custom: {activeColor}
                        </span>
                      </div>
                      
                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={() => handleUpdateThemeColor("")}
                        className="w-full text-center bg-zinc-900 border border-zinc-800 text-[9px] hover:text-white font-bold py-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: EDIT PASSWORD */}
            {accountTab === "password" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                      {t?.passwordLabel || "Edit Password"}
                    </h4>
                    <p className="text-[10px] text-zinc-500">Provide your current account password to authorize changing to a new password.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">{t?.currentPassword || "Current password"}</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">{t?.newPasswordOptional || "New password (Optional)"}</label>
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900/50 border border-zinc-850 rounded-lg">
                    <ul className="list-disc pl-4 text-[10px] text-zinc-500 space-y-1">
                      <li>Security standard: Choose a strong password you do not use elsewhere.</li>
                      <li>Password updates require verification of your current password.</li>
                      <li>Leave these fields empty if you do not want to change your password.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SUB-PROFILES */}
            {accountTab === "profiles" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        Manage Viewing Profiles
                      </h4>
                      <p className="text-[10px] text-zinc-500">View and manage personalized sub-profiles for your family members.</p>
                    </div>
                    {(currentUser.profiles?.length || 0) < 5 && (
                      <button
                        type="button"
                        onClick={() => setMode("create")}
                        className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {t?.addProfileBtn || "Add Profile"}
                      </button>
                    )}
                  </div>

                  {/* Profiles List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                    {currentUser.profiles?.map((profile) => {
                      const isActive = currentUser.activeProfileId === profile.id;
                      return (
                        <div 
                          key={profile.id}
                          onClick={() => handleSelectProfile(profile.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group hover:bg-zinc-900/60 ${
                            isActive ? "bg-red-950/10 border-red-900/40" : "bg-zinc-950 border-zinc-900"
                          }`}
                          title="Click to switch to this profile"
                        >
                          <div className="relative shrink-0">
                            <img 
                              src={profile.avatar} 
                              alt={profile.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-850 group-hover:scale-105 transition-transform"
                            />
                            {profile.isKids && (
                              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[7px] font-black px-1 py-0.5 rounded-md shadow-xs">
                                KIDS
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-white truncate">{profile.name}</span>
                            <span className="block text-[10px] text-zinc-500">
                              {isActive ? "Active Profile" : "Click to Switch"}
                            </span>
                          </div>

                          {/* Delete Icon (only if it is not the only profile) */}
                          {(currentUser.profiles?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProfile(e, profile.id)}
                              title={t?.deleteProfile || "Delete Profile"}
                              className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {accountTab !== "profiles" && (
              <div className="pt-4 border-t border-zinc-900 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="flex-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t?.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {t?.saveChanges || "Save Changes"}
                </button>
              </div>
            )}
            {accountTab === "profiles" && (
              <div className="pt-4 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t?.backToSwitcher || "Back to Switcher"}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
