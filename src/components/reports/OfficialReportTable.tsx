"use client";

import React, { useState } from "react";
import { Check, X, Pencil } from "lucide-react";

export interface ReportRowItem {
  dimancheId?: string;
  dimancheDate?: string;
  dimancheCount?: number | string;
  jeudiId?: string;
  jeudiDate?: string;
  jeudiCount?: number | string;
}

interface OfficialReportTableProps {
  title: string;
  rows: ReportRowItem[];
  totalDimanche: number;
  totalJeudi: number;
  moyenneDimanche: number;
  moyenneJeudi: number;
  onUpdateAttendance?: (id: string, count: number) => Promise<boolean>;
}

export function OfficialReportTable({
  title,
  rows,
  totalDimanche,
  totalJeudi,
  moyenneDimanche,
  moyenneJeudi,
  onUpdateAttendance,
}: OfficialReportTableProps) {
  // Gestion de l'édition rapide inline d'une cellule
  const [editingCell, setEditingCell] = useState<{ id: string; count: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const formatMoyenne = (val: number) => {
    if (isNaN(val) || val === 0) return "0";
    return val.toLocaleString("fr-FR", {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 1,
      maximumFractionDigits: 2,
    });
  };

  const handleStartEdit = (id?: string, currentCount?: number | string) => {
    if (!id || !onUpdateAttendance) return;
    setEditingCell({
      id,
      count: currentCount !== undefined ? String(currentCount) : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCell || !onUpdateAttendance) return;
    const num = parseInt(editingCell.count, 10);
    if (isNaN(num) || num < 0) {
      alert("Veuillez saisir un nombre valide d'assistants (positif ou nul).");
      return;
    }
    setSaving(true);
    const ok = await onUpdateAttendance(editingCell.id, num);
    setSaving(false);
    if (ok) {
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  return (
    <div className="bg-white text-black p-4 sm:p-8 max-w-3xl mx-auto shadow-md border border-slate-300 rounded-lg print:border-none print:shadow-none print:p-0">
      {/* 1. Tableau Principal */}
      <table className="w-full border-collapse border-2 border-black text-xs sm:text-sm font-sans">
        <thead>
          {/* Ligne 1 : Titre principal */}
          <tr>
            <th
              colSpan={4}
              className="border border-black py-2 px-3 text-center font-bold tracking-wider uppercase text-sm sm:text-base bg-white"
            >
              {title}
            </th>
          </tr>

          {/* Ligne 2 : DIMANCHE / JEUDI */}
          <tr>
            <th
              colSpan={2}
              className="border border-black py-1.5 px-3 text-center font-bold uppercase tracking-wider bg-white w-1/2"
            >
              DIMANCHE
            </th>
            <th
              colSpan={2}
              className="border border-black py-1.5 px-3 text-center font-bold uppercase tracking-wider bg-white w-1/2"
            >
              JEUDI
            </th>
          </tr>

          {/* Ligne 3 : Sous-en-têtes */}
          <tr>
            <th className="border border-black py-1.5 px-2 text-center font-bold uppercase tracking-wide bg-white w-1/4">
              DATE REUNION
            </th>
            <th className="border border-black py-1.5 px-2 text-center font-bold uppercase tracking-wide bg-white w-1/4">
              N<sup>bre</sup> ASSISTANCE
            </th>
            <th className="border border-black py-1.5 px-2 text-center font-bold uppercase tracking-wide bg-white w-1/4">
              DATE REUNION
            </th>
            <th className="border border-black py-1.5 px-2 text-center font-bold uppercase tracking-wide bg-white w-1/4">
              N<sup>bre</sup> ASSISTANCE
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="border border-black py-4 text-center text-slate-500 italic"
              >
                Aucune assistance enregistrée pour cette période.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const isEditingDimanche = editingCell?.id === row.dimancheId;
              const isEditingJeudi = editingCell?.id === row.jeudiId;

              return (
                <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                  {/* Date Dimanche */}
                  <td className="border border-black py-1 px-2 text-center font-mono">
                    {row.dimancheDate || ""}
                  </td>

                  {/* Nombre Dimanche (Cliquable pour modifier) */}
                  <td className="border border-black py-1 px-3 text-right font-mono relative group">
                    {isEditingDimanche ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          autoFocus
                          value={editingCell?.count || ""}
                          onChange={(e) =>
                            setEditingCell({
                              ...editingCell!,
                              count: e.target.value,
                            })
                          }
                          onKeyDown={handleKeyDown}
                          className="w-16 px-1 py-0.5 text-right font-mono border border-blue-500 rounded bg-blue-50 text-black text-xs font-bold"
                          min="0"
                          disabled={saving}
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Valider"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCell(null)}
                          disabled={saving}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEdit(row.dimancheId, row.dimancheCount)}
                        className={`flex items-center justify-end gap-1 ${
                          row.dimancheId && onUpdateAttendance
                            ? "cursor-pointer hover:text-blue-600 transition"
                            : ""
                        }`}
                        title={row.dimancheId ? "Cliquer pour modifier" : ""}
                      >
                        <span>{row.dimancheCount !== undefined ? row.dimancheCount : ""}</span>
                        {row.dimancheId && onUpdateAttendance && (
                          <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition no-print" />
                        )}
                      </div>
                    )}
                  </td>

                  {/* Date Jeudi */}
                  <td className="border border-black py-1 px-2 text-center font-mono">
                    {row.jeudiDate || ""}
                  </td>

                  {/* Nombre Jeudi (Cliquable pour modifier) */}
                  <td className="border border-black py-1 px-3 text-right font-mono relative group">
                    {isEditingJeudi ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          autoFocus
                          value={editingCell?.count || ""}
                          onChange={(e) =>
                            setEditingCell({
                              ...editingCell!,
                              count: e.target.value,
                            })
                          }
                          onKeyDown={handleKeyDown}
                          className="w-16 px-1 py-0.5 text-right font-mono border border-blue-500 rounded bg-blue-50 text-black text-xs font-bold"
                          min="0"
                          disabled={saving}
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Valider"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCell(null)}
                          disabled={saving}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEdit(row.jeudiId, row.jeudiCount)}
                        className={`flex items-center justify-end gap-1 ${
                          row.jeudiId && onUpdateAttendance
                            ? "cursor-pointer hover:text-blue-600 transition"
                            : ""
                        }`}
                        title={row.jeudiId ? "Cliquer pour modifier" : ""}
                      >
                        <span>{row.jeudiCount !== undefined ? row.jeudiCount : ""}</span>
                        {row.jeudiId && onUpdateAttendance && (
                          <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition no-print" />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Espacement entre le tableau et le total */}
      <div className="h-4" />

      {/* 2. Tableau TOTAL */}
      <table className="w-full border-collapse border-2 border-black text-xs sm:text-sm font-bold font-sans">
        <tbody>
          <tr>
            <td className="border border-black py-1.5 px-2 uppercase tracking-wider w-1/4 text-left">
              TOTAL
            </td>
            <td className="border border-black py-1.5 px-3 text-right font-mono w-1/4">
              {totalDimanche}
            </td>
            <td className="border border-black py-1.5 px-2 uppercase tracking-wider w-1/4 text-left">
              TOTAL
            </td>
            <td className="border border-black py-1.5 px-3 text-right font-mono w-1/4">
              {totalJeudi}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Espacement entre le total et la moyenne */}
      <div className="h-4" />

      {/* 3. Tableau MOYENNE */}
      <table className="w-full border-collapse border-2 border-black text-xs sm:text-sm font-bold font-sans">
        <tbody>
          <tr>
            <td className="border border-black py-1.5 px-2 uppercase tracking-wider w-1/4 text-left">
              MOYENNE
            </td>
            <td className="border border-black py-1.5 px-3 text-right font-mono w-1/4">
              {formatMoyenne(moyenneDimanche)}
            </td>
            <td className="border border-black py-1.5 px-2 uppercase tracking-wider w-1/4 text-left">
              MOYENNE
            </td>
            <td className="border border-black py-1.5 px-3 text-right font-mono w-1/4">
              {formatMoyenne(moyenneJeudi)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
