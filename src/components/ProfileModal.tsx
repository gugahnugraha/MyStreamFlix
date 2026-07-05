/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Plus, Trash2, User, Baby, Check, CheckSquare } from "lucide-react";
import { User as UserType, UserProfile } from "../types";

interface ProfileModalProps {
  currentUser: UserType | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserType) => void;
  t?: any;
}

export default function ProfileModal({ currentUser, onClose, onSuccess, t }: ProfileModalProps) {
  const [mode, setMode] = useState<"select" | "create">("select");
  const [profileName, setProfileName] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        setErrorMessage(errData.error || "Failed switching profiles.");
      }
    } catch (err) {
      setErrorMessage("Network error switching profiles.");
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMessage("Please enter a profile name.");
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
        setErrorMessage(errData.error || "Failed creating profile.");
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage("Network error creating profile.");
    }
  };

  const handleDeleteProfile = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // Avoid triggering profile selection on click
    if (!window.confirm("Are you sure you want to delete this profile? All personalized lists will be cleared.")) {
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
        setErrorMessage(errData.error || "Failed deleting profile.");
      }
    } catch (err) {
      setErrorMessage("Network error deleting profile.");
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
              <p className="text-xs text-zinc-500">Select a profile to customize your experience.</p>
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
                        title="Delete Profile"
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
                  <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300">Add Profile</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-900 flex justify-center">
              <button
                onClick={onClose}
                className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white px-6 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Switcher
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateProfile} className="space-y-6 animate-in fade-in duration-300" id="profile-create-form">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Create Sub-Profile</h2>
              <p className="text-xs text-zinc-500">Create a profile with custom avatar and optional G/PG restriction safeguards.</p>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah, Kids Corner"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                />
              </div>

              {/* Kids Toggle */}
              <div 
                onClick={() => setIsKids(!isKids)}
                className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-yellow-500" />
                    Kids Profile?
                  </h4>
                  <p className="text-[10px] text-zinc-500">Restricts maturity rating access to G & PG (Animation, Comedy, Family only).</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  isKids ? "bg-yellow-500 border-yellow-500 text-black" : "border-zinc-700"
                }`}>
                  {isKids && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Avatar Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Avatar Icon</label>
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

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-900 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("select")}
                className="flex-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
