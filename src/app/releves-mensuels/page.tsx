"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  FileSpreadsheet,
  FileDown,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { MOIS_FRANCAIS, formatNombreFR, formatDateFR } from "@/lib/utils";
import type { MonthlyReportData } from "@/types";
import { AutoCommentaryCard } from "@/components/dashboard/AutoCommentaryCard";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelevesMensuelsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger le relevé
  const fetchReport = async (yr: number, mo: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?type=monthly&year=${yr}&month=${mo}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error("Erreur chargement relevé mensuel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Export Excel
  const handleExportExcel = () => {
    if (!reportData) return;

    // Feuille 1 : Détail
    const detailData = reportData.records.map((r, i) => ({
      "N°": i + 1,
      Date: r.formattedDate,
      Jour: r.dayType,
      "Nombre d'assistants": r.assistantCount,
      Observation: r.observation || "-",
    }));

    const wsDetail = XLSX.utils.json_to_sheet(detailData);

    // Feuille 2 : Synthèse
    const summaryData = [
      {
        Indicateur: "Nombre de jours",
        Dimanche: reportData.totalDimanches,
        Jeudi: reportData.totalJeudis,
        Total: reportData.totalJours,
      },
      {
        Indicateur: "Total assistants",
        Dimanche: reportData.totalDimancheAssistants,
        Jeudi: reportData.totalJeudiAssistants,
        Total: reportData.totalAssistants,
      },
      {
        Indicateur: "Moyenne par jour",
        Dimanche: reportData.moyenneDimanche,
        Jeudi: reportData.moyenneJeudi,
        Total: reportData.moyenneGenerale,
      },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDetail, "Détail Mensuel");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Synthèse");

    XLSX.writeFile(
      wb,
      `releve_mensuel_${reportData.monthName.toLowerCase()}_${reportData.year}.xlsx`
    );
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(
      `Relevé Mensuel des Accueils - ${reportData.monthName} ${reportData.year}`,
      14,
      18
    );

    doc.setFontSize(10);
    doc.text(`Document officiel généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 25);

    // Synthèse
    const summaryRows = [
      ["Nombre de jours", String(reportData.totalDimanches), String(reportData.totalJeudis), String(reportData.totalJours)],
      ["Total assistants", String(reportData.totalDimancheAssistants), String(reportData.totalJeudiAssistants), String(reportData.totalAssistants)],
      ["Moyenne par jour", formatNombreFR(reportData.moyenneDimanche), formatNombreFR(reportData.moyenneJeudi), formatNombreFR(reportData.moyenneGenerale)],
    ];

    autoTable(doc, {
      head: [["INDICATEURS", "DIMANCHE", "JEUDI", "TOTAL"]],
      body: summaryRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });

    // Tableau détaillé
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Tableau mensuel détaillé", 14, lastY);

    const detailRows = reportData.records.map((r, idx) => [
      String(idx + 1),
      r.formattedDate,
      r.dayType,
      String(r.assistantCount),
    ]);

    autoTable(doc, {
      head: [["N°", "Date", "Jour", "Nombre d'assistants"]],
      body: detailRows,
      startY: lastY + 4,
      theme: "striped",
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 9 },
    });

    // Commentaire
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text("Commentaire analytique mensuel :", 14, commY);
    doc.setFontSize(9);
    const splitComment = doc.splitTextToSize(reportData.commentaire, 180);
    doc.text(splitComment, 14, commY + 6);

    doc.save(`releve_mensuel_${reportData.monthName.toLowerCase()}_${reportData.year}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de période & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Module de relevé mensuel
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Production des relevés mensuels officiels, synthèse et analyses
            </p>
          </div>

          {/* Formulaire sélection */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-semibold outline-none"
            >
              {MOIS_FRANCAIS.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-semibold outline-none"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchReport(selectedYear, selectedMonth)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Générer</span>
            </button>
          </div>
        </div>

        {/* Boutons d'export et d'impression */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Télécharger en PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exporter en Excel</span>
          </button>
        </div>
      </div>

      {/* Contenu du relevé imprimable */}
      {reportData && (
        <div className="space-y-6 print-container">
          {/* Titre officiel du document pour impression */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-widest font-black text-indigo-600 dark:text-indigo-400">
                  RELEVÉ MENSUEL OFFICIEL
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Mois de {reportData.monthName} {reportData.year}
                </h2>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p>Édition : {new Date().toLocaleDateString("fr-FR")}</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {reportData.totalJours} journées enregistrées
                </p>
              </div>
            </div>

            {/* C. SYNTHÈSE MENSUELLE (INDICATEURS | DIMANCHE | JEUDI | TOTAL) */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                C. Synthèse mensuelle
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">
                        INDICATEURS
                      </th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
                        DIMANCHE
                      </th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
                        JEUDI
                      </th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-black bg-slate-200/50 dark:bg-slate-700/50">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 font-medium">
                        Nombre de jours
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                        {reportData.totalDimanches}
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                        {reportData.totalJeudis}
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                        {reportData.totalJours}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 font-medium">
                        Total assistants
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                        {formatNombreFR(reportData.totalDimancheAssistants)}
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                        {formatNombreFR(reportData.totalJeudiAssistants)}
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                        {formatNombreFR(reportData.totalAssistants)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold">
                      <td className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">
                        Moyenne par jour
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400">
                        {formatNombreFR(reportData.moyenneDimanche)}
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-cyan-600 dark:text-cyan-400">
                        {formatNombreFR(reportData.moyenneJeudi)}
                      </td>
                      <td className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white">
                        {formatNombreFR(reportData.moyenneGenerale)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* B. TABLEAU MENSUEL DÉTAILLÉ */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                B. Tableau mensuel détaillé
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th className="py-2.5 px-4 w-12 text-center border border-slate-200 dark:border-slate-700">N°</th>
                      <th className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">Date</th>
                      <th className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">Jour</th>
                      <th className="py-2.5 px-4 text-right border border-slate-200 dark:border-slate-700">
                        Nombre d&apos;assistants
                      </th>
                      <th className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">Observation</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Aucun accueil enregistré pour ce mois.
                        </td>
                      </tr>
                    ) : (
                      reportData.records.map((r, i) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 text-center font-mono text-xs text-slate-400 border border-slate-200 dark:border-slate-700">
                            {i + 1}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {r.formattedDate}
                          </td>
                          <td className="py-2.5 px-4 border border-slate-200 dark:border-slate-700">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                r.dayType === "DIMANCHE"
                                  ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
                                  : "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300"
                              }`}
                            >
                              {r.dayType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-slate-700">
                            {r.assistantCount.toLocaleString("fr-FR")}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {r.observation || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* D. COMMENTAIRE MENSUEL AUTOMATIQUE */}
            <AutoCommentaryCard
              commentary={reportData.commentaire}
              title={`D. Commentaire analytique - ${reportData.monthName} ${reportData.year}`}
              subtitle="Analyse mensuelle automatique, comparaisons et recommandations"
            />
          </div>
        </div>
      )}
    </div>
  );
}
