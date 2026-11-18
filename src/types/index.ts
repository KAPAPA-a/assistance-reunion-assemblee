export type DayType = "DIMANCHE" | "JEUDI";

export interface AttendanceRecord {
  id: string;
  date: Date;
  dayType: DayType;
  assistantCount: number;
  observation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceFormData {
  id?: string;
  date: string; // YYYY-MM-DD
  dayType?: DayType;
  assistantCount: number;
  observation?: string;
}

export interface StatsOverview {
  totalDimanches: number;
  totalJeudis: number;
  totalJours: number;
  totalAssistantsDimanche: number;
  totalAssistantsJeudi: number;
  totalGeneralAssistants: number;
  moyenneDimanche: number;
  moyenneJeudi: number;
  moyenneGenerale: number;
  medianeAssistants?: number;
  pireJournee?: {
    date: string;
    dayType: DayType;
    count: number;
  } | null;
  meilleureJournee?: {
    date: string;
    dayType: DayType;
    count: number;
  } | null;
  repartitionTranches?: {
    tranche: string;
    count: number;
    pourcentage: number;
  }[];
}

export interface IndicatorRow {
  indicateur: string;
  dimanche: number | string;
  jeudi: number | string;
  total: number | string;
}

export interface MonthlyDetailedItem {
  id: string;
  date: string;
  formattedDate: string;
  dayType: DayType;
  assistantCount: number;
  observation?: string | null;
}

export interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  records: MonthlyDetailedItem[];
  indicators: IndicatorRow[];
  totalJours: number;
  totalAssistants: number;
  moyenneGenerale: number;
  totalDimanches: number;
  totalJeudis: number;
  totalDimancheAssistants: number;
  totalJeudiAssistants: number;
  moyenneDimanche: number;
  moyenneJeudi: number;
  meilleureJournee?: { date: string; dayType: DayType; count: number } | null;
  pireJournee?: { date: string; dayType: DayType; count: number } | null;
  commentaire: string;
}

export interface MonthlyComparisonItem {
  month: number;
  year: number;
  monthName: string;
  totalJours: number;
  totalDimanches: number;
  totalJeudis: number;
  totalAssistants: number;
  moyenneJournaliere: number;
}

export interface AnnualReportData {
  year: number;
  totalDimanches: number;
  totalJeudis: number;
  totalJeudisAssistants: number;
  totalDimanchesAssistants: number;
  totalGeneralJours: number;
  totalGeneralAssistants: number;
  moyenneAnnuelle: number;
  moyenneDimanche: number;
  moyenneJeudi: number;
  meilleurMois?: { monthName: string; moyenne: number; total: number } | null;
  faibleMois?: { monthName: string; moyenne: number; total: number } | null;
  monthlyBreakdown: {
    month: number;
    monthName: string;
    dimanches: number;
    jeudis: number;
    totalJours: number;
    assistants: number;
    moyenne: number;
  }[];
  commentaire: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
