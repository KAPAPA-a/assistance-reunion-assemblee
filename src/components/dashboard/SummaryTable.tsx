"use client";

import React from "react";
import { formatNombreFR } from "@/lib/utils";
import type { StatsOverview } from "@/types";

interface SummaryTableProps {
  stats: StatsOverview;
  title?: string;
  subtitle?: string;
}

export function SummaryTable({
  stats,
  title = "Tableau récapitulatif général",
  subtitle = "Synthèse consolidée des dimanches et des jeudis",
}: SummaryTableProps) {
  const rows = [
    {
      indicateur: "Nombre de jours",
      dimanche: stats.totalDimanches,
      jeudi: stats.totalJeudis,
      total: stats.totalJours,
      isBold: false,
    },
    {
      indicateur: "Total des assistants",
      dimanche: formatNombreFR(stats.totalAssistantsDimanche),
      jeudi: formatNombreFR(stats.totalAssistantsJeudi),
      total: formatNombreFR(stats.totalGeneralAssistants),
      isBold: false,
    },
    {
      indicateur: "Moyenne par jour",
      dimanche: formatNombreFR(stats.moyenneDimanche),
      jeudi: formatNombreFR(stats.moyenneJeudi),
      total: formatNombreFR(stats.moyenneGenerale),
      isBold: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 px-4">INDICATEURS</th>
              <th className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400">
                DIMANCHE
              </th>
              <th className="py-3 px-4 text-right text-cyan-600 dark:text-cyan-400">
                JEUDI
              </th>
              <th className="py-3 px-4 text-right text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={
                  row.isBold
                    ? "bg-slate-50/70 dark:bg-slate-800/30 font-bold"
                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                }
              >
                <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  {row.indicateur}
                </td>
                <td className="py-3.5 px-4 text-right text-indigo-700 dark:text-indigo-300 font-mono">
                  {row.dimanche}
                </td>
                <td className="py-3.5 px-4 text-right text-cyan-700 dark:text-cyan-300 font-mono">
                  {row.jeudi}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-800/50">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
