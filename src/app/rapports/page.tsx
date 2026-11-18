"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileDown,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { MOIS_FRANCAIS, formatNombreFR, formatDateFR } from "@/lib/utils";
import { SummaryTable } from "@/components/dashboard/SummaryTable";
import { AutoCommentaryCard } from "@/components/dashboard/AutoCommentaryCard";
import type { StatsOverview, AttendanceRecord } from "@/types";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RapportsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Types de rapports disponibles
  const reportTypes = [
    { id: "mensuel", label: "Rapport Mensuel" },
    { id: "annuel", label: "Rapport Annuel" },
    { id: "journalier", label: "Rapport Journalier" },
    { id: "personnalise", label: "Rapport Personnalisé" },
  ];

  const [activeReportType, setActiveReportType] = useState<string>("mensuel");

  // Filtres
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);

  // Données du rapport
  const [reportTitle, setReportTitle] = useState("");
  const [reportPeriod, setReportPeriod] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [commentary, setCommentary] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [loading, setLoading] = useState(false);

  // Charger le rapport en fonction du type sélectionné
  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeReportType === "mensuel") {
        setReportTitle(`Rapport Mensuel d'Activité - ${MOIS_FRANCAIS[selectedMonth - 1]} ${selectedYear}`);
        setReportPeriod(`Du 01/${String(selectedMonth).padStart(2, "0")}/${selectedYear} au dernier jour du mois`);

        const res = await fetch(`/api/stats?type=monthly&year=${selectedYear}&month=${selectedMonth}`);
        const json = await res.json();
        if (json.success && json.data) {
          const m = json.data;
          setStats({
            totalDimanches: m.totalDimanches,
            totalJeudis: m.totalJeudis,
            totalJours: m.totalJours,
            totalAssistantsDimanche: m.totalDimancheAssistants,
            totalAssistantsJeudi: m.totalJeudiAssistants,
            totalGeneralAssistants: m.totalAssistants,
            moyenneDimanche: m.moyenneDimanche,
            moyenneJeudi: m.moyenneJeudi,
            moyenneGenerale: m.moyenneGenerale,
            meilleureJournee: m.meilleureJournee,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setRecords(m.records.map((r: any) => ({
            id: r.id,
            date: new Date(r.date),
            dayType: r.dayType,
            assistantCount: r.assistantCount,
            observation: r.observation,
            createdAt: new Date(),
            updatedAt: new Date(),
          })));
          setCommentary(m.commentaire);
          setConclusion(
            `Le bilan de ${m.monthName} ${selectedYear} fait ressortir un total de ${formatNombreFR(m.totalAssistants)} assistants sur ${m.totalJours} journées, avec une moyenne générale de ${formatNombreFR(m.moyenneGenerale)} assistants par accueil. Les recommandations formulées visent à consolider la régularité des présences.`
          );
        }
      } else if (activeReportType === "annuel") {
        setReportTitle(`Rapport Annuel Consolidé - Exercice ${selectedYear}`);
        setReportPeriod(`Année civile ${selectedYear} (1er janvier au 31 décembre)`);

        const res = await fetch(`/api/stats?type=annual&year=${selectedYear}`);
        const json = await res.json();
        if (json.success && json.data) {
          const a = json.data;
          setStats({
            totalDimanches: a.totalDimanches,
            totalJeudis: a.totalJeudis,
            totalJours: a.totalGeneralJours,
            totalAssistantsDimanche: a.totalDimanchesAssistants,
            totalAssistantsJeudi: a.totalJeudisAssistants,
            totalGeneralAssistants: a.totalGeneralAssistants,
            moyenneDimanche: a.moyenneDimanche,
            moyenneJeudi: a.moyenneJeudi,
            moyenneGenerale: a.moyenneAnnuelle,
            meilleureJournee: a.meilleurMois ? { date: a.meilleurMois.monthName, dayType: "DIMANCHE", count: a.meilleurMois.total } : null,
          });

          // Récupérer la liste des enregistrements de l'année
          const recRes = await fetch(`/api/attendances?year=${selectedYear}&pageSize=200`);
          const recJson = await recRes.json();
          if (recJson.success) setRecords(recJson.records);

          setCommentary(a.commentaire);
          setConclusion(
            `L'exercice annuel ${selectedYear} s'achève avec ${a.totalGeneralJours} accueils réalisés et un flux cumulé de ${formatNombreFR(a.totalGeneralAssistants)} assistants (moyenne : ${formatNombreFR(a.moyenneAnnuelle)} ass./jour). Ce document constitue le relevé certifié pour l'archivage annuel.`
          );
        }
      } else if (activeReportType === "personnalise") {
        setReportTitle(`Rapport Personnalisé d'Accueil`);
        setReportPeriod(`Période du ${formatDateFR(startDate)} au ${formatDateFR(endDate)}`);

        // Filtrage côté serveur via paramètres startDate / endDate
        const recRes = await fetch(`/api/attendances?startDate=${startDate}&endDate=${endDate}&pageSize=10000&sortOrder=asc`);
        const recJson = await recRes.json();
        if (recJson.success && recJson.records) {
          const filtered: AttendanceRecord[] = recJson.records.map((r: AttendanceRecord) => ({
            ...r,
            date: new Date(r.date),
            createdAt: new Date((r as AttendanceRecord & { createdAt: string }).createdAt),
            updatedAt: new Date((r as AttendanceRecord & { updatedAt: string }).updatedAt),
          }));
          setRecords(filtered);

          let sunCount = 0;
          let thuCount = 0;
          let sunTotal = 0;
          let thuTotal = 0;
          filtered.forEach((r: AttendanceRecord) => {
            if (r.dayType === "DIMANCHE") {
              sunCount += 1;
              sunTotal += r.assistantCount;
            } else {
              thuCount += 1;
              thuTotal += r.assistantCount;
            }
          });

          const totalDays = sunCount + thuCount;
          const totalAss = sunTotal + thuTotal;
          const avgSun = sunCount > 0 ? Number((sunTotal / sunCount).toFixed(2)) : 0;
          const avgThu = thuCount > 0 ? Number((thuTotal / thuCount).toFixed(2)) : 0;
          const avgGen = totalDays > 0 ? Number((totalAss / totalDays).toFixed(2)) : 0;

          const statsObj: StatsOverview = {
            totalDimanches: sunCount,
            totalJeudis: thuCount,
            totalJours: totalDays,
            totalAssistantsDimanche: sunTotal,
            totalAssistantsJeudi: thuTotal,
            totalGeneralAssistants: totalAss,
            moyenneDimanche: avgSun,
            moyenneJeudi: avgThu,
            moyenneGenerale: avgGen,
            meilleureJournee: null,
          };
          setStats(statsObj);
          setCommentary(
            `Durant la période personnalisée du ${formatDateFR(startDate)} au ${formatDateFR(endDate)}, ${totalDays} accueils ont été comptabilisés, réunissant ${formatNombreFR(totalAss)} assistants, soit une moyenne de ${formatNombreFR(avgGen)} assistants par jour.`
          );
          setConclusion(`Rapport établi pour la période sélectionnée, conforme aux registres.`);
        }
      } else if (activeReportType === "journalier") {
        setReportTitle(`Rapport Journalier d'Accueil`);
        setReportPeriod(selectedDate ? `Journée du ${formatDateFR(selectedDate)}` : "Date non définie");

        if (!selectedDate) {
          setRecords([]);
          setStats(null);
          setCommentary("Veuillez sélectionner une date pour afficher le rapport journalier.");
          setConclusion("");
          return;
        }

        // Filtrage côté serveur : on cible l'année et le mois exacts pour limiter les résultats
        const [selYear, selMonth] = selectedDate.split("-").map(Number);
        const recRes = await fetch(`/api/attendances?year=${selYear}&month=${selMonth}&pageSize=100`);
        const recJson = await recRes.json();
        if (recJson.success && recJson.records) {
          // Comparaison robuste en composantes locales (évite le décalage UTC)
          const match = recJson.records.find((r: AttendanceRecord) => {
            const d = new Date(r.date);
            const rDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return rDate === selectedDate;
          });

          if (match) {
            setRecords([match]);
            const statsObj: StatsOverview = {
              totalDimanches: match.dayType === "DIMANCHE" ? 1 : 0,
              totalJeudis: match.dayType === "JEUDI" ? 1 : 0,
              totalJours: 1,
              totalAssistantsDimanche: match.dayType === "DIMANCHE" ? match.assistantCount : 0,
              totalAssistantsJeudi: match.dayType === "JEUDI" ? match.assistantCount : 0,
              totalGeneralAssistants: match.assistantCount,
              moyenneDimanche: match.dayType === "DIMANCHE" ? match.assistantCount : 0,
              moyenneJeudi: match.dayType === "JEUDI" ? match.assistantCount : 0,
              moyenneGenerale: match.assistantCount,
              meilleureJournee: { date: formatDateFR(match.date), dayType: match.dayType, count: match.assistantCount },
            };
            setStats(statsObj);
            setCommentary(
              `La journée d'accueil du ${formatDateFR(match.date)} (${match.dayType}) a réuni un effectif de ${match.assistantCount} assistants. ${match.observation ? `Observation notée : « ${match.observation} ».` : ""}`
            );
            setConclusion(`Fiche journalière certifiée conforme.`);
          } else {
            setRecords([]);
            setStats(null);
            setCommentary("Aucun accueil trouvé pour la date sélectionnée.");
            setConclusion("");
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReportType, selectedYear, selectedMonth, selectedDate, startDate, endDate]);

  // Export Excel
  const handleExportExcel = () => {
    if (!stats) return;

    const summaryData = [
      {
        Indicateur: "Nombre de jours",
        Dimanche: stats.totalDimanches,
        Jeudi: stats.totalJeudis,
        Total: stats.totalJours,
      },
      {
        Indicateur: "Total assistants",
        Dimanche: stats.totalAssistantsDimanche,
        Jeudi: stats.totalAssistantsJeudi,
        Total: stats.totalGeneralAssistants,
      },
      {
        Indicateur: "Moyenne par jour",
        Dimanche: stats.moyenneDimanche,
        Jeudi: stats.moyenneJeudi,
        Total: stats.moyenneGenerale,
      },
    ];

    const detailData = records.map((r, i) => ({
      "N°": i + 1,
      Date: formatDateFR(r.date),
      Jour: r.dayType,
      Assistants: r.assistantCount,
      Observation: r.observation || "-",
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDetail = XLSX.utils.json_to_sheet(detailData);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Synthèse");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Détail");

    XLSX.writeFile(wb, `rapport_${activeReportType}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export CSV avec séparateur point-virgule et BOM UTF-8 pour Excel français
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const detailData = records.map((r, i) => ({
      "N°": i + 1,
      Date: formatDateFR(r.date),
      Jour: r.dayType,
      "Nombre d'assistants": r.assistantCount,
      Observation: r.observation || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(detailData);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_${activeReportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!stats) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(reportTitle, 14, 18);

    doc.setFontSize(10);
    doc.text(`Période : ${reportPeriod}`, 14, 25);
    doc.text(`Document officiel édité le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

    // Synthèse
    const summaryRows = [
      ["Nombre de jours", String(stats.totalDimanches), String(stats.totalJeudis), String(stats.totalJours)],
      ["Total des assistants", String(stats.totalAssistantsDimanche), String(stats.totalAssistantsJeudi), String(stats.totalGeneralAssistants)],
      ["Moyenne par jour", formatNombreFR(stats.moyenneDimanche), formatNombreFR(stats.moyenneJeudi), formatNombreFR(stats.moyenneGenerale)],
    ];

    autoTable(doc, {
      head: [["INDICATEURS", "DIMANCHE", "JEUDI", "TOTAL"]],
      body: summaryRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Tableau détaillé (si <= 40 enregistrements dans le pdf)
    if (records.length > 0 && records.length <= 60) {
      doc.setFontSize(11);
      doc.text("Tableau détaillé des séances", 14, currentY);

      const recRows = records.map((r, idx) => [
        String(idx + 1),
        formatDateFR(r.date),
        r.dayType,
        String(r.assistantCount),
        r.observation || "-",
      ]);

      autoTable(doc, {
        head: [["N°", "Date", "Jour", "Assistants", "Observation"]],
        body: recRows,
        startY: currentY + 4,
        theme: "striped",
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 8.5 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Commentaire
    doc.setFontSize(11);
    doc.text("Commentaire analytique automatique :", 14, currentY);
    doc.setFontSize(9);
    const splitComment = doc.splitTextToSize(commentary, 180);
    doc.text(splitComment, 14, currentY + 6);
    currentY += splitComment.length * 5 + 10;

    // Conclusion
    if (conclusion) {
      doc.setFontSize(11);
      doc.text("Conclusion générale :", 14, currentY);
      doc.setFontSize(9);
      const splitConclusion = doc.splitTextToSize(conclusion, 180);
      doc.text(splitConclusion, 14, currentY + 6);
    }

    doc.save(`rapport_${activeReportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Barre de sélection du type de rapport et options */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Espace de production des rapports
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Rapports normalisés, complets et prêts à être imprimés ou archivés
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 hover:bg-sky-100 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Onglets de type de rapport */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {reportTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveReportType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeReportType === t.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtres contextuels selon le type */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Paramètres du rapport :</span>
          </div>

          {activeReportType === "mensuel" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
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
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </>
          )}

          {activeReportType === "annuel" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            >
              {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  Exercice {yr}
                </option>
              ))}
            </select>
          )}

          {activeReportType === "journalier" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            />
          )}

          {activeReportType === "personnalise" && (
            <div className="flex items-center gap-2">
              <span>Du :</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span>Au :</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT OFFICIEL DU RAPPORT (7 ÉLÉMENTS IMPOSÉS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8 print-container">
        {/* 1. NOM DU RAPPORT & 2. PÉRIODE CONCERNÉE */}
        <div className="border-b-2 border-indigo-600 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest font-black text-indigo-600 dark:text-indigo-400">
                RAPPORT OFFICIEL DE GESTION DES ACCUEILS
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {reportTitle}
              </h2>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                Période concernée : <span className="text-indigo-600 dark:text-indigo-400">{reportPeriod}</span>
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 font-medium">
              <p>Édition certifiée</p>
              <p>{new Date().toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        </div>

        {/* 4. LE TABLEAU RÉCAPITULATIF & 5. LES STATISTIQUES */}
        {stats && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
              Tableau récapitulatif & Statistiques
            </h3>
            <SummaryTable stats={stats} title="Synthèse des indicateurs" subtitle="" />
          </div>
        )}

        {/* 3. LE TABLEAU DÉTAILLÉ */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Tableau détaillé des séances d&apos;accueil ({records.length} séance{records.length > 1 ? "s" : ""})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  <th className="py-2.5 px-3 w-10 text-center border border-slate-200 dark:border-slate-700">N°</th>
                  <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-700">Date</th>
                  <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-700">Jour</th>
                  <th className="py-2.5 px-3 text-right border border-slate-200 dark:border-slate-700">Nombre d&apos;assistants</th>
                  <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-700">Observation</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Aucune donnée d&apos;accueil pour cette sélection.
                    </td>
                  </tr>
                ) : (
                  records.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center font-mono text-xs text-slate-400 border border-slate-200 dark:border-slate-700">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {formatDateFR(r.date)}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 dark:border-slate-700">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            r.dayType === "DIMANCHE"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                              : "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                          }`}
                        >
                          {r.dayType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-slate-700">
                        {r.assistantCount.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {r.observation || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. LE COMMENTAIRE AUTOMATIQUE */}
        <div>
          <AutoCommentaryCard
            commentary={commentary}
            title="Commentaire analytique automatique"
            subtitle="Analyse générée d'après les chiffres effectifs de la période"
          />
        </div>

        {/* 7. LA CONCLUSION */}
        {conclusion && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Conclusion générale
            </h4>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
              {conclusion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
