"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Database,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  HardDrive,
  Info,
} from "lucide-react";
import { formatDateFR } from "@/lib/utils";

export default function ParametresPage() {
  const restoreInputRef = React.useRef<HTMLInputElement>(null);
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [dbMessage, setDbMessage] = useState<string>("Vérification de la connexion PostgreSQL...");
  const [recordCount, setRecordCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Vérifier la connexion à la base
  const checkDatabase = async () => {
    setDbStatus("checking");
    setDbMessage("Connexion à PostgreSQL en cours...");
    try {
      const res = await fetch("/api/attendances?pageSize=1");
      const json = await res.json();
      if (json.success) {
        setDbStatus("connected");
        setDbMessage("Connecté avec succès au serveur PostgreSQL.");
        setRecordCount(json.pagination?.total || 0);
      } else {
        setDbStatus("error");
        setDbMessage(json.error || json.message || "Échec de connexion à PostgreSQL.");
      }
    } catch {
      setDbStatus("error");
      setDbMessage("Impossible de communiquer avec le serveur Next.js ou la base de données.");
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  // Exporter la sauvegarde complète en JSON
  const handleExportBackup = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/attendances?pageSize=10000");
      const json = await res.json();
      if (json.success) {
        const dataStr = JSON.stringify(json.records, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sauvegarde_postgreSQL_accueils_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        setActionMessage({
          type: "success",
          text: `Sauvegarde exportée avec succès (${json.records.length} enregistrements).`,
        });
      } else {
        setActionMessage({ type: "error", text: "Impossible de créer la sauvegarde." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Erreur réseau lors de l'export de la sauvegarde." });
    } finally {
      setLoading(false);
    }
  };

  // Restaurer depuis un fichier JSON exporté
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Confirmez-vous la restauration des données à partir de « ${file.name} » ? Les doublons éventuels seront mis à jour.`)) {
      if (restoreInputRef.current) restoreInputRef.current.value = "";
      return;
    }

    setLoading(true);
    setActionMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          setActionMessage({
            type: "error",
            text: "Le fichier JSON sélectionné ne contient aucun enregistrement valide.",
          });
          setLoading(false);
          return;
        }

        // Adapter les formats si export brut
        const items = parsed.map((item: { date: string; assistantCount: number; observation?: string }) => ({
          date: typeof item.date === "string" ? item.date.slice(0, 10) : item.date,
          assistantCount: item.assistantCount,
          observation: item.observation,
        }));

        const res = await fetch("/api/attendances/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, overwrite: true }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setActionMessage({
            type: "success",
            text: `Restauration réussie : ${json.inserted} ajouté(s), ${json.updated} mis à jour, ${json.skipped} ignoré(s).`,
          });
          checkDatabase();
        } else {
          setActionMessage({
            type: "error",
            text: json.message || "Erreur lors de la restauration.",
          });
        }
      } catch (err) {
        console.error(err);
        setActionMessage({
          type: "error",
          text: "Format JSON invalide ou illisible.",
        });
      } finally {
        setLoading(false);
        if (restoreInputRef.current) restoreInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // Injecter un jeu d'essai réaliste (Dimanches et Jeudis réels avec effectifs)
  const handleSeedSampleData = async () => {
    if (!confirm("Voulez-vous injecter des données d'exemple réalistes (Dimanches et Jeudis) pour tester l'ensemble des modules ?")) {
      return;
    }

    setLoading(true);
    setActionMessage(null);

    // Échantillon de dimanches et jeudis
    const samples = [
      // Novembre 2026
      { date: "2026-11-01", assistantCount: 45, observation: "Reprise normale, bonne assiduité" },
      { date: "2026-11-05", assistantCount: 30, observation: "Séance du jeudi - affluence stable" },
      { date: "2026-11-08", assistantCount: 50, observation: "Bonne participation dominicale" },
      { date: "2026-11-12", assistantCount: 35, observation: "Présence de nouveaux assistants" },
      { date: "2026-11-15", assistantCount: 52, observation: "Participation soutenue" },
      { date: "2026-11-19", assistantCount: 38, observation: "Réunion ordinaire" },
      { date: "2026-11-22", assistantCount: 48, observation: "Dimanche régulier" },
      { date: "2026-11-26", assistantCount: 40, observation: "Séance du jeudi dynamique" },
      { date: "2026-11-29", assistantCount: 55, observation: "Forte affluence de fin de mois" },
      // Octobre 2026
      { date: "2026-10-01", assistantCount: 32, observation: "Jeudi d'ouverture d'octobre" },
      { date: "2026-10-04", assistantCount: 46, observation: "Accueil dominical" },
      { date: "2026-10-08", assistantCount: 34, observation: "Effectif habituel" },
      { date: "2026-10-11", assistantCount: 49, observation: "Bonne mobilisation" },
      { date: "2026-10-15", assistantCount: 36, observation: "Visite spéciale" },
      { date: "2026-10-18", assistantCount: 48, observation: "Participation stable" },
      { date: "2026-10-22", assistantCount: 35, observation: "Séance en semaine" },
      { date: "2026-10-25", assistantCount: 51, observation: "Dimanche après-midi" },
      { date: "2026-10-29", assistantCount: 38, observation: "Séance du jeudi" },
      // Septembre 2026
      { date: "2026-09-03", assistantCount: 28, observation: "Rentrée" },
      { date: "2026-09-06", assistantCount: 42, observation: "Dimanche de rentrée" },
      { date: "2026-09-10", assistantCount: 30, observation: "Séance normale" },
      { date: "2026-09-13", assistantCount: 44, observation: "Bonne reprise" },
      { date: "2026-09-17", assistantCount: 32, observation: "Jeudi standard" },
      { date: "2026-09-20", assistantCount: 45, observation: "Participation régulière" },
      { date: "2026-09-24", assistantCount: 33, observation: "Assiduité satisfaisante" },
      { date: "2026-09-27", assistantCount: 47, observation: "Fin de mois" },
    ];

    let inserted = 0;
    const failed: string[] = [];
    try {
      for (const item of samples) {
        const res = await fetch("/api/attendances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          inserted++;
        } else {
          failed.push(`${item.date} : ${json.message || "rejetée"}`);
        }
      }

      let msg = `${inserted} journée${inserted > 1 ? "s" : ""} enregistrée${inserted > 1 ? "s" : ""} avec succès.`;
      if (failed.length > 0) {
        msg += ` ${failed.length} rejetée${failed.length > 1 ? "s" : ""} (${failed.join(" | ")}).`;
      }
      setActionMessage({
        type: inserted > 0 ? "success" : "error",
        text: msg,
      });
      checkDatabase();
    } catch {
      setActionMessage({
        type: "error",
        text: "Erreur lors de l'enregistrement des données de démonstration.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Paramètres du système & Base de données
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gestion de l&apos;environnement PostgreSQL, statut des sauvegardes et sécurité
        </p>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 1. Statut PostgreSQL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Base de données principale : PostgreSQL
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ORM : Prisma - Modèle d&apos;entité : Attendance
              </p>
            </div>
          </div>

          <button
            onClick={checkDatabase}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tester la connexion"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              État de la connexion :
            </span>
            <div className="flex items-center gap-2 font-bold">
              {dbStatus === "connected" && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Connecté & Opérationnel
                </span>
              )}
              {dbStatus === "checking" && (
                <span className="text-amber-500">Test en cours...</span>
              )}
              {dbStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Erreur de connexion
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Enregistrements dans la table Attendance :
            </span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-base">
              {recordCount} journée{recordCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Variable DATABASE_URL :</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                postgresql://postgres:••••••••@localhost:5432/gestion_accueil
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sauvegarde et Restauration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Sauvegarde & Archivage des données
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exportez ou restaurez l&apos;intégralité des enregistrements en format JSON
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreFile}
            className="hidden"
          />

          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger la sauvegarde</span>
          </button>

          <button
            onClick={() => restoreInputRef.current?.click()}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Restaurer une sauvegarde (.json)</span>
          </button>

          <button
            onClick={handleSeedSampleData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <FileCode className="w-4 h-4 text-indigo-500" />
            <span>Données de test</span>
          </button>
        </div>
      </div>

      {/* 3. Sécurité et Bonnes pratiques */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Normes de sécurité appliquées</span>
        </div>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
          <li>Les identifiants PostgreSQL sont protégés par variables d&apos;environnement (`.env`).</li>
          <li>Contrôle de validation strict côté client et côté serveur via Zod.</li>
          <li>Intégrité référentielle et contrainte d&apos;unicité de date gérée par Prisma ORM.</li>
          <li>Protection anti-doublon et confirmation obligatoire avant toute suppression.</li>
        </ul>
      </div>
    </div>
  );
}
