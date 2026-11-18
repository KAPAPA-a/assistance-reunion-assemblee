"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Calendar } from "lucide-react";

interface ComparisonBarItem {
  mois: string;
  moisComplet: string;
  MoyenneDimanche: number;
  MoyenneJeudi: number;
  TotalAssistants: number;
  MoyenneGlobale: number;
}

interface LineChartItem {
  mois: string;
  assistants: number;
  moyenne: number;
}

interface PieChartItem {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  comparisonBars: ComparisonBarItem[];
  lineChartData: LineChartItem[];
  pieChartData: PieChartItem[];
  currentYear: number;
  onYearChange?: (year: number) => void;
  availableYears?: number[];
}

export function DashboardCharts({
  comparisonBars,
  lineChartData,
  pieChartData,
  currentYear,
  onYearChange,
  availableYears = [currentYear],
}: DashboardChartsProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const handleYearChange = (yr: number) => {
    setSelectedYear(yr);
    if (onYearChange) onYearChange(yr);
  };

  const hasData = pieChartData.some((p) => p.value > 0);

  return (
    <div className="space-y-6">
      {/* Sélecteur d'année global */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide">
            Analyses graphiques & Évolutions
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">Année de référence :</span>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grille 2x2 des graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. BarChart : Comparaison Dimanche vs Jeudi (Moyennes par mois) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Comparaison Dimanche vs Jeudi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Moyenne d&apos;assistants par jour selon le mois
              </p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} ass./jour`, ""]}
                  labelFormatter={(label) => `Mois : ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderRadius: "0.75rem",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="MoyenneDimanche" name="Moyenne Dimanche" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MoyenneJeudi" name="Moyenne Jeudi" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. LineChart : Évolution mensuelle des assistants */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Évolution mensuelle des effectifs
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cumul mensuel des assistants enregistrés
              </p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <LineIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} assistants`, "Total"]}
                  labelFormatter={(label) => `Mois : ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderRadius: "0.75rem",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="assistants"
                  name="Total Assistants"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. PieChart : Répartition des assistants (Dimanche vs Jeudi) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Répartition des assistants
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Part cumulée entre le Dimanche et le Jeudi
              </p>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                    label={(entry) => `${entry.name} : ${entry.value}`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} assistants`, "Volume"]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "0.75rem",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs py-10">
                Aucune donnée à afficher pour la répartition.
              </div>
            )}
          </div>
        </div>

        {/* 4. Graphique comparatif : Évolution de la moyenne journalière */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Évolution de la moyenne journalière
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Moyenne globale par séance au fil des mois
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <LineIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} ass./jour`, "Moyenne"]}
                  labelFormatter={(label) => `Mois : ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderRadius: "0.75rem",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="moyenne"
                  name="Moyenne journalière"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#f59e0b" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
