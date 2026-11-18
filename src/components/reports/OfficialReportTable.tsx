"use client";

import React from "react";

export interface ReportRowItem {
  dimancheDate?: string;
  dimancheCount?: number | string;
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
}

export function OfficialReportTable({
  title,
  rows,
  totalDimanche,
  totalJeudi,
  moyenneDimanche,
  moyenneJeudi,
}: OfficialReportTableProps) {
  // Formatage des nombres en notation française (avec virgule)
  const formatMoyenne = (val: number) => {
    if (isNaN(val) || val === 0) return "0";
    return val.toLocaleString("fr-FR", {
      minimumFractionDigits: Number.isInteger(val) ? 0 : 1,
      maximumFractionDigits: 2,
    });
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
            rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-black py-1 px-2 text-center font-mono">
                  {row.dimancheDate || ""}
                </td>
                <td className="border border-black py-1 px-3 text-right font-mono">
                  {row.dimancheCount !== undefined ? row.dimancheCount : ""}
                </td>
                <td className="border border-black py-1 px-2 text-center font-mono">
                  {row.jeudiDate || ""}
                </td>
                <td className="border border-black py-1 px-3 text-right font-mono">
                  {row.jeudiCount !== undefined ? row.jeudiCount : ""}
                </td>
              </tr>
            ))
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
