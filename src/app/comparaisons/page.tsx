"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart2,
  FileSpreadsheet,
  FileDown,
  Printer,
  Sparkles,
} from "lucide-react";
import { MOIS_FRANCAIS, formatNombreFR } from "@/lib/utils";
import type { MonthlyComparisonItem, AnnualReportData } from "@/types";
import {
  genererCommentaireComparatif,
  genererCommentaireInterannuel,
} from "@/services/commentaires.service";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ComparaisonsPage() {
  const currentYear = new Date().getFullYear();

  // Mode de comparaison : "monthly" (2 mois) ou "annual" (2 années)
  const [compareType, setCompareType] = useState<"monthly" | "annual">("monthly");

  // Pour 2 mois
  const [yearA, setYearA] = useState(currentYear);
  const [monthA, setMonthA] = useState(9); // Septembre
  const [yearB, setYearB] = useState(currentYear);
  const [monthB, setMonthB] = useState(11); // Novembre

  // Pour 2 années
  const [annualYearA, setAnnualYearA] = useState(currentYear - 1);
  const [annualYearB, setAnnualYearB] = useState(currentYear);

  const [monthDataA, setMonthDataA] = useState<MonthlyComparisonItem | null>(null);
  const [monthDataB, setMonthDataB] = useState<MonthlyComparisonItem | null>(null);
  const [annualDataA, setAnnualDataA] = useState<AnnualReportData | null>(null);
  const [annualDataB, setAnnualDataB] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les données d'un mois
  const fetchMonthData = async (yr: number, mo: number): Promise<MonthlyComparisonItem> => {
    try {
      const res = await fetch(`/api/stats?type=monthly&year=${yr}&month=${mo}`);
      const json = await res.json();
      if (json.success && json.data) {
        return {
          month: mo,
          year: yr,
          monthName: MOIS_FRANCAIS[mo - 1],
          totalJours: json.data.totalJours,
          totalDimanches: json.data.totalDimanches,
          totalJeudis: json.data.totalJeudis,
          totalAssistants: json.data.totalAssistants,
          moyenneJournaliere: json.data.moyenneGenerale,
        };
      }
    } catch (err) {
      console.error(err);
    }
    return {
      month: mo,
      year: yr,
      monthName: MOIS_FRANCAIS[mo - 1],
      totalJours: 0,
      totalDimanches: 0,
      totalJeudis: 0,
      totalAssistants: 0,
      moyenneJournaliere: 0,
    };
  };

  // Charger les données d'une année
  const fetchAnnualData = async (yr: number): Promise<AnnualReportData | null> => {
    try {
      const res = await fetch(`/api/stats?type=annual&year=${yr}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (compareType === "monthly") {
      Promise.all([fetchMonthData(yearA, monthA), fetchMonthData(yearB, monthB)])
        .then(([resA, resB]) => {
          if (isMounted) {
            setMonthDataA(resA);
            setMonthDataB(resB);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      Promise.all([fetchAnnualData(annualYearA), fetchAnnualData(annualYearB)])
        .then(([resA, resB]) => {
          if (isMounted) {
            setAnnualDataA(resA);
            setAnnualDataB(resB);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [compareType, yearA, monthA, yearB, monthB, annualYearA, annualYearB]);

  // Commentaire comparatif mensuel
  const monthlyCommentary = useMemo(() => {
    if (!monthDataA || !monthDataB) return "";
    return genererCommentaireComparatif(monthDataA, monthDataB);
  }, [monthDataA, monthDataB]);

  // Commentaire comparatif annuel
  const annualCommentary = useMemo(() => {
    if (!annualDataA || !annualDataB) return "";
    return genererCommentaireInterannuel(annualDataA, annualDataB);
  }, [annualDataA, annualDataB]);

  // Écarts mensuels
  const monthlyDiffs = useMemo(() => {
    if (!monthDataA || !monthDataB) return null;
    const diffJours = monthDataB.totalJours - monthDataA.totalJours;
    const diffAssistants = monthDataB.totalAssistants - monthDataA.totalAssistants;
    const diffMoyenne = Number((monthDataB.moyenneJournaliere - monthDataA.moyenneJournaliere).toFixed(2));

    const evolutionMoyennePercent =
      monthDataA.moyenneJournaliere > 0
        ? Number((((monthDataB.moyenneJournaliere - monthDataA.moyenneJournaliere) / monthDataA.moyenneJournaliere) * 100).toFixed(2))
        : monthDataB.moyenneJournaliere > 0
        ? 100
        : 0;

    const evolutionTotalPercent =
      monthDataA.totalAssistants > 0
        ? Number((((monthDataB.totalAssistants - monthDataA.totalAssistants) / monthDataA.totalAssistants) * 100).toFixed(2))
        : monthDataB.totalAssistants > 0
        ? 100
        : 0;

    return { diffJours, diffAssistants, diffMoyenne, evolutionMoyennePercent, evolutionTotalPercent };
  }, [monthDataA, monthDataB]);

  // Écarts annuels
  const annualDiffs = useMemo(() => {
    if (!annualDataA || !annualDataB) return null;
    const diffJours = annualDataB.totalGeneralJours - annualDataA.totalGeneralJours;
    const diffAssistants = annualDataB.totalGeneralAssistants - annualDataA.totalGeneralAssistants;
    const diffMoyenne = Number((annualDataB.moyenneAnnuelle - annualDataA.moyenneAnnuelle).toFixed(2));
    const diffMoySun = Number((annualDataB.moyenneDimanche - annualDataA.moyenneDimanche).toFixed(2));
    const diffMoyThu = Number((annualDataB.moyenneJeudi - annualDataA.moyenneJeudi).toFixed(2));

    const evolutionMoyennePercent =
      annualDataA.moyenneAnnuelle > 0
        ? Number((((annualDataB.moyenneAnnuelle - annualDataA.moyenneAnnuelle) / annualDataA.moyenneAnnuelle) * 100).toFixed(2))
        : annualDataB.moyenneAnnuelle > 0
        ? 100
        : 0;

    const evolutionTotalPercent =
      annualDataA.totalGeneralAssistants > 0
        ? Number((((annualDataB.totalGeneralAssistants - annualDataA.totalGeneralAssistants) / annualDataA.totalGeneralAssistants) * 100).toFixed(2))
        : annualDataB.totalGeneralAssistants > 0
        ? 100
        : 0;

    return {
      diffJours,
      diffAssistants,
      diffMoyenne,
      diffMoySun,
      diffMoyThu,
      evolutionMoyennePercent,
      evolutionTotalPercent,
    };
  }, [annualDataA, annualDataB]);

  // Graphique comparaison mensuelle
  const monthlyChartData = useMemo(() => {
    if (!monthDataA || !monthDataB) return [];
    return [
      {
        nom: `${monthDataA.monthName} ${monthDataA.year}`,
        "Moyenne journalière": monthDataA.moyenneJournaliere,
        "Total assistants": monthDataA.totalAssistants,
      },
      {
        nom: `${monthDataB.monthName} ${monthDataB.year}`,
        "Moyenne journalière": monthDataB.moyenneJournaliere,
        "Total assistants": monthDataB.totalAssistants,
      },
    ];
  }, [monthDataA, monthDataB]);

  // Graphique comparaison annuelle des 12 mois
  const annualChartData = useMemo(() => {
    if (!annualDataA || !annualDataB) return [];
    return MOIS_FRANCAIS.map((m, idx) => {
      const mA = annualDataA.monthlyBreakdown[idx];
      const mB = annualDataB.monthlyBreakdown[idx];
      return {
        mois: m.slice(0, 4) + ".",
        [String(annualYearA)]: mA ? mA.moyenne : 0,
        [String(annualYearB)]: mB ? mB.moyenne : 0,
      };
    });
  }, [annualDataA, annualDataB, annualYearA, annualYearB]);

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (compareType === "monthly" && monthDataA && monthDataB && monthlyDiffs) {
      const data = [
        {
          INDICATEURS: "Total des jours",
          [monthDataA.monthName]: monthDataA.totalJours,
          [monthDataB.monthName]: monthDataB.totalJours,
          Écart: monthlyDiffs.diffJours,
          "Évolution (%)": "-",
        },
        {
          INDICATEURS: "Total assistants",
          [monthDataA.monthName]: monthDataA.totalAssistants,
          [monthDataB.monthName]: monthDataB.totalAssistants,
          Écart: monthlyDiffs.diffAssistants,
          "Évolution (%)": `${monthlyDiffs.evolutionTotalPercent} %`,
        },
        {
          INDICATEURS: "Moyenne journalière",
          [monthDataA.monthName]: monthDataA.moyenneJournaliere,
          [monthDataB.monthName]: monthDataB.moyenneJournaliere,
          Écart: monthlyDiffs.diffMoyenne,
          "Évolution (%)": `${monthlyDiffs.evolutionMoyennePercent} %`,
        },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Comparaison Mensuelle");
      XLSX.writeFile(wb, `comparaison_${monthDataA.monthName}_vs_${monthDataB.monthName}.xlsx`);
    } else if (compareType === "annual" && annualDataA && annualDataB && annualDiffs) {
      const data = [
        {
          INDICATEURS: "Nombre total de séances",
          [`Exercice ${annualYearA}`]: annualDataA.totalGeneralJours,
          [`Exercice ${annualYearB}`]: annualDataB.totalGeneralJours,
          Écart: annualDiffs.diffJours,
          "Évolution (%)": "-",
        },
        {
          INDICATEURS: "Total cumulé assistants",
          [`Exercice ${annualYearA}`]: annualDataA.totalGeneralAssistants,
          [`Exercice ${annualYearB}`]: annualDataB.totalGeneralAssistants,
          Écart: annualDiffs.diffAssistants,
          "Évolution (%)": `${annualDiffs.evolutionTotalPercent} %`,
        },
        {
          INDICATEURS: "Moyenne générale annuelle",
          [`Exercice ${annualYearA}`]: annualDataA.moyenneAnnuelle,
          [`Exercice ${annualYearB}`]: annualDataB.moyenneAnnuelle,
          Écart: annualDiffs.diffMoyenne,
          "Évolution (%)": `${annualDiffs.evolutionMoyennePercent} %`,
        },
        {
          INDICATEURS: "Moyenne du dimanche",
          [`Exercice ${annualYearA}`]: annualDataA.moyenneDimanche,
          [`Exercice ${annualYearB}`]: annualDataB.moyenneDimanche,
          Écart: annualDiffs.diffMoySun,
          "Évolution (%)": "-",
        },
        {
          INDICATEURS: "Moyenne du jeudi",
          [`Exercice ${annualYearA}`]: annualDataA.moyenneJeudi,
          [`Exercice ${annualYearB}`]: annualDataB.moyenneJeudi,
          Écart: annualDiffs.diffMoyThu,
          "Évolution (%)": "-",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Comparaison Annuelle");
      XLSX.writeFile(wb, `comparaison_annuelle_${annualYearA}_vs_${annualYearB}.xlsx`);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    if (compareType === "monthly" && monthDataA && monthDataB && monthlyDiffs) {
      doc.setFontSize(16);
      doc.text(
        `Comparaison : ${monthDataA.monthName} ${monthDataA.year} vs ${monthDataB.monthName} ${monthDataB.year}`,
        14,
        18
      );
      doc.setFontSize(10);
      doc.text(`Document officiel généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 25);

      const rows = [
        ["Total des jours", String(monthDataA.totalJours), String(monthDataB.totalJours), (monthlyDiffs.diffJours > 0 ? "+" : "") + monthlyDiffs.diffJours, "-"],
        ["Total assistants", String(monthDataA.totalAssistants), String(monthDataB.totalAssistants), (monthlyDiffs.diffAssistants > 0 ? "+" : "") + monthlyDiffs.diffAssistants, `${monthlyDiffs.evolutionTotalPercent > 0 ? "+" : ""}${monthlyDiffs.evolutionTotalPercent} %`],
        ["Moyenne journalière", formatNombreFR(monthDataA.moyenneJournaliere), formatNombreFR(monthDataB.moyenneJournaliere), (monthlyDiffs.diffMoyenne > 0 ? "+" : "") + formatNombreFR(monthlyDiffs.diffMoyenne), `${monthlyDiffs.evolutionMoyennePercent > 0 ? "+" : ""}${monthlyDiffs.evolutionMoyennePercent} %`],
      ];

      autoTable(doc, {
        head: [["INDICATEURS", monthDataA.monthName.toUpperCase(), monthDataB.monthName.toUpperCase(), "ÉCART", "ÉVOLUTION %"]],
        body: rows,
        startY: 32,
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229] },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.text("Commentaire comparatif automatique :", 14, finalY);
      doc.setFontSize(9);
      const splitComment = doc.splitTextToSize(monthlyCommentary, 180);
      doc.text(splitComment, 14, finalY + 6);

      doc.save(`comparaison_${monthDataA.monthName}_vs_${monthDataB.monthName}.pdf`);
    } else if (compareType === "annual" && annualDataA && annualDataB && annualDiffs) {
      doc.setFontSize(16);
      doc.text(`Comparaison Interannuelle : Exercice ${annualYearA} vs Exercice ${annualYearB}`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Document officiel généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 25);

      const rows = [
        ["Nombre total de séances", String(annualDataA.totalGeneralJours), String(annualDataB.totalGeneralJours), (annualDiffs.diffJours > 0 ? "+" : "") + annualDiffs.diffJours, "-"],
        ["Total cumulé assistants", formatNombreFR(annualDataA.totalGeneralAssistants), formatNombreFR(annualDataB.totalGeneralAssistants), (annualDiffs.diffAssistants > 0 ? "+" : "") + formatNombreFR(annualDiffs.diffAssistants), `${annualDiffs.evolutionTotalPercent > 0 ? "+" : ""}${annualDiffs.evolutionTotalPercent} %`],
        ["Moyenne générale annuelle", formatNombreFR(annualDataA.moyenneAnnuelle), formatNombreFR(annualDataB.moyenneAnnuelle), (annualDiffs.diffMoyenne > 0 ? "+" : "") + formatNombreFR(annualDiffs.diffMoyenne), `${annualDiffs.evolutionMoyennePercent > 0 ? "+" : ""}${annualDiffs.evolutionMoyennePercent} %`],
        ["Moyenne dominicale", formatNombreFR(annualDataA.moyenneDimanche), formatNombreFR(annualDataB.moyenneDimanche), (annualDiffs.diffMoySun > 0 ? "+" : "") + formatNombreFR(annualDiffs.diffMoySun), "-"],
        ["Moyenne des jeudis", formatNombreFR(annualDataA.moyenneJeudi), formatNombreFR(annualDataB.moyenneJeudi), (annualDiffs.diffMoyThu > 0 ? "+" : "") + formatNombreFR(annualDiffs.diffMoyThu), "-"],
      ];

      autoTable(doc, {
        head: [["INDICATEURS", `EXERCICE ${annualYearA}`, `EXERCICE ${annualYearB}`, "ÉCART", "ÉVOLUTION %"]],
        body: rows,
        startY: 32,
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229] },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.text("Commentaire comparatif interannuel :", 14, finalY);
      doc.setFontSize(9);
      const splitComment = doc.splitTextToSize(annualCommentary, 180);
      doc.text(splitComment, 14, finalY + 6);

      doc.save(`comparaison_annuelle_${annualYearA}_vs_${annualYearB}.pdf`);
    }
  };

  const yearsOptions = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* En-tête avec bascule de mode */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Module d&apos;analyse comparative
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Comparez deux mois ou deux années complètes avec calcul des écarts et commentaires analytiques
            </p>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Onglets de mode */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCompareType("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              compareType === "monthly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Comparaison entre deux mois
          </button>
          <button
            onClick={() => setCompareType("annual")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              compareType === "annual"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Comparaison interannuelle (Année N vs N-1)
          </button>
        </div>

        {/* Sélecteurs des périodes */}
        {compareType === "monthly" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Période A */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Période 1 (Référence initiale)
              </span>
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={monthA}
                  onChange={(e) => setMonthA(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {MOIS_FRANCAIS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={yearA}
                  onChange={(e) => setYearA(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {yearsOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Période B */}
            <div className="p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Période 2 (Période cible à comparer)
              </span>
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={monthB}
                  onChange={(e) => setMonthB(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {MOIS_FRANCAIS.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={yearB}
                  onChange={(e) => setYearB(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {yearsOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Année A */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Année 1 (Exercice de référence)
              </span>
              <div className="mt-2">
                <select
                  value={annualYearA}
                  onChange={(e) => setAnnualYearA(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {yearsOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      Exercice {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Année B */}
            <div className="p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Année 2 (Exercice comparé)
              </span>
              <div className="mt-2">
                <select
                  value={annualYearB}
                  onChange={(e) => setAnnualYearB(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  {yearsOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      Exercice {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RÉSULTATS COMPARATIFS : MODE MENSUEL */}
      {compareType === "monthly" && monthDataA && monthDataB && monthlyDiffs && (
        <div className="space-y-6 print-container">
          {/* Tableau */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Tableau comparatif des résultats
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4 border border-slate-200 dark:border-slate-700">INDICATEURS</th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
                      {monthDataA.monthName.toUpperCase()} {monthDataA.year}
                    </th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
                      {monthDataB.monthName.toUpperCase()} {monthDataB.year}
                    </th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-black">ÉCART</th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-black">ÉVOLUTION %</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 font-semibold">Total des jours</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{monthDataA.totalJours}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{monthDataB.totalJours}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      {monthlyDiffs.diffJours > 0 ? `+${monthlyDiffs.diffJours}` : monthlyDiffs.diffJours}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 font-semibold">Total assistants</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(monthDataA.totalAssistants)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(monthDataB.totalAssistants)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      {monthlyDiffs.diffAssistants > 0 ? `+${formatNombreFR(monthlyDiffs.diffAssistants)}` : formatNombreFR(monthlyDiffs.diffAssistants)}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      <span className={monthlyDiffs.evolutionTotalPercent > 0 ? "text-emerald-600" : monthlyDiffs.evolutionTotalPercent < 0 ? "text-red-600" : "text-slate-500"}>
                        {monthlyDiffs.evolutionTotalPercent > 0 ? "+" : ""}{monthlyDiffs.evolutionTotalPercent} %
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold">
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">Moyenne journalière</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-indigo-600">{formatNombreFR(monthDataA.moyenneJournaliere)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-cyan-600">{formatNombreFR(monthDataB.moyenneJournaliere)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                      {monthlyDiffs.diffMoyenne > 0 ? `+${formatNombreFR(monthlyDiffs.diffMoyenne)}` : formatNombreFR(monthlyDiffs.diffMoyenne)}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                      <span className={`inline-flex items-center gap-1 ${monthlyDiffs.evolutionMoyennePercent > 0 ? "text-emerald-600" : monthlyDiffs.evolutionMoyennePercent < 0 ? "text-red-600" : "text-slate-500"}`}>
                        {monthlyDiffs.evolutionMoyennePercent > 0 ? <TrendingUp className="w-4 h-4" /> : monthlyDiffs.evolutionMoyennePercent < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        {monthlyDiffs.evolutionMoyennePercent > 0 ? "+" : ""}{monthlyDiffs.evolutionMoyennePercent} %
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphique */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm no-print">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Comparaison graphique des moyennes journalières
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                  <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} ass./jour`, ""]}
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderRadius: "0.75rem", color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="Moyenne journalière" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commentaire automatique */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Commentaire comparatif automatique</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line">
              {monthlyCommentary}
            </p>
          </div>
        </div>
      )}

      {/* RÉSULTATS COMPARATIFS : MODE INTERANNUEL */}
      {compareType === "annual" && annualDataA && annualDataB && annualDiffs && (
        <div className="space-y-6 print-container">
          {/* Tableau récapitulatif annuel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Bilan comparatif interannuel ({annualYearA} vs {annualYearB})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4 border border-slate-200 dark:border-slate-700">INDICATEURS</th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
                      EXERCICE {annualYearA}
                    </th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
                      EXERCICE {annualYearB}
                    </th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-black">ÉCART</th>
                    <th className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-black">ÉVOLUTION %</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 font-semibold">Nombre de séances d&apos;accueil</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{annualDataA.totalGeneralJours}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{annualDataB.totalGeneralJours}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      {annualDiffs.diffJours > 0 ? `+${annualDiffs.diffJours}` : annualDiffs.diffJours}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 font-semibold">Total général des assistants</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(annualDataA.totalGeneralAssistants)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(annualDataB.totalGeneralAssistants)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      {annualDiffs.diffAssistants > 0 ? `+${formatNombreFR(annualDiffs.diffAssistants)}` : formatNombreFR(annualDiffs.diffAssistants)}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-bold">
                      <span className={annualDiffs.evolutionTotalPercent > 0 ? "text-emerald-600" : annualDiffs.evolutionTotalPercent < 0 ? "text-red-600" : "text-slate-500"}>
                        {annualDiffs.evolutionTotalPercent > 0 ? "+" : ""}{annualDiffs.evolutionTotalPercent} %
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold">
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">Moyenne annuelle par séance</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-indigo-600">{formatNombreFR(annualDataA.moyenneAnnuelle)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-cyan-600">{formatNombreFR(annualDataB.moyenneAnnuelle)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                      {annualDiffs.diffMoyenne > 0 ? `+${formatNombreFR(annualDiffs.diffMoyenne)}` : formatNombreFR(annualDiffs.diffMoyenne)}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">
                      <span className={`inline-flex items-center gap-1 ${annualDiffs.evolutionMoyennePercent > 0 ? "text-emerald-600" : annualDiffs.evolutionMoyennePercent < 0 ? "text-red-600" : "text-slate-500"}`}>
                        {annualDiffs.evolutionMoyennePercent > 0 ? <TrendingUp className="w-4 h-4" /> : annualDiffs.evolutionMoyennePercent < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        {annualDiffs.evolutionMoyennePercent > 0 ? "+" : ""}{annualDiffs.evolutionMoyennePercent} %
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300">Moyenne du dimanche</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(annualDataA.moyenneDimanche)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(annualDataB.moyenneDimanche)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-semibold">
                      {annualDiffs.diffMoySun > 0 ? `+${formatNombreFR(annualDiffs.diffMoySun)}` : formatNombreFR(annualDiffs.diffMoySun)}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border border-slate-200 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300">Moyenne du jeudi</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(annualDataA.moyenneJeudi)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono">{formatNombreFR(annualDataB.moyenneJeudi)}</td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono font-semibold">
                      {annualDiffs.diffMoyThu > 0 ? `+${formatNombreFR(annualDiffs.diffMoyThu)}` : formatNombreFR(annualDiffs.diffMoyThu)}
                    </td>
                    <td className="py-3 px-4 text-right border border-slate-200 dark:border-slate-700 font-mono text-slate-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphique 12 mois côte à côte */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm no-print">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Moyennes mensuelles comparées ({annualYearA} vs {annualYearB})
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} ass./jour`, ""]}
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", borderRadius: "0.75rem", color: "#fff", fontSize: "12px" }}
                  />
                  <Legend />
                  <Bar dataKey={String(annualYearA)} fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey={String(annualYearB)} fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commentaire automatique interannuel */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Analyse interannuelle certifiée</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line">
              {annualCommentary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
