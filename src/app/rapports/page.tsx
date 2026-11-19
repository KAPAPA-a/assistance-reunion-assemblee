"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  FileDown,
  Printer,
  RefreshCw,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { MOIS_FRANCAIS } from "@/lib/utils";
import {
  OfficialReportTable,
  ReportRowItem,
  ObservationItem,
} from "@/components/reports/OfficialReportTable";
import type { AttendanceRecord } from "@/types";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RapportsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Mode de sélection : Mensuel ou Période personnalisée
  const [filterMode, setFilterMode] = useState<"mensuel" | "personnalise">("mensuel");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Plage de dates personnalisée
  const [startDate, setStartDate] = useState<string>(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(currentYear, currentMonth, 0).toISOString().slice(0, 10)
  );

  // Titre personnalisable du rapport
  const [customTitle, setCustomTitle] = useState<string>("");

  // Commentaire personnalisé (si l'utilisateur souhaite le modifier)
  const [customComment, setCustomComment] = useState<string | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Génération automatique du titre selon la sélection
  const defaultTitle = useMemo(() => {
    if (filterMode === "mensuel") {
      const nomMois = MOIS_FRANCAIS[selectedMonth - 1]?.toUpperCase() || "";
      return `RAPPORT ASSISTANCE AUX REUNIONS ${nomMois} ${selectedYear}`;
    } else {
      const [sy, sm, sd] = startDate.split("-");
      const [ey, em, ed] = endDate.split("-");
      return `RAPPORT ASSISTANCE AUX REUNIONS DU ${sd}/${sm}/${sy} AU ${ed}/${em}/${ey}`;
    }
  }, [filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const activeTitle = customTitle.trim() || defaultTitle;

  // Chargement des données fraîches sans cache
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/attendances?pageSize=200&sortBy=date&sortOrder=asc&_t=${Date.now()}`;
      if (filterMode === "mensuel") {
        url += `&year=${selectedYear}&month=${selectedMonth}`;
      } else {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.records)) {
        setRecords(json.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Erreur chargement rapport:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedMonth, selectedYear, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Réactualisation automatique quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadData();
    });
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadData]);

  // Modification directe d'un jour (Dimanche ou Jeudi) depuis le tableau
  const handleUpdateAttendance = async (id: string, newCount: number): Promise<boolean> => {
    const target = records.find((r) => r.id === id);
    if (!target) return false;

    // Mise à jour optimiste immédiate dans l'interface
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, assistantCount: newCount } : r))
    );

    try {
      const d = new Date(target.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const res = await fetch("/api/attendances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          date: dateStr,
          assistantCount: newCount,
          observation: target.observation,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setUpdateSuccess("Modification enregistrée et répercutée dans le rapport !");
        setTimeout(() => setUpdateSuccess(null), 3000);
        return true;
      } else {
        alert(json.message || "Erreur lors de la mise à jour");
        loadData();
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la mise à jour");
      loadData();
      return false;
    }
  };

  // Séparation Dimanche vs Jeudi et appariement ligne par ligne
  const {
    pairedRows,
    totalDimanche,
    totalJeudi,
    moyenneDimanche,
    moyenneJeudi,
    observationsList,
    autoCommentary,
  } = useMemo(() => {
    const dimanches = records
      .filter((r) => r.dayType === "DIMANCHE")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const jeudis = records
      .filter((r) => r.dayType === "JEUDI")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const maxRows = Math.max(dimanches.length, jeudis.length);
    const rows: ReportRowItem[] = [];

    let sumDimanche = 0;
    let sumJeudi = 0;

    let peakRecord: { date: string; dayType: string; count: number } | null = null;
    const obsList: ObservationItem[] = [];

    for (let i = 0; i < maxRows; i++) {
      const d = dimanches[i];
      const j = jeudis[i];

      if (d) {
        sumDimanche += d.assistantCount;
        if (!peakRecord || d.assistantCount > peakRecord.count) {
          peakRecord = { date: formatD(d.date), dayType: "Dimanche", count: d.assistantCount };
        }
        if (d.observation && d.observation.trim()) {
          obsList.push({ date: formatD(d.date), dayType: "Dimanche", text: d.observation.trim() });
        }
      }

      if (j) {
        sumJeudi += j.assistantCount;
        if (!peakRecord || j.assistantCount > peakRecord.count) {
          peakRecord = { date: formatD(j.date), dayType: "Jeudi", count: j.assistantCount };
        }
        if (j.observation && j.observation.trim()) {
          obsList.push({ date: formatD(j.date), dayType: "Jeudi", text: j.observation.trim() });
        }
      }

      function formatD(dateVal: Date | string) {
        const dt = new Date(dateVal);
        const day = String(dt.getDate()).padStart(2, "0");
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const year = dt.getFullYear();
        return `${day}/${month}/${year}`;
      }

      rows.push({
        dimancheId: d ? d.id : undefined,
        dimancheDate: d ? formatD(d.date) : "",
        dimancheCount: d ? d.assistantCount : "",
        jeudiId: j ? j.id : undefined,
        jeudiDate: j ? formatD(j.date) : "",
        jeudiCount: j ? j.assistantCount : "",
      });
    }

    const avgDimanche = dimanches.length > 0 ? sumDimanche / dimanches.length : 0;
    const avgJeudi = jeudis.length > 0 ? sumJeudi / jeudis.length : 0;
    const totalGeneral = sumDimanche + sumJeudi;
    const totalJours = dimanches.length + jeudis.length;

    // Construction du commentaire automatique pertinent
    let comment = "";
    if (totalJours === 0) {
      comment = "Aucune réunion d'accueil n'a été enregistrée pour cette période.";
    } else {
      const p1 = `Pour cette période, un total général de ${totalGeneral.toLocaleString("fr-FR")} assistants a été enregistré sur ${totalJours} réunions (${dimanches.length} dimanches et ${jeudis.length} jeudis).`;

      let pComp = "";
      if (dimanches.length > 0 && jeudis.length > 0) {
        const fmtAvgDim = avgDimanche.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
        const fmtAvgJeu = avgJeudi.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

        if (avgDimanche > avgJeudi) {
          const ecart = (avgDimanche - avgJeudi).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
          pComp = `La moyenne de présence du dimanche (${fmtAvgDim}) est supérieure à celle du jeudi (${fmtAvgJeu}), soit un écart moyen de +${ecart} assistants par réunion dominicale.`;
        } else if (avgJeudi > avgDimanche) {
          const ecart = (avgJeudi - avgDimanche).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
          pComp = `La moyenne de présence du jeudi (${fmtAvgJeu}) dépasse celle du dimanche (${fmtAvgDim}), avec une avance moyenne de +${ecart} assistants en semaine.`;
        } else {
          pComp = `L'assistance moyenne est équilibrée entre le dimanche et le jeudi avec exactement ${fmtAvgDim} assistants par réunion.`;
        }
      }

      let pPeak = "";
      if (peakRecord && totalJours > 1) {
        pPeak = `Le pic d'affluence de la période a été atteint le ${peakRecord.date} (${peakRecord.dayType}) avec ${peakRecord.count} assistants.`;
      }

      comment = [p1, pComp, pPeak].filter(Boolean).join(" ");
    }

    return {
      pairedRows: rows,
      totalDimanche: sumDimanche,
      totalJeudi: sumJeudi,
      moyenneDimanche: avgDimanche,
      moyenneJeudi: avgJeudi,
      observationsList: obsList,
      autoCommentary: comment,
    };
  }, [records]);

  const activeCommentary = customComment !== null ? customComment : autoCommentary;

  const formatMoyenne = (val: number) => {
    if (isNaN(val) || val === 0) return "0";
    return val.toLocaleString("fr-FR", {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 1,
      maximumFractionDigits: 2,
    });
  };

  // Export PDF conforme au modèle avec les commentaires
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const bodyRows = pairedRows.map((r) => [
      r.dimancheDate || "",
      r.dimancheCount !== undefined && r.dimancheCount !== "" ? String(r.dimancheCount) : "",
      r.jeudiDate || "",
      r.jeudiCount !== undefined && r.jeudiCount !== "" ? String(r.jeudiCount) : "",
    ]);

    // 1. Tableau principal
    autoTable(doc, {
      head: [
        [
          {
            content: activeTitle,
            colSpan: 4,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 10,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
        ],
        [
          {
            content: "DIMANCHE",
            colSpan: 2,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 9,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
          {
            content: "JEUDI",
            colSpan: 2,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 9,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
        ],
        [
          {
            content: "DATE REUNION",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 8.5,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
          {
            content: "Nbre ASSISTANCE",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 8.5,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
          {
            content: "DATE REUNION",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 8.5,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
          {
            content: "Nbre ASSISTANCE",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fontSize: 8.5,
              textColor: [0, 0, 0],
              fillColor: [255, 255, 255],
              lineWidth: 0.35,
              lineColor: [0, 0, 0],
            },
          },
        ],
      ],
      body: bodyRows,
      theme: "plain",
      styles: {
        lineWidth: 0.35,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        cellPadding: 2.5,
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 40 },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "center", cellWidth: 40 },
        3: { halign: "right", cellWidth: 40 },
      },
      margin: { left: 25, right: 25, top: 25 },
    });

    // 2. Tableau TOTAL (séparé)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalY = (doc as any).lastAutoTable.finalY + 4;
    autoTable(doc, {
      body: [
        [
          { content: "TOTAL", styles: { fontStyle: "bold", halign: "left" } },
          { content: String(totalDimanche), styles: { fontStyle: "bold", halign: "right" } },
          { content: "TOTAL", styles: { fontStyle: "bold", halign: "left" } },
          { content: String(totalJeudi), styles: { fontStyle: "bold", halign: "right" } },
        ],
      ],
      theme: "plain",
      styles: {
        lineWidth: 0.35,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        cellPadding: 2.5,
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
      },
      startY: finalY,
      margin: { left: 25, right: 25 },
    });

    // 3. Tableau MOYENNE (séparé)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finalY = (doc as any).lastAutoTable.finalY + 4;
    autoTable(doc, {
      body: [
        [
          { content: "MOYENNE", styles: { fontStyle: "bold", halign: "left" } },
          { content: formatMoyenne(moyenneDimanche), styles: { fontStyle: "bold", halign: "right" } },
          { content: "MOYENNE", styles: { fontStyle: "bold", halign: "left" } },
          { content: formatMoyenne(moyenneJeudi), styles: { fontStyle: "bold", halign: "right" } },
        ],
      ],
      theme: "plain",
      styles: {
        lineWidth: 0.35,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        cellPadding: 2.5,
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
      },
      startY: finalY,
      margin: { left: 25, right: 25 },
    });

    // 4. Section COMMENTAIRES & OBSERVATIONS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finalY = (doc as any).lastAutoTable.finalY + 6;
    if (finalY > 230) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("COMMENTAIRES & OBSERVATIONS :", 25, finalY);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(25, finalY + 1.5, 185, finalY + 1.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const splitComments = doc.splitTextToSize(activeCommentary, 160);
    doc.text(splitComments, 25, finalY + 6);

    let nextY = finalY + 6 + splitComments.length * 4.5;

    // Observations spécifiques si existantes
    if (observationsList.length > 0) {
      nextY += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Remarques particulières relevées :", 25, nextY);
      nextY += 4;
      doc.setFont("helvetica", "normal");
      observationsList.forEach((obs) => {
        const line = `• ${obs.date} (${obs.dayType}) : ${obs.text}`;
        const splitLine = doc.splitTextToSize(line, 155);
        doc.text(splitLine, 27, nextY);
        nextY += splitLine.length * 4;
      });
    }

    const cleanFilename = activeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_");

    doc.save(`${cleanFilename}.pdf`);
  };

  // Export Excel avec les commentaires
  const handleExportExcel = () => {
    const wsData: (string | number)[][] = [
      [activeTitle, "", "", ""],
      ["DIMANCHE", "", "JEUDI", ""],
      ["DATE REUNION", "Nbre ASSISTANCE", "DATE REUNION", "Nbre ASSISTANCE"],
    ];

    pairedRows.forEach((r) => {
      wsData.push([
        r.dimancheDate || "",
        r.dimancheCount !== undefined ? r.dimancheCount : "",
        r.jeudiDate || "",
        r.jeudiCount !== undefined ? r.jeudiCount : "",
      ]);
    });

    wsData.push(["", "", "", ""]);
    wsData.push(["TOTAL", totalDimanche, "TOTAL", totalJeudi]);
    wsData.push(["", "", "", ""]);
    wsData.push([
      "MOYENNE",
      Number(moyenneDimanche.toFixed(2)),
      "MOYENNE",
      Number(moyenneJeudi.toFixed(2)),
    ]);

    // Commentaires
    wsData.push(["", "", "", ""]);
    wsData.push(["COMMENTAIRES & OBSERVATIONS", "", "", ""]);
    wsData.push([activeCommentary, "", "", ""]);

    if (observationsList.length > 0) {
      wsData.push(["Remarques particulières :", "", "", ""]);
      observationsList.forEach((obs) => {
        wsData.push([`${obs.date} (${obs.dayType}) : ${obs.text}`, "", "", ""]);
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
      { s: { r: wsData.length - (observationsList.length > 0 ? observationsList.length + 3 : 2), c: 0 }, e: { r: wsData.length - (observationsList.length > 0 ? observationsList.length + 3 : 2), c: 3 } },
    ];

    ws["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, ws, "Rapport");

    const cleanFilename = activeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_");

    XLSX.writeFile(wb, `${cleanFilename}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Notification de mise à jour réussie */}
      {updateSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{updateSuccess}</span>
        </div>
      )}

      {/* Barre d'outils et sélecteur de période (Masqué à l'impression) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Rapport Officiel d&apos;Assistance aux Réunions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Présentation normalisée face-à-face (Dimanche &amp; Jeudi) avec commentaires d&apos;analyse
            </p>
          </div>

          {/* Boutons d'action et d'export */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Actualiser</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
              title="Télécharger en PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
              title="Télécharger en Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Sélection de la période */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Période :</span>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              onClick={() => setFilterMode("mensuel")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                filterMode === "mensuel"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Par mois
            </button>
            <button
              onClick={() => setFilterMode("personnalise")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                filterMode === "personnalise"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Personnalisée
            </button>
          </div>

          {filterMode === "mensuel" ? (
            <div className="flex items-center gap-2">
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
                {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Du :</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
              <span>Au :</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>
          )}

          {/* Personnalisation manuelle du titre */}
          <div className="flex items-center gap-2 ml-auto w-full lg:w-auto mt-2 lg:mt-0">
            <span className="text-slate-500">Titre :</span>
            <input
              type="text"
              value={customTitle}
              placeholder={defaultTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="flex-1 lg:w-80 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs placeholder:text-slate-400"
            />
            {customTitle && (
              <button
                onClick={() => setCustomTitle("")}
                className="text-slate-400 hover:text-slate-600 text-xs underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ZONE DU RAPPORT OFFICIEL AVEC SES COMMENTAIRES EN DESSOUS */}
      <div id="official-report" className="py-2">
        {loading && records.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-500 border border-slate-200 rounded-lg max-w-3xl mx-auto shadow-sm">
            Chargement du rapport...
          </div>
        ) : (
          <OfficialReportTable
            title={activeTitle}
            rows={pairedRows}
            totalDimanche={totalDimanche}
            totalJeudi={totalJeudi}
            moyenneDimanche={moyenneDimanche}
            moyenneJeudi={moyenneJeudi}
            commentaire={activeCommentary}
            observationsList={observationsList}
            onUpdateAttendance={handleUpdateAttendance}
            onUpdateCommentaire={(newComment) => setCustomComment(newComment)}
          />
        )}
      </div>
    </div>
  );
}
