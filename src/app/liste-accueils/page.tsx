import React from "react";
import Link from "next/link";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import type { AttendanceRecord } from "@/types";

export const dynamic = "force-dynamic";

export default async function ListeAccueilsPage() {
  // Chargement initial limité à 500 enregistrements pour éviter la surcharge mémoire.
  // Le composant AttendanceTable gère sa propre pagination côté client.
  const records = await prisma.attendance.findMany({
    orderBy: { date: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Registre des accueils
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consultation, recherche, filtrage, modification et exportations (Excel & PDF)
          </p>
        </div>

        <Link
          href="/accueil"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouvel accueil</span>
        </Link>
      </div>

      {/* Tableau complet */}
      <AttendanceTable initialRecords={records as AttendanceRecord[]} />
    </div>
  );
}
