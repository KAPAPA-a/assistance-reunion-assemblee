"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  TableProperties,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Tableau",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/liste-accueils",
      label: "Liste",
      icon: TableProperties,
      active: pathname === "/liste-accueils",
    },
    {
      href: "/accueil",
      label: "Ajouter",
      icon: CalendarPlus,
      active: pathname === "/accueil",
      isAction: true,
    },
    {
      href: "/statistiques",
      label: "Stats",
      icon: BarChart3,
      active: pathname === "/statistiques",
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] no-print pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                    item.active
                      ? "bg-blue-700 text-white shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-950"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors active:scale-95",
                item.active
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Bouton pour ouvrir le menu complet */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center w-14 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors active:scale-95"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
