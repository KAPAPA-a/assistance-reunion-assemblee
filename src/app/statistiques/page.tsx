import React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Sun, Calendar, Users, Activity, HelpCircle } from "lucide-react";
import { getStatsOverview } from "@/services/statistiques.service";
import { genererCommentaireGeneral } from "@/services/commentaires.service";
import { SummaryTable } from "@/components/dashboard/SummaryTable";
import { AutoCommentaryCard } from "@/components/dashboard/AutoCommentaryCard";
import { formatNombreFR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StatistiquesPage() {
  const stats = await getStatsOverview();
  const commentary = genererCommentaireGeneral(stats, "l'ensemble de la période d'activité");

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tableau de bord</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Module de calcul des statistiques
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Indicateurs détaillés et décomposition statistique automatique calculée depuis PostgreSQL
        </p>
      </div>

      {/* A. STATISTIQUES DES JOURS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            A. Statistiques des journées d&apos;accueil
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              1. Total des dimanches
            </span>
            <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-2">
              {stats.totalDimanches}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Nombre de dimanches enregistrés
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50">
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              2. Total des jeudis
            </span>
            <div className="text-3xl font-black text-cyan-900 dark:text-cyan-100 mt-2">
              {stats.totalJeudis}
            </div>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
              Nombre de jeudis enregistrés
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              3. Total général des jours
            </span>
            <div className="text-3xl font-black text-indigo-900 dark:text-indigo-100 mt-2">
              {stats.totalJours}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Dimanches ({stats.totalDimanches}) + Jeudis ({stats.totalJeudis})
            </p>
          </div>
        </div>
      </div>

      {/* B. STATISTIQUES DES ASSISTANTS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            B. Statistiques des assistants
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              4. Total assistants du dimanche
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {formatNombreFR(stats.totalAssistantsDimanche)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Somme des assistants présents les dimanches
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              5. Total assistants du jeudi
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {formatNombreFR(stats.totalAssistantsJeudi)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Somme des assistants présents les jeudis
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              6. Total général des assistants
            </span>
            <div className="text-3xl font-black text-purple-900 dark:text-purple-100 mt-2">
              {formatNombreFR(stats.totalGeneralAssistants)}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Total dimanche + Total jeudi
            </p>
          </div>
        </div>
      </div>

      {/* C. CALCUL DES MOYENNES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            C. Calcul des moyennes par journée
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              7. Moyenne du dimanche
            </span>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
              {formatNombreFR(stats.moyenneDimanche)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.totalAssistantsDimanche} / {stats.totalDimanches || 1} dimanche(s)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              8. Moyenne du jeudi
            </span>
            <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 mt-2">
              {formatNombreFR(stats.moyenneJeudi)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.totalAssistantsJeudi} / {stats.totalJeudis || 1} jeudi(s)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              9. Moyenne générale journalière
            </span>
            <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-2">
              {formatNombreFR(stats.moyenneGenerale)}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Total général / Total jours ({stats.totalJours || 1})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>
            Règle appliquée : en cas de zéro jour enregistré, la valeur affichée est strictement 0 (aucune erreur de division par zéro).
          </span>
        </div>
      </div>

      {/* D. INDICATEURS AVANCÉS & DISPERSION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            D. Indicateurs avancés & Distribution des présences
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              10. Médiane de participation
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats.medianeAssistants || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Valeur centrale (50% des séances ont réuni au moins cet effectif)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              11. Affluence maximale (Record)
            </span>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
              {stats.meilleureJournee ? `${stats.meilleureJournee.count} ass.` : "N/A"}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.meilleureJournee ? `${stats.meilleureJournee.date} (${stats.meilleureJournee.dayType})` : "-"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              12. Affluence la plus modérée
            </span>
            <div className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-2">
              {stats.pireJournee ? `${stats.pireJournee.count} ass.` : "N/A"}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.pireJournee ? `${stats.pireJournee.date} (${stats.pireJournee.dayType})` : "-"}
            </p>
          </div>
        </div>

        {/* Répartition par tranches */}
        {stats.repartitionTranches && stats.repartitionTranches.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Répartition par tranches de participation ({stats.totalJours} séances) :
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.repartitionTranches.map((t, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t.tranche}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{t.count} ({t.pourcentage} %)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, t.pourcentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TABLEAU RÉCAPITULATIF GÉNÉRAL (Section 6) */}
      <SummaryTable
        stats={stats}
        title="Tableau récapitulatif général consolidé"
        subtitle="Tableau officiel des indicateurs clés (Dimanche, Jeudi, Total)"
      />

      {/* COMMENTAIRE AUTOMATIQUE */}
      <AutoCommentaryCard
        commentary={commentary}
        title="Commentaire analytique général"
        subtitle="Interprétation automatique des moyennes et recommandations"
      />
    </div>
  );
}
