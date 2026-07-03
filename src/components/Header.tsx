import React, { useState, useEffect } from "react";
import { Clock, ShieldCheck, UserCheck, ChevronRight, Activity, Bell } from "lucide-react";
import { User, UserRole } from "../types.js";

interface HeaderProps {
  currentTab: string;
  currentUser: User | null;
  onSwitchRole: (role: UserRole) => void;
}

export default function Header({ currentTab, currentUser, onSwitchRole }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatBreadcrumb = (tab: string) => {
    switch (tab) {
      case "dashboard": return "Analytics Dashboard";
      case "tickets": return "Ticket Center (Complaints)";
      case "customers": return "Customer Hub";
      case "kb": return "Knowledge Base Self-Service";
      case "audit": return "Security Audit Logs";
      case "settings": return "System SLA Settings";
      default: return "Enterprise Portal";
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return "bg-rose-50 text-rose-700 border-rose-200";
      case UserRole.SUPPORT_MANAGER: return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case UserRole.SUPPORT_AGENT: return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case UserRole.CUSTOMER: return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 h-18 sticky top-0 z-40 shadow-sm shadow-slate-100/40">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-400 font-medium">Enterprise Hub</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800 font-semibold tracking-tight">
          {formatBreadcrumb(currentTab)}
        </span>
      </div>

      {/* Right Tools & Switcher */}
      <div className="flex items-center space-x-6">
        
        {/* Dynamic Digital Clock */}
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Demo Role Switcher Drawer */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simulate RBAC:</span>
          <select 
            value={currentUser?.role || UserRole.SUPER_ADMIN}
            onChange={(e) => onSwitchRole(e.target.value as UserRole)}
            className="text-xs bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={UserRole.SUPER_ADMIN}>Super Admin (Eleanor)</option>
            <option value={UserRole.SUPPORT_MANAGER}>Support Manager (Marcus)</option>
            <option value={UserRole.SUPPORT_AGENT}>Support Agent (Sarah)</option>
            <option value={UserRole.CUSTOMER}>Customer Portal (John)</option>
          </select>
        </div>

        {/* User Identity widget */}
        {currentUser && (
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
            <img 
              src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
              referrerPolicy="no-referrer"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800">{currentUser.fullName}</div>
              <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 ${getRoleColor(currentUser.role)}`}>
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
