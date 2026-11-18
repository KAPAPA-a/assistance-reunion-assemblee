import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DayType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MOIS_FRANCAIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

/**
 * Détermine si une date correspond à un Dimanche (0) ou un Jeudi (4).
 * Renvoie 'DIMANCHE', 'JEUDI', ou null si un autre jour.
 */
export function getValidDayType(dateStrOrObj: string | Date): DayType | null {
  const date = typeof dateStrOrObj === "string" ? parseLocalDate(dateStrOrObj) : dateStrOrObj;
  const day = date.getDay(); // 0 = Dimanche, 4 = Jeudi
  if (day === 0) return "DIMANCHE";
  if (day === 4) return "JEUDI";
  return null;
}

/**
 * Parse une date YYYY-MM-DD en Date locale à minuit pour éviter les décalages de fuseau horaire
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formate une date en JJ/MM/AAAA
 * Utilise les composantes locales de la date pour éviter tout décalage UTC.
 * Supporte les objets Date, les chaînes ISO et les chaînes YYYY-MM-DD.
 */
export function formatDateFR(date: Date | string): string {
  let d: Date;
  if (typeof date === "string") {
    // Si format YYYY-MM-DD, parser en heure locale pour éviter le décalage UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      d = parseLocalDate(date);
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date au format YYYY-MM-DD pour input type="date"
 * Utilise les composantes locales de la date pour éviter tout décalage UTC.
 */
export function formatDateInput(date: Date | string): string {
  let d: Date;
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      d = parseLocalDate(date);
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Formate un nombre décimal en format français avec virgule (ex: 38,89)
 */
export function formatNombreFR(num: number, decimales: number = 2): string {
  if (isNaN(num) || !isFinite(num)) return "0";
  // Si c'est un entier ou décimale demandée
  if (Number.isInteger(num)) {
    return num.toLocaleString("fr-FR");
  }
  return num.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
}

/**
 * Division sécurisée évitant la division par zéro
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0 || isNaN(denominator)) {
    return 0;
  }
  const result = numerator / denominator;
  return isNaN(result) || !isFinite(result) ? 0 : Number(result.toFixed(2));
}

/**
 * Calcule le taux d'évolution en % entre une valeur initiale et finale
 */
export function calculateEvolution(initial: number, final: number): {
  taux: number;
  ecart: number;
  sens: "hausse" | "baisse" | "stable";
} {
  const ecart = Number((final - initial).toFixed(2));
  if (initial === 0) {
    if (final === 0) return { taux: 0, ecart: 0, sens: "stable" };
    return { taux: 100, ecart, sens: "hausse" };
  }
  const taux = Number((((final - initial) / initial) * 100).toFixed(2));
  let sens: "hausse" | "baisse" | "stable" = "stable";
  if (taux > 0) sens = "hausse";
  else if (taux < 0) sens = "baisse";
  return { taux, ecart, sens };
}
