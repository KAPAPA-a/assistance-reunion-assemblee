"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  TableProperties,
  BarChart3,
  CalendarDays,
  GitCompare,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Church,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/accueil", label: "Nouvel accueil", icon: CalendarPlus },
  { href: "/liste-accueils", label: "Liste des accueils", icon: TableProperties },
  { href: "/statistiques", label: "Statistiques générales", icon: BarChart3 },
  { href: "/releves-mensuels", label: "Relevés mensuels", icon: CalendarDays },
  { href: "/comparaisons", label: "Comparaisons mensuelles", icon: GitCompare },
  { href: "/bilan-annuel", label: "Bilan annuel", icon: TrendingUp },
  { href: "/rapports", label: "Rapports", icon: FileSpreadsheet },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay pour mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Barre latérale */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 shadow-xl no-print",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo & Titre */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 flex-shrink-0">
              <Church className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide text-white uppercase">Gestion Accueil</span>
                <span className="text-xs text-indigo-400 font-medium">Dimanche & Jeudi</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}

                {/* Bulle info-bulle en mode réduit */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bouton de déconnexion / Sortir */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              } catch (e) {
                window.location.href = "/login";
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
            title={collapsed ? "Déconnexion (Sortir)" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Pied de menu */}
        <div className="p-2.5 border-t border-slate-800/50 text-[11px] text-slate-500 text-center">
          {!collapsed ? (
            <p>Gestion Accueil • KAPAPA</p>
          ) : (
            <span>v1.0</span>
          )}
        </div>
      </aside>
    </>
  );
}
