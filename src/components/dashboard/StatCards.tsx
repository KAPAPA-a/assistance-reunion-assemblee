"use client";

import React from "react";
import {
  CalendarDays,
  Sun,
  Calendar,
  Users,
  Activity,
  Award,
} from "lucide-react";
import { formatNombreFR } from "@/lib/utils";
import type { StatsOverview } from "@/types";

interface StatCardsProps {
  stats: StatsOverview;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: "Total des journées",
      value: stats.totalJours,
      subtext: `${stats.totalDimanches} dimanches & ${stats.totalJeudis} jeudis`,
      icon: CalendarDays,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Total dimanches",
      value: stats.totalDimanches,
      subtext: `${formatNombreFR(stats.totalAssistantsDimanche)} assistants cumulés`,
      icon: Sun,
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "Total jeudis",
      value: stats.totalJeudis,
      subtext: `${formatNombreFR(stats.totalAssistantsJeudi)} assistants cumulés`,
      icon: Calendar,
      color: "from-cyan-500 to-teal-600",
      textColor: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    },
    {
      title: "Total général assistants",
      value: formatNombreFR(stats.totalGeneralAssistants),
      subtext: "Tous accueils confondus",
      icon: Users,
      color: "from-purple-500 to-indigo-600",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      title: "Moyenne journalière",
      value: formatNombreFR(stats.moyenneGenerale),
      subtext: "Assistants par jour",
      icon: Activity,
      color: "from-emerald-500 to-green-600",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Moyenne dimanche",
      value: formatNombreFR(stats.moyenneDimanche),
      subtext: "Assistants / dimanche",
      icon: Sun,
      color: "from-indigo-500 to-violet-600",
      textColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "Moyenne jeudi",
      value: formatNombreFR(stats.moyenneJeudi),
      subtext: "Assistants / jeudi",
      icon: Calendar,
      color: "from-teal-500 to-emerald-600",
      textColor: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/40",
    },
    {
      title: "Meilleure journée",
      value: stats.meilleureJournee
        ? `${stats.meilleureJournee.count} ass.`
        : "N/A",
      subtext: stats.meilleureJournee
        ? `${stats.meilleureJournee.date} (${stats.meilleureJournee.dayType.toLowerCase()})`
        : "Aucune donnée",
      icon: Award,
      color: "from-rose-500 to-pink-600",
      textColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 overflow-hidden"
          >
            {/* Effet halo au survol */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${card.bgColor} ${card.textColor} shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 relative z-10">
              <span className="truncate">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
