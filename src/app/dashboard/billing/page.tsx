"use client";

import React, { useState } from "react";
import { CreditCard, Check, ShieldAlert, Award, Star, Clock } from "lucide-react";

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState("Growth"); // Simulating active user plan
  const [billingCycle, setBillingCycle] = useState("Monthly");

  const plans = [
    {
      name: "Starter",
      price: 0,
      limits: "100 messages/mo • 1 Chatbot Agent • 5 Documents",
      badge: "Free Tier"
    },
    {
      name: "Growth",
      price: billingCycle === "Monthly" ? 49 : 39,
      limits: "2,000 messages/mo • 3 Chatbot Agents • 50 Documents",
      badge: "Current Plan",
      active: true
    },
    {
      name: "Scale",
      price: billingCycle === "Monthly" ? 199 : 159,
      limits: "15,000 messages/mo • Unlimited Agents • Unlimited Documents",
      badge: "Pro Enterprise"
    }
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold font-outfit text-slate-800 font-sans">Billing & Plans</h2>
        <p className="text-xs text-slate-500">Monitor message allocations, update credit cards, or change subscription tiers.</p>
      </div>

      {/* Subscription Metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Tier</span>
          <p className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-blue-600" />
            {activePlan} Professional
          </p>
        </div>

        {/* Metric 2 */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Usage Allocation</span>
          <p className="text-lg font-bold text-slate-800">12 / 2,000</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[2%]"></div>
          </div>
          <span className="text-[9px] text-slate-400 block pt-0.5">Resets on Aug 1, 2026</span>
        </div>

        {/* Metric 3 */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Billing Card</span>
          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
            <CreditCard className="w-4 h-4 text-slate-500" />
            Visa ending in 4242
          </p>
        </div>

      </div>

      {/* Plan selection */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <h3 className="font-outfit text-sm font-bold text-slate-800">Available Subscription Tiers</h3>
          
          {/* Billing cycle toggler */}
          <div className="inline-flex bg-slate-50 border border-slate-200 rounded-full p-1 shrink-0">
            <button
              onClick={() => setBillingCycle("Monthly")}
              className={`text-[10px] font-bold px-3 py-1 rounded-full transition ${billingCycle === "Monthly" ? "bg-blue-600 text-white" : "text-slate-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("Yearly")}
              className={`text-[10px] font-bold px-3 py-1 rounded-full transition ${billingCycle === "Yearly" ? "bg-blue-600 text-white" : "text-slate-500"}`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`border rounded-2xl p-5 flex flex-col justify-between relative ${
                plan.active 
                  ? "border-blue-600/30 bg-blue-50/10 shadow-sm" 
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-outfit text-xs font-bold text-slate-700">{plan.name}</h4>
                  <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                    plan.active 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold">$</span>
                  <span className="text-3xl font-extrabold font-outfit leading-none">{plan.price}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">/mo</span>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{plan.limits}</p>
              </div>

              {!plan.active ? (
                <button
                  onClick={() => setActivePlan(plan.name)}
                  className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-[10px] transition mt-6"
                >
                  Upgrade to {plan.name}
                </button>
              ) : (
                <div className="w-full text-center text-emerald-600 bg-emerald-50 border border-emerald-100 font-semibold py-2 rounded-xl text-[10px] mt-6 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Active Subscription
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
