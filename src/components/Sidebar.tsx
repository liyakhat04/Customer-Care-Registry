import React from "react";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  BookOpen, 
  ShieldAlert, 
  Settings, 
  Sparkles,
  LifeBuoy
} from "lucide-react";
import { UserRole } from "../types.js";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
}

export default function Sidebar({ currentTab, setCurrentTab, userRole }: SidebarProps) {
  // Navigation tabs based on user roles (RBAC)
  const menuItems = [
    { id: "dashboard", label: "Analytics Dashboard", icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT] },
    { id: "tickets", label: "Ticket Center", icon: Ticket, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT, UserRole.CUSTOMER] },
    { id: "customers", label: "Customer Hub", icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT] },
    { id: "kb", label: "Knowledge Base", icon: BookOpen, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT, UserRole.CUSTOMER] },
    { id: "audit", label: "Audit Logs", icon: ShieldAlert, roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_MANAGER] },
    { id: "settings", label: "System Settings", icon: Settings, roles: [UserRole.SUPER_ADMIN] }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <LifeBuoy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-none tracking-tight text-white">CareRegistry</h1>
          <span className="text-[10px] font-mono text-indigo-400 font-medium">ENTERPRISE v2.6</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Support Operations
        </div>
        
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-semibold" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Assistant Banner */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini AI Engine Live</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Equipped with sentiment loops, ticket auto-categorization, and reply suggestion drafts.
          </p>
        </div>
      </div>
    </aside>
  );
}
