"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, PlusCircle, Calendar } from "lucide-react";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [isMeetingDay, setIsMeetingDay] = useState<"DIMANCHE" | "JEUDI" | null>(null);

  useEffect(() => {
    // Vérification du thème enregistré ou préférence système
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }

    // Date actuelle en français
    const now = new Date();
    const formatted = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    // Capitaliser la première lettre
    setCurrentDateStr(formatted.charAt(0).toUpperCase() + formatted.slice(1));

    // Détection si aujourd'hui est un jour d'accueil officiel
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0) setIsMeetingDay("DIMANCHE");
    else if (dayOfWeek === 4) setIsMeetingDay("JEUDI");
    else setIsMeetingDay(null);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          title="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm font-medium">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline font-semibold">{currentDateStr}</span>
        </div>

        {isMeetingDay && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Aujourd&apos;hui : Séance du {isMeetingDay}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Bouton rapide d'enregistrement */}
        <Link
          href="/accueil"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvel accueil</span>
        </Link>

        {/* Toggle Mode Clair / Sombre */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
