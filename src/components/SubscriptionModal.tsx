/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Check, CreditCard, Sparkles, Shield, Tv, Laptop, Smartphone, HelpCircle } from "lucide-react";
import { User } from "../types";

interface SubscriptionModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  t?: any;
}

export default function SubscriptionModal({ currentUser, onClose, onSuccess, t }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"vip" | "premium" | "ultra">("premium");
  const [checkoutStep, setCheckoutStep] = useState<"plans" | "payment" | "success">("plans");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const plans = [
    {
      id: "vip" as const,
      name: "VIP",
      price: "Rp 39.000",
      period: "month",
      resolution: "HD (720p)",
      screens: "1 Screen",
      devices: "Mobile & Tablet only",
      features: ["Standard Audio Quality", "Contains limited ads"],
      color: "border-zinc-800 hover:border-zinc-700",
      badgeColor: "bg-zinc-800 text-zinc-300",
    },
    {
      id: "premium" as const,
      name: "PREMIUM",
      price: "Rp 79.000",
      period: "month",
      resolution: "Full HD (1080p)",
      screens: "2 Screens",
      devices: "TV, Laptop, Mobile & Tablet",
      features: ["Dolby Audio 5.1 Support", "100% Ad-Free Streaming", "Supports Offline Downloads"],
      color: "border-red-600/60 shadow-lg shadow-red-950/10",
      badgeColor: "bg-red-600 text-white animate-pulse",
      popular: true,
    },
    {
      id: "ultra" as const,
      name: "ULTRA 4K",
      price: "Rp 119.000",
      period: "month",
      resolution: "Ultra HD (4K) + HDR",
      screens: "4 Screens",
      devices: "All Devices (UHD Supported)",
      features: ["Dolby Atmos & Spatial Audio", "100% Ad-Free Streaming", "Max Quality Offline Downloads", "VIP Early Access Releases"],
      color: "border-amber-600/40 hover:border-amber-500",
      badgeColor: "bg-amber-500 text-black font-black",
    },
  ];

  const handleStartCheckout = () => {
    if (!currentUser) {
      setErrorMessage("Please log in first to purchase a subscription.");
      return;
    }
    setCheckoutStep("payment");
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCVV) {
      setErrorMessage("Please fill in all credit card details.");
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);

    // Simulate payment authorization network latency
    setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        
        if (res.ok) {
          const data = await res.json();
          setIsProcessing(false);
          setCheckoutStep("success");
          onSuccess(data.user);
        } else {
          throw new Error("Subscription registration failed on server.");
        }
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(err.message || "Payment processor timed out. Please retry.");
      }
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto" id="sub-modal-container">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8" id="sub-modal-card">
        
        {/* Close Button */}
        {checkoutStep !== "success" && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-900 rounded-full transition-colors z-10 cursor-pointer"
            id="sub-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Head Banner */}
        <div className="p-6 md:p-8 bg-linear-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              FlixSphere Pass
              <span className="text-[10px] font-mono bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full lowercase tracking-normal">
                SaaS Simulation
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Unlock direct 4K streaming, multi-screens, and zero ads just like Disney+ & Prime Video.</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8">
          
          {errorMessage && (
            <div className="mb-6 bg-red-950/20 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-lg flex items-center gap-2" id="sub-error-alert">
              <Shield className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {checkoutStep === "plans" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-extrabold text-white">Choose Your Cinematic Experience</h3>
                <p className="text-xs text-zinc-500 max-w-lg mx-auto">Flexible subscription models. Cancel anytime. Simulated payment gateway.</p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative flex flex-col justify-between bg-zinc-950 border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${plan.color} ${
                      selectedPlan === plan.id 
                        ? "ring-2 ring-red-500 border-transparent bg-zinc-900/40" 
                        : "opacity-80 hover:opacity-100"
                    }`}
                    id={`plan-card-${plan.id}`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-600 text-white tracking-wider uppercase">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-zinc-400 tracking-widest">{plan.name}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedPlan === plan.id ? "border-red-500 bg-red-500 text-white" : "border-zinc-700"
                        }`}>
                          {selectedPlan === plan.id && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="border-b border-zinc-900 pb-3">
                        <h4 className="text-2xl font-black text-white">{plan.price}</h4>
                        <p className="text-[10px] text-zinc-500">per {plan.period}</p>
                      </div>

                      {/* Hardware / Spec Limits */}
                      <ul className="space-y-2 text-xs text-zinc-300">
                        <li className="flex items-center gap-2">
                          <Tv className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{plan.resolution}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{plan.screens} / {plan.devices}</span>
                        </li>
                      </ul>

                      {/* Benefit list */}
                      <ul className="space-y-1.5 pt-3 border-t border-zinc-900">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[10px] text-zinc-400">
                            <Check className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom CTA bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-zinc-900 gap-4 bg-zinc-900/20 p-4 rounded-xl">
                <div className="text-left">
                  <p className="text-[10px] text-zinc-500">Selected Plan:</p>
                  <p className="text-sm font-black text-white uppercase">
                    {plans.find(p => p.id === selectedPlan)?.name} • {plans.find(p => p.id === selectedPlan)?.price}/month
                  </p>
                </div>
                <button
                  onClick={handleStartCheckout}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-lg shadow-red-600/10 transition-all transform active:scale-95 cursor-pointer"
                  id="sub-modal-next-step"
                >
                  Continue to Secure Sandbox Checkout
                </button>
              </div>
            </div>
          )}

          {checkoutStep === "payment" && (
            <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-500" />
                  Secure Payment Gateway
                </h3>
                <p className="text-xs text-zinc-500">
                  This is a simulated payment gateway. Please enter mock credentials to test client premium flows.
                </p>
              </div>

              {/* Simulated Card form */}
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    disabled={isProcessing}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4111 2222 3333 4444"
                      disabled={isProcessing}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg pl-10 pr-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                    />
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Expiration Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      disabled={isProcessing}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CVV Code</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      disabled={isProcessing}
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:border-red-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setCheckoutStep("plans")}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    id="sub-modal-submit-payment"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay {plans.find(p => p.id === selectedPlan)?.price}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Simulated secure SSL encryption layer</span>
              </div>
            </div>
          )}

          {checkoutStep === "success" && (
            <div className="text-center py-12 px-4 space-y-6 animate-in zoom-in-95 duration-300" id="sub-success-view">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Premium Subscription Activated!</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Congratulations! Your account is now upgraded to **{plans.find(p => p.id === selectedPlan)?.name}**. All paywalls, premium labels, and restrictions are instantly unlocked.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 max-w-sm mx-auto rounded-xl p-4 text-left text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-500">
                  <span>Subscription Tier:</span>
                  <span className="font-bold text-white uppercase">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Simulated Billing Period:</span>
                  <span className="text-zinc-300">Monthly auto-renewal</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Interactive Screens:</span>
                  <span className="text-zinc-300">{plans.find(p => p.id === selectedPlan)?.screens}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-8 py-2.5 rounded-lg shadow-lg shadow-red-600/10 cursor-pointer"
                  id="sub-success-close-btn"
                >
                  Start Premium Viewing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
