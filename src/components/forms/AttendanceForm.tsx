"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Trash2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { getValidDayType, formatDateInput, formatDateFR } from "@/lib/utils";
import type { DayType, AttendanceRecord } from "@/types";

interface AttendanceFormProps {
  initialData?: AttendanceRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AttendanceForm({ initialData, onSuccess, onCancel }: AttendanceFormProps) {
  const router = useRouter();

  const [date, setDate] = useState<string>(
    initialData ? formatDateInput(initialData.date) : ""
  );
  const [dayType, setDayType] = useState<DayType | null>(
    initialData ? initialData.dayType : null
  );
  const [dayWarning, setDayWarning] = useState<string | null>(null);
  const [assistantCount, setAssistantCount] = useState<string>(
    initialData ? String(initialData.assistantCount) : ""
  );
  const [observation, setObservation] = useState<string>(
    initialData?.observation || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Détection automatique du jour dès que la date change
  useEffect(() => {
    if (!date) {
      setDayType(null);
      setDayWarning(null);
      return;
    }

    const detected = getValidDayType(date);
    if (detected) {
      setDayType(detected);
      setDayWarning(null);
    } else {
      setDayType(null);
      // Récupérer le jour pour informer l'utilisateur
      const [year, month, day] = date.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const dayName = d.toLocaleDateString("fr-FR", { weekday: "long" });
      setDayWarning(
        `La date sélectionnée est un ${dayName}. Seuls les dimanches et les jeudis sont autorisés pour l'enregistrement.`
      );
    }
  }, [date]);

  // Réinitialiser le formulaire
  const handleReset = () => {
    if (initialData) {
      setDate(formatDateInput(initialData.date));
      setDayType(initialData.dayType);
      setAssistantCount(String(initialData.assistantCount));
      setObservation(initialData.observation || "");
    } else {
      setDate("");
      setDayType(null);
      setDayWarning(null);
      setAssistantCount("");
      setObservation("");
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Soumission (Création ou Modification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation de la date et du jour
    if (!date) {
      setErrorMessage("Veuillez sélectionner une date d'accueil.");
      return;
    }

    const validDay = getValidDayType(date);
    if (!validDay) {
      setErrorMessage(
        "Jour non autorisé : l'accueil doit impérativement avoir lieu un Dimanche ou un Jeudi."
      );
      return;
    }

    // 2. Validation du nombre d'assistants (entier >= 0)
    if (assistantCount === "" || assistantCount === null) {
      setErrorMessage("Le nombre d'assistants est obligatoire.");
      return;
    }

    const countNum = Number(assistantCount);
    if (isNaN(countNum) || !Number.isInteger(countNum) || countNum < 0) {
      setErrorMessage(
        "Le nombre d'assistants doit être un nombre entier positif ou zéro (décimales et valeurs négatives interdites)."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/attendances", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialData?.id,
          date,
          assistantCount: countNum,
          observation: observation.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Erreur lors de l'enregistrement.");
        setLoading(false);
        return;
      }

      setSuccessMessage(result.message || "Enregistrement réussi avec succès !");
      router.refresh();

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else if (!initialData) {
        // En création directe, réinitialiser après succès
        handleReset();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossible de joindre le serveur. Veuillez vérifier votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!initialData?.id) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/attendances?id=${initialData.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Erreur lors de la suppression.");
        setLoading(false);
        return;
      }

      setShowDeleteConfirm(false);
      setSuccessMessage("La journée d'accueil a été supprimée avec succès.");
      router.refresh();

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur réseau lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {initialData ? "Modifier la journée d'accueil" : "Enregistrer un accueil"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Les accueils sont réservés exclusivement aux dimanches et aux jeudis.
          </p>
        </div>
        {initialData && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            Édition #{initialData.id.slice(-6)}
          </span>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Date d'accueil */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Date de l&apos;accueil <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
              required
            />
          </div>

          {/* Détection du jour */}
          {dayType && (
            <div className="mt-2.5 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Jour détecté : <strong>{dayType}</strong> (Valide pour enregistrement)
              </span>
            </div>
          )}

          {dayWarning && (
            <div className="mt-2.5 flex items-start gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{dayWarning}</span>
            </div>
          )}
        </div>

        {/* 2. Nombre d'assistants */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nombre d&apos;assistants <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Users className="w-5 h-5" />
            </div>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Ex: 45"
              value={assistantCount}
              onChange={(e) => setAssistantCount(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Nombre entier supérieur ou égal à zéro. Valeurs négatives et décimales interdites.
          </p>
        </div>

        {/* 3. Observation */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Observation <span className="text-slate-400 font-normal">(Facultatif)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <textarea
              rows={3}
              placeholder="Remarque, météo, événement particulier, visite..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
              maxLength={500}
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !dayType}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "En cours..." : initialData ? "Modifier" : "Enregistrer"}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            )}
          </div>

          {initialData && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </form>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Êtes-vous sûr de vouloir supprimer l&apos;accueil du{" "}
              <strong>
                {initialData ? formatDateFR(initialData.date) : ""} ({initialData?.dayType})
              </strong>{" "}
              avec <strong>{initialData?.assistantCount} assistants</strong> ? Cette action est irréversible.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-colors"
              >
                {loading ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
