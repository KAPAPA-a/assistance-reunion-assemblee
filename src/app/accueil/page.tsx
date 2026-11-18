import React from "react";
import Link from "next/link";
import { AttendanceForm } from "@/components/forms/AttendanceForm";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";

export default function NouvelAccueilPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Retour et titre */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Module d&apos;enregistrement des accueils
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Saisissez les informations de la séance d&apos;accueil du dimanche ou du jeudi.
        </p>
      </div>

      {/* Rappel des règles de gestion */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
          <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Règles de gestion obligatoires :</span>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Seuls les <strong>dimanches</strong> et les <strong>jeudis</strong> sont autorisés par le système.</li>
          <li>Une seule journée d&apos;accueil est admise par date (doublons automatiquement refusés).</li>
          <li>Le nombre d&apos;assistants doit être un nombre <strong>entier positif ou zéro</strong>.</li>
        </ul>
      </div>

      {/* Formulaire */}
      <AttendanceForm />
    </div>
  );
}
