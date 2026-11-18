"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  FileSpreadsheet,
  FileDown,
  Printer,
  Calendar,
  Award,
  AlertTriangle,
  RefreshCw,
  Sun,
  Users,
  Activity,
} from "lucide-react";
import { formatNombreFR, MOIS_FRANCAIS } from "@/lib/utils";
import type { AnnualReportData } from "@/types";
import { AutoCommentaryCard } from "@/components/dashboard/AutoCommentaryCard";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function BilanAnnuelPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [annualData, setAnnualData] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnnual = async (yr: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?type=annual&year=${yr}`);
      const json = await res.json();
      if (json.success) {
        setAnnualData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnual(selectedYear);
  }, [selectedYear]);

  // Export Excel
  const handleExportExcel = () => {
    if (!annualData) return;

    // Tableau mensuel
    const breakdownData = annualData.monthlyBreakdown.map((m) => ({
      Mois: m.monthName,
      Dimanches: m.dimanches,
      Jeudis: m.jeudis,
      "Total Jours": m.totalJours,
      Assistants: m.assistants,
      "Moyenne Journalière": m.moyenne,
    }));

    // Ligne Totale
    breakdownData.push({
      Mois: "TOTAL ANNUEL",
      Dimanches: annualData.totalDimanches,
      Jeudis: annualData.totalJeudis,
      "Total Jours": annualData.totalGeneralJours,
      Assistants: annualData.totalGeneralAssistants,
      "Moyenne Journalière": annualData.moyenneAnnuelle,
    });

    const ws = XLSX.utils.json_to_sheet(breakdownData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Bilan ${annualData.year}`);
    XLSX.writeFile(wb, `bilan_annuel_${annualData.year}.xlsx`);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!annualData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Bilan Annuel d'Activité des Accueils - Année ${annualData.year}`, 14, 18);

    doc.setFontSize(10);
    doc.text(`Document officiel généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 25);

    // Indicateurs résumés
    const summaryRows = [
      ["Total général des jours", String(annualData.totalGeneralJours)],
      ["Total des dimanches", `${annualData.totalDimanches} (${annualData.totalDimanchesAssistants} ass.)`],
      ["Total des jeudis", `${annualData.totalJeudis} (${annualData.totalJeudisAssistants} ass.)`],
      ["Total annuel des assistants", String(annualData.totalGeneralAssistants)],
      ["Moyenne annuelle journalière", `${formatNombreFR(annualData.moyenneAnnuelle)} ass./jour`],
      ["Moyenne du dimanche", `${formatNombreFR(annualData.moyenneDimanche)} ass./jour`],
      ["Moyenne du jeudi", `${formatNombreFR(annualData.moyenneJeudi)} ass./jour`],
      ["Meilleur mois", annualData.meilleurMois ? `${annualData.meilleurMois.monthName} (${formatNombreFR(annualData.meilleurMois.moyenne)} ass./j)` : "N/A"],
      ["Mois le plus faible", annualData.faibleMois ? `${annualData.faibleMois.monthName} (${formatNombreFR(annualData.faibleMois.moyenne)} ass./j)` : "N/A"],
    ];

    autoTable(doc, {
      head: [["INDICATEUR CLÉ", "VALEUR DE L'EXERCICE"]],
      body: summaryRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8.5 },
    });

    // Tableau mensuel complet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Tableau récapitulatif annuel (12 mois)", 14, lastY);

    const tableRows = annualData.monthlyBreakdown.map((m) => [
      m.monthName,
      String(m.dimanches),
      String(m.jeudis),
      String(m.totalJours),
      formatNombreFR(m.assistants),
      formatNombreFR(m.moyenne),
    ]);

    // Ligne totale
    tableRows.push([
      "TOTAL",
      String(annualData.totalDimanches),
      String(annualData.totalJeudis),
      String(annualData.totalGeneralJours),
      formatNombreFR(annualData.totalGeneralAssistants),
      formatNombreFR(annualData.moyenneAnnuelle),
    ]);

    autoTable(doc, {
      head: [["MOIS", "DIMANCHES", "JEUDIS", "TOTAL JOURS", "ASSISTANTS", "MOYENNE"]],
      body: tableRows,
      startY: lastY + 4,
      theme: "striped",
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 8.5 },
    });

    // Commentaire annuel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text("Analyse annuelle, conclusions et recommandations :", 14, commY);
    doc.setFontSize(8.5);
    const splitComment = doc.splitTextToSize(annualData.commentaire, 180);
    doc.text(splitComment, 14, commY + 6);

    doc.save(`bilan_annuel_${annualData.year}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Module de bilan annuel
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Rapport d&apos;exercice annuel complet, décomposition mensuelle et orientations stratégiques
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-bold outline-none"
            >
              {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  Exercice {yr}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchAnnual(selectedYear)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {annualData && (
        <div className="space-y-6 print-container">
          {/* Titre officiel document */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest font-black text-indigo-600 dark:text-indigo-400">
                  RAPPORT ANNUEL OFFICIEL
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Bilan d&apos;activité - Exercice {annualData.year}
                </h2>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Édition officielle</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {annualData.totalGeneralJours} journées au total
                </p>
              </div>
            </div>

            {/* Indicateurs annuels (Section 10) */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                Indicateurs annuels clés
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Dimanches</span>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {annualData.totalDimanches}
                  </div>
                  <span className="text-xs text-slate-400">{formatNombreFR(annualData.totalDimanchesAssistants)} ass.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Jeudis</span>
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                    {annualData.totalJeudis}
                  </div>
                  <span className="text-xs text-slate-400">{formatNombreFR(annualData.totalJeudisAssistants)} ass.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Général Jours</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {annualData.totalGeneralJours}
                  </div>
                  <span className="text-xs text-slate-400">{annualData.totalGeneralAssistants} assistants</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Moyenne Dimanche</span>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatNombreFR(annualData.moyenneDimanche)}
                  </div>
                  <span className="text-xs text-slate-400">ass. / séance</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Moyenne Jeudi</span>
                  <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                    {formatNombreFR(annualData.moyenneJeudi)}
                  </div>
                  <span className="text-xs text-slate-400">ass. / séance</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 col-span-2 sm:col-span-1">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Moyenne Annuelle</span>
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                    {formatNombreFR(annualData.moyenneAnnuelle)}
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">ass. / jour</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 col-span-2 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Meilleur Mois :</span>
                  </div>
                  <div className="text-base font-bold text-amber-900 dark:text-amber-200 mt-1">
                    {annualData.meilleurMois
                      ? `${annualData.meilleurMois.monthName} (${formatNombreFR(annualData.meilleurMois.moyenne)} ass./jour)`
                      : "Aucune donnée"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 col-span-2 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Mois le plus faible :</span>
                  </div>
                  <div className="text-base font-bold text-rose-900 dark:text-rose-200 mt-1">
                    {annualData.faibleMois
                      ? `${annualData.faibleMois.monthName} (${formatNombreFR(annualData.faibleMois.moyenne)} ass./jour)`
                      : "Aucune donnée"}
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau annuel détaillé (12 mois) */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                Tableau annuel récapitulatif
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">MOIS</th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700">DIMANCHES</th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700">JEUDIS</th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700">TOTAL JOURS</th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700">ASSISTANTS</th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700">MOYENNE</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {annualData.monthlyBreakdown.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {m.monthName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono border border-slate-200 dark:border-slate-700">
                          {m.dimanches}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono border border-slate-200 dark:border-slate-700">
                          {m.jeudis}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium border border-slate-200 dark:border-slate-700">
                          {m.totalJours}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium border border-slate-200 dark:border-slate-700">
                          {formatNombreFR(m.assistants)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                          {formatNombreFR(m.moyenne)}
                        </td>
                      </tr>
                    ))}
                    {/* Ligne Totale */}
                    <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-3 px-4 border border-slate-200 dark:border-slate-700">
                        TOTAL ANNUEL
                      </td>
                      <td className="py-3 px-4 text-right font-mono border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
                        {annualData.totalDimanches}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
                        {annualData.totalJeudis}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border border-slate-200 dark:border-slate-700">
                        {annualData.totalGeneralJours}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400">
                        {formatNombreFR(annualData.totalGeneralAssistants)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                        {formatNombreFR(annualData.moyenneAnnuelle)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analyse annuelle, conclusions et recommandations */}
            <AutoCommentaryCard
              commentary={annualData.commentaire}
              title={`Analyse annuelle et recommandations - Exercice ${annualData.year}`}
              subtitle="Synthèse stratégique annuelle et pistes d'amélioration"
            />
          </div>
        </div>
      )}
    </div>
  );
}
