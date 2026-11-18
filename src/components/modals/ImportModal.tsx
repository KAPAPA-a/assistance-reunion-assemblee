"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  HelpCircle,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import { getValidDayType, parseLocalDate, formatDateFR } from "@/lib/utils";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  rawDate: string;
  formattedDate: string;
  dayType: "DIMANCHE" | "JEUDI" | null;
  assistantCount: number;
  observation?: string;
  isValid: boolean;
  error?: string;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Normaliser les formats de date (Excel timestamp, DD/MM/YYYY, YYYY-MM-DD)
  const parseExcelDate = (val: unknown): string => {
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    if (typeof val === "number") {
      // Excel serial date format
      const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    if (typeof val === "string") {
      const trimmed = val.trim();
      // Format JJ/MM/AAAA
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const [d, m, y] = trimmed.split("/").map(Number);
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      // Format AAAA-MM-JJ
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
        return trimmed.slice(0, 10);
      }
    }

    return "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];

        if (rawData.length === 0) {
          setErrorMsg("Le fichier sélectionné est vide.");
          return;
        }

        const rows: ParsedRow[] = rawData.map((row) => {
          // Détection automatique des colonnes
          const dateKey = Object.keys(row).find((k) =>
            /date|séance|seance|journee|journée/i.test(k)
          );
          const countKey = Object.keys(row).find((k) =>
            /assistant|effectif|nombre|présence|presence|total/i.test(k)
          );
          const obsKey = Object.keys(row).find((k) =>
            /obs|remarque|note|commentaire/i.test(k)
          );

          const rawDateVal = dateKey ? row[dateKey] : row[Object.keys(row)[0]];
          const rawCountVal = countKey ? row[countKey] : row[Object.keys(row)[1]];
          const rawObsVal = obsKey ? String(row[obsKey] || "") : "";

          const normalizedDate = parseExcelDate(rawDateVal);
          const countNum = Number(rawCountVal);

          if (!normalizedDate) {
            return {
              rawDate: String(rawDateVal),
              formattedDate: "Inconnue",
              dayType: null,
              assistantCount: isNaN(countNum) ? 0 : countNum,
              observation: rawObsVal,
              isValid: false,
              error: "Date non reconnue",
            };
          }

          const parsedDate = parseLocalDate(normalizedDate);
          const dayType = getValidDayType(parsedDate);

          if (!dayType) {
            return {
              rawDate: normalizedDate,
              formattedDate: formatDateFR(normalizedDate),
              dayType: null,
              assistantCount: isNaN(countNum) ? 0 : countNum,
              observation: rawObsVal,
              isValid: false,
              error: "Ni un dimanche ni un jeudi",
            };
          }

          if (isNaN(countNum) || !Number.isInteger(countNum) || countNum < 0) {
            return {
              rawDate: normalizedDate,
              formattedDate: formatDateFR(normalizedDate),
              dayType,
              assistantCount: isNaN(countNum) ? 0 : countNum,
              observation: rawObsVal,
              isValid: false,
              error: "Nombre d'assistants invalide",
            };
          }

          return {
            rawDate: normalizedDate,
            formattedDate: formatDateFR(normalizedDate),
            dayType,
            assistantCount: countNum,
            observation: rawObsVal,
            isValid: true,
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error(err);
        setErrorMsg("Impossible de lire le fichier. Assurez-vous qu'il s'agit d'un fichier Excel (.xlsx, .xls) ou CSV valide.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      setErrorMsg("Aucune ligne valide à importer.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/attendances/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems.map((r) => ({
            date: r.rawDate,
            assistantCount: r.assistantCount,
            observation: r.observation,
          })),
          overwrite,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setImportResult({
          inserted: json.inserted,
          updated: json.updated,
          skipped: json.skipped,
          errors: json.errors || [],
        });
        onSuccess();
      } else {
        setErrorMsg(json.message || "Erreur lors de l'importation.");
      }
    } catch {
      setErrorMsg("Erreur réseau lors de la transmission des données.");
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Importer des accueils (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chargez un fichier `.xlsx`, `.xls` ou `.csv` pour alimenter le registre
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {importResult ? (
            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-4">
              <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
                <div>
                  <h3 className="font-bold text-base">Importation terminée avec succès !</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">
                    Les données ont été insérées et synchronisées dans PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {importResult.inserted}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Ajouté(s)</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                  <span className="block text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {importResult.updated}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Mis à jour</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="block text-2xl font-black text-slate-500 font-mono">
                    {importResult.skipped}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Ignoré(s)</span>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 space-y-1">
                  <span className="font-bold">Avertissements ({importResult.errors.length}) :</span>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Zone de dépôt / sélection fichier */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {fileName ? fileName : "Cliquez ou glissez votre fichier Excel/CSV ici"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formats acceptés : `.xlsx`, `.xls`, `.csv` — Colonnes suggérées : Date, Nombre d&apos;assistants, Observation
                </p>
              </div>

              {/* Aperçu des données détectées */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Aperçu : {parsedRows.length} ligne(s) détectée(s)
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 font-bold">
                        ✓ {validCount} valide(s)
                      </span>
                      {invalidCount > 0 && (
                        <span className="text-red-500 font-bold">
                          ✕ {invalidCount} invalide(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tableau d'aperçu */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-slate-200 dark:border-slate-700">Date</th>
                          <th className="p-2 border-b border-slate-200 dark:border-slate-700">Jour</th>
                          <th className="p-2 text-right border-b border-slate-200 dark:border-slate-700">Assistants</th>
                          <th className="p-2 border-b border-slate-200 dark:border-slate-700">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.slice(0, 50).map((r, i) => (
                          <tr key={i} className={r.isValid ? "" : "bg-red-50/50 dark:bg-red-950/20"}>
                            <td className="p-2 font-mono">{r.formattedDate}</td>
                            <td className="p-2 font-semibold">
                              {r.dayType ? (
                                <span className={r.dayType === "DIMANCHE" ? "text-indigo-600" : "text-cyan-600"}>
                                  {r.dayType}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-right font-mono font-bold">
                              {r.assistantCount}
                            </td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Prêt
                                </span>
                              ) : (
                                <span className="text-red-500 font-medium inline-flex items-center gap-1" title={r.error}>
                                  <AlertCircle className="w-3.5 h-3.5" /> {r.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedRows.length > 50 && (
                    <p className="text-[11px] text-slate-400 text-center italic">
                      Affichage limité aux 50 premières lignes ({parsedRows.length} au total).
                    </p>
                  )}

                  {/* Option écrasement */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="overwrite-check"
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="overwrite-check" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                      Mettre à jour les accueils existants si la date existe déjà (au lieu de les ignorer)
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de modal */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {importResult ? "Fermer" : "Annuler"}
          </button>

          {!importResult && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={loading || validCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {loading
                  ? "Importation..."
                  : `Importer les ${validCount} ligne(s) valide(s)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
