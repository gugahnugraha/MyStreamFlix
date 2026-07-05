/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, LogIn, UserPlus, HelpCircle, KeyRound, AlertTriangle } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        
        onSuccess(data.user);
        onClose();
      } else if (mode === "register") {
        if (!name.trim()) throw new Error("Full name is required.");
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        onSuccess(data.user);
        onClose();
      } else {
        // Forgot password route simulation
        if (!email) throw new Error("Please enter your registered email address.");
        setSuccessMsg("A password recovery link has been dispatched to your email mailbox!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4" id="auth-modal">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl relative flex flex-col p-6 space-y-4">
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          id="auth-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Form Title Headline */}
        <div className="text-center pt-2">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {mode === "login" && "Sign In"}
            {mode === "register" && "Create SaaS Profile"}
            {mode === "forgot" && "Recover Passcode"}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1">
            {mode === "login" && "Authenticate to access continuous watching and favorite list storage."}
            {mode === "register" && "Gain exclusive access to pristine 4K video feeds immediately."}
            {mode === "forgot" && "Submit your email address to receive password reset tokens."}
          </p>
        </div>

        {/* Error message card */}
        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-md flex items-start gap-2 text-[11px] text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message card */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-md flex items-start gap-2 text-[11px] text-emerald-400">
            <LogIn className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input fields form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs text-white focus:outline-hidden focus:border-red-500/50"
                id="auth-input-name"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email Address *</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs text-white focus:outline-hidden focus:border-red-500/50"
              id="auth-input-email"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password *</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setErrorMsg(""); }}
                    className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    Forgot passcode?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 p-2.5 rounded text-xs text-white focus:outline-hidden focus:border-red-500/50"
                id="auth-input-password"
              />
            </div>
          )}

          {/* Form Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold text-xs py-2.5 rounded shadow-lg shadow-red-600/10 cursor-pointer transition-colors"
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login" && <LogIn className="w-3.5 h-3.5" />}
                {mode === "register" && <UserPlus className="w-3.5 h-3.5" />}
                {mode === "forgot" && <KeyRound className="w-3.5 h-3.5" />}
                <span className="capitalize">{mode === "forgot" ? "Dispatch Recover Link" : mode}</span>
              </>
            )}
          </button>
        </form>

        {/* Sub-tabs toggle links */}
        <div className="border-t border-zinc-900 pt-3 text-center text-xs text-zinc-500">
          {mode === "login" && (
            <p>
              New to our marketplace?{" "}
              <button
                onClick={() => { setMode("register"); setErrorMsg(""); }}
                className="text-red-500 hover:underline font-semibold cursor-pointer"
                id="toggle-register-btn"
              >
                Sign Up Now
              </button>
            </p>
          )}

          {mode === "register" && (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setErrorMsg(""); }}
                className="text-red-500 hover:underline font-semibold cursor-pointer"
                id="toggle-login-btn"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === "forgot" && (
            <button
              onClick={() => { setMode("login"); setErrorMsg(""); }}
              className="text-red-500 hover:underline font-semibold cursor-pointer"
              id="toggle-forgot-back-btn"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
