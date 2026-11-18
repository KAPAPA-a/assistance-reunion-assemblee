"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileDown,
  Edit,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload,
} from "lucide-react";
import { formatDateFR, MOIS_FRANCAIS } from "@/lib/utils";
import type { AttendanceRecord, DayType } from "@/types";
import { AttendanceForm } from "@/components/forms/AttendanceForm";
import { ImportModal } from "@/components/modals/ImportModal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AttendanceTableProps {
  initialRecords: AttendanceRecord[];
  onRefresh?: () => void;
}

export function AttendanceTable({ initialRecords, onRefresh }: AttendanceTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDayType, setFilterDayType] = useState<string>("ALL");
  const [filterMonth, setFilterMonth] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");

  const [sortField, setSortField] = useState<"date" | "assistantCount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<AttendanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Rechargement des enregistrements après import ou modification
  const reloadRecords = async () => {
    try {
      const res = await fetch("/api/attendances?pageSize=500");
      const json = await res.json();
      if (json.success && json.records) {
        setRecords(json.records);
      }
    } catch (err) {
      console.error(err);
    }
    if (onRefresh) onRefresh();
  };

  // Synchronisation avec les props
  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  // Liste des années disponibles déduites des données
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    records.forEach((r) => {
      const y = new Date(r.date).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    // Ajouter l'année courante au moins
    yearsSet.add(new Date().getFullYear());
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [records]);

  // Filtrage
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);
      const formattedDate = formatDateFR(r.date);

      // Recherche par date (ex: "01/11" ou "2026") ou observation
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchDate = formattedDate.includes(term);
        const matchObs = r.observation?.toLowerCase().includes(term) ?? false;
        const matchDay = r.dayType.toLowerCase().includes(term);
        if (!matchDate && !matchObs && !matchDay) return false;
      }

      // Filtre Jour
      if (filterDayType !== "ALL" && r.dayType !== filterDayType) {
        return false;
      }

      // Filtre Mois
      if (filterMonth !== "ALL") {
        const monthNum = d.getMonth() + 1;
        if (monthNum !== Number(filterMonth)) return false;
      }

      // Filtre Année
      if (filterYear !== "ALL") {
        const yearNum = d.getFullYear();
        if (yearNum !== Number(filterYear)) return false;
      }

      return true;
    });
  }, [records, searchTerm, filterDayType, filterMonth, filterYear]);

  // Tri
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      if (sortField === "date") {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      } else {
        return sortDirection === "asc"
          ? a.assistantCount - b.assistantCount
          : b.assistantCount - a.assistantCount;
      }
    });
  }, [filteredRecords, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Gestion du tri
  const handleSort = (field: "date" | "assistantCount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!deleteConfirmRecord) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/attendances?id=${deleteConfirmRecord.id}`, {
        method: "DELETE",
      });
      const res = await response.json();
      if (res.success) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteConfirmRecord.id));
        setDeleteConfirmRecord(null);
        if (onRefresh) onRefresh();
      } else {
        alert(res.message || "Erreur de suppression.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Excel
  const exportToExcel = () => {
    const dataToExport = sortedRecords.map((r, idx) => ({
      "N°": idx + 1,
      Date: formatDateFR(r.date),
      Jour: r.dayType,
      "Nombre d'assistants": r.assistantCount,
      Observation: r.observation || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accueils");

    // Ajustement de la largeur des colonnes
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 15 },
      { wch: 22 },
      { wch: 35 },
    ];

    XLSX.writeFile(workbook, `registre_accueils_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = "Registre des Journées d'Accueil (Dimanche & Jeudi)";
    doc.setFontSize(16);
    doc.text(title, 14, 18);

    doc.setFontSize(10);
    doc.text(`Édité le : ${new Date().toLocaleDateString("fr-FR")} - Total : ${sortedRecords.length} enregistrements`, 14, 25);

    const tableRows = sortedRecords.map((r, idx) => [
      String(idx + 1),
      formatDateFR(r.date),
      r.dayType,
      String(r.assistantCount),
      r.observation || "-",
    ]);

    autoTable(doc, {
      head: [["N°", "Date", "Jour", "Assistants", "Observation"]],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }, // Indigo
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 26 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26, halign: "right" },
        4: { cellWidth: "auto" },
      },
    });

    doc.save(`registre_accueils_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Barre d'outils (Filtres, Recherche, Exports) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par date (ex: 01/11), jour ou observation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Boutons d'export et import */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
              title="Importer des données depuis un fichier Excel ou CSV"
            >
              <Upload className="w-4 h-4" />
              <span>Importer Excel/CSV</span>
            </button>

            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
              title="Exporter vers Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={exportToPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-colors"
              title="Exporter en PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filtres de sélection */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres :</span>
          </div>

          {/* Filtre Jour */}
          <select
            value={filterDayType}
            onChange={(e) => {
              setFilterDayType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none"
          >
            <option value="ALL">Tous les jours (Dimanche & Jeudi)</option>
            <option value="DIMANCHE">Dimanche uniquement</option>
            <option value="JEUDI">Jeudi uniquement</option>
          </select>

          {/* Filtre Mois */}
          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none"
          >
            <option value="ALL">Tous les mois</option>
            {MOIS_FRANCAIS.map((m, idx) => (
              <option key={idx} value={String(idx + 1)}>
                {m}
              </option>
            ))}
          </select>

          {/* Filtre Année */}
          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none"
          >
            <option value="ALL">Toutes les années</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                Année {yr}
              </option>
            ))}
          </select>

          {(searchTerm || filterDayType !== "ALL" || filterMonth !== "ALL" || filterYear !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterDayType("ALL");
                setFilterMonth("ALL");
                setFilterYear("ALL");
                setCurrentPage(1);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-auto"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Tableau d'affichage (Desktop & Tablettes) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Vue tableau pour écrans md et + */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">N°</th>
                <th
                  onClick={() => handleSort("date")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortField === "date" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Jour</th>
                <th
                  onClick={() => handleSort("assistantCount")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Nombre d&apos;assistants</span>
                    {sortField === "assistantCount" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Observation</th>
                <th className="py-3.5 px-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Aucun accueil ne correspond aux critères sélectionnés.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, index) => {
                  const absoluteIndex = (currentPage - 1) * pageSize + index + 1;
                  const isHigh = item.assistantCount >= 50;
                  const isMid = item.assistantCount >= 35 && item.assistantCount < 50;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400 font-semibold">
                        {absoluteIndex}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatDateFR(item.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.dayType === "DIMANCHE"
                              ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300"
                              : "bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300"
                          }`}
                        >
                          {item.dayType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white font-mono">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isHigh
                                ? "bg-emerald-500"
                                : isMid
                                ? "bg-indigo-500"
                                : "bg-amber-500"
                            }`}
                            title={isHigh ? "Affluence élevée" : isMid ? "Affluence moyenne" : "Affluence modérée"}
                          />
                          {item.assistantCount.toLocaleString("fr-FR")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {item.observation || <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingRecord(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmRecord(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Vue cartes pour mobiles (< md) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 p-4">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">Aucun accueil ne correspond aux critères.</p>
            </div>
          ) : (
            paginatedRecords.map((item, index) => {
              const absoluteIndex = (currentPage - 1) * pageSize + index + 1;
              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{absoluteIndex}</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatDateFR(item.date)}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.dayType === "DIMANCHE"
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          : "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                      }`}
                    >
                      {item.dayType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                    <span className="text-xs text-slate-500 font-medium">Effectif :</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {item.assistantCount} assistants
                    </span>
                  </div>

                  {item.observation && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-lg">
                      « {item.observation} »
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingRecord(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmRecord(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pied de tableau avec pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Afficher</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>sur {sortedRecords.length} enregistrements</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <AttendanceForm
              initialData={editingRecord}
              onCancel={() => setEditingRecord(null)}
              onSuccess={() => {
                setEditingRecord(null);
                if (onRefresh) onRefresh();
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Voulez-vous supprimer l&apos;accueil du{" "}
              <strong>
                {formatDateFR(deleteConfirmRecord.date)} ({deleteConfirmRecord.dayType})
              </strong>{" "}
              avec <strong>{deleteConfirmRecord.assistantCount} assistants</strong> ?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmRecord(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-colors"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal d'importation Excel / CSV */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={reloadRecords}
      />
    </div>
  );
}
