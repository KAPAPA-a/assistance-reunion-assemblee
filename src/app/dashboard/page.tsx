import React from "react";
import Link from "next/link";
import { PlusCircle, TableProperties, BarChart3, FileSpreadsheet } from "lucide-react";
import { getStatsOverview, getDashboardChartsData } from "@/services/statistiques.service";
import { genererCommentaireGeneral } from "@/services/commentaires.service";
import { StatCards } from "@/components/dashboard/StatCards";
import { SummaryTable } from "@/components/dashboard/SummaryTable";
import { DashboardCharts } from "@/components/charts/DashboardCharts";
import { AutoCommentaryCard } from "@/components/dashboard/AutoCommentaryCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [stats, chartsData] = await Promise.all([
    getStatsOverview({ year: currentYear }),
    getDashboardChartsData(currentYear),
  ]);

  const commentary = genererCommentaireGeneral(stats, `l'année en cours (${currentYear})`);

  return (
    <div className="space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestion, suivi et analyse statistique des accueils du dimanche et du jeudi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/accueil"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvel accueil</span>
          </Link>
          <Link
            href="/liste-accueils"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <TableProperties className="w-4 h-4" />
            <span>Voir registre</span>
          </Link>
        </div>
      </div>

      {/* Cartes statistiques KPI (Section 11) */}
      <StatCards stats={stats} />

      {/* Commentaire automatique intelligent (Section 7) */}
      <AutoCommentaryCard
        commentary={commentary}
        title="Analyse statistique automatique"
        subtitle={`Synthèse basée sur les calculs réels de l'exercice ${currentYear}`}
      />

      {/* Tableau récapitulatif général (Section 6) */}
      <SummaryTable
        stats={stats}
        title="Synthèse générale de participation"
        subtitle="Moyennes et totaux calculés en temps réel depuis PostgreSQL"
      />

      {/* Graphiques interactifs Recharts (Section 11) */}
      <DashboardCharts
        comparisonBars={chartsData.comparisonBars}
        lineChartData={chartsData.lineChartData}
        pieChartData={chartsData.pieChartData}
        currentYear={currentYear}
      />
    </div>
  );
}
