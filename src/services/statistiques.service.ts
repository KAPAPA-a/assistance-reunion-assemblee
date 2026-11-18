import { prisma } from "@/lib/prisma";
import { safeDivide, MOIS_FRANCAIS, formatDateFR } from "@/lib/utils";
import type {
  StatsOverview,
  IndicatorRow,
  MonthlyReportData,
  MonthlyDetailedItem,
  AnnualReportData,
  DayType,
} from "@/types";

/**
 * Calcule les statistiques globales ou filtrées par période
 */
export async function getStatsOverview(period?: {
  startDate?: Date;
  endDate?: Date;
  year?: number;
}): Promise<StatsOverview> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (period?.startDate && period?.endDate) {
      where.date = {
        gte: period.startDate,
        lte: period.endDate,
      };
    } else if (period?.year) {
      where.date = {
        gte: new Date(period.year, 0, 1),
        lte: new Date(period.year, 11, 31, 23, 59, 59),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: "asc" },
    });

    let totalDimanches = 0;
    let totalJeudis = 0;
    let totalAssistantsDimanche = 0;
    let totalAssistantsJeudi = 0;
    let maxAttendance: { date: string; dayType: DayType; count: number } | null = null;
    let minAttendance: { date: string; dayType: DayType; count: number } | null = null;

    const allCounts: number[] = [];
    let countInf30 = 0;
    let count30to45 = 0;
    let count45to60 = 0;
    let countSup60 = 0;

    for (const record of attendances) {
      allCounts.push(record.assistantCount);

      if (record.dayType === "DIMANCHE") {
        totalDimanches += 1;
        totalAssistantsDimanche += record.assistantCount;
      } else if (record.dayType === "JEUDI") {
        totalJeudis += 1;
        totalAssistantsJeudi += record.assistantCount;
      }

      if (!maxAttendance || record.assistantCount > maxAttendance.count) {
        maxAttendance = {
          date: formatDateFR(record.date),
          dayType: record.dayType as DayType,
          count: record.assistantCount,
        };
      }

      if (!minAttendance || record.assistantCount < minAttendance.count) {
        minAttendance = {
          date: formatDateFR(record.date),
          dayType: record.dayType as DayType,
          count: record.assistantCount,
        };
      }

      if (record.assistantCount < 30) countInf30++;
      else if (record.assistantCount <= 45) count30to45++;
      else if (record.assistantCount <= 60) count45to60++;
      else countSup60++;
    }

    const totalJours = totalDimanches + totalJeudis;
    const totalGeneralAssistants = totalAssistantsDimanche + totalAssistantsJeudi;

    const moyenneDimanche = safeDivide(totalAssistantsDimanche, totalDimanches);
    const moyenneJeudi = safeDivide(totalAssistantsJeudi, totalJeudis);
    const moyenneGenerale = safeDivide(totalGeneralAssistants, totalJours);

    // Calcul de la médiane
    allCounts.sort((a, b) => a - b);
    let medianeAssistants = 0;
    if (allCounts.length > 0) {
      const mid = Math.floor(allCounts.length / 2);
      medianeAssistants =
        allCounts.length % 2 !== 0
          ? allCounts[mid]
          : Number(((allCounts[mid - 1] + allCounts[mid]) / 2).toFixed(1));
    }

    // Répartition par tranches
    const repartitionTranches = [
      { tranche: "Moins de 30 assistants", count: countInf30, pourcentage: safeDivide(countInf30 * 100, totalJours) },
      { tranche: "30 à 45 assistants", count: count30to45, pourcentage: safeDivide(count30to45 * 100, totalJours) },
      { tranche: "46 à 60 assistants", count: count45to60, pourcentage: safeDivide(count45to60 * 100, totalJours) },
      { tranche: "Plus de 60 assistants", count: countSup60, pourcentage: safeDivide(countSup60 * 100, totalJours) },
    ];

    return {
      totalDimanches,
      totalJeudis,
      totalJours,
      totalAssistantsDimanche,
      totalAssistantsJeudi,
      totalGeneralAssistants,
      moyenneDimanche,
      moyenneJeudi,
      moyenneGenerale,
      medianeAssistants,
      pireJournee: minAttendance,
      meilleureJournee: maxAttendance,
      repartitionTranches,
    };
  } catch (error) {
    console.error("Erreur calcul getStatsOverview:", error);
    return {
      totalDimanches: 0,
      totalJeudis: 0,
      totalJours: 0,
      totalAssistantsDimanche: 0,
      totalAssistantsJeudi: 0,
      totalGeneralAssistants: 0,
      moyenneDimanche: 0,
      moyenneJeudi: 0,
      moyenneGenerale: 0,
      meilleureJournee: null,
    };
  }
}

/**
 * Construit le tableau récapitulatif standard (Indicateurs: Nombre de jours, Total assistants, Moyenne par jour)
 */
export function buildIndicatorRows(stats: {
  totalDimanches: number;
  totalJeudis: number;
  totalJours: number;
  totalAssistantsDimanche: number;
  totalAssistantsJeudi: number;
  totalGeneralAssistants: number;
  moyenneDimanche: number;
  moyenneJeudi: number;
  moyenneGenerale: number;
}): IndicatorRow[] {
  return [
    {
      indicateur: "Nombre de jours",
      dimanche: stats.totalDimanches,
      jeudi: stats.totalJeudis,
      total: stats.totalJours,
    },
    {
      indicateur: "Total des assistants",
      dimanche: stats.totalAssistantsDimanche,
      jeudi: stats.totalAssistantsJeudi,
      total: stats.totalGeneralAssistants,
    },
    {
      indicateur: "Moyenne par jour",
      dimanche: stats.moyenneDimanche,
      jeudi: stats.moyenneJeudi,
      total: stats.moyenneGenerale,
    },
  ];
}

/**
 * Récupère le relevé mensuel complet pour un mois et une année donnés
 */
export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  let totalDimanches = 0;
  let totalJeudis = 0;
  let totalDimancheAssistants = 0;
  let totalJeudiAssistants = 0;
  let meilleureJournee: { date: string; dayType: DayType; count: number } | null = null;
  let pireJournee: { date: string; dayType: DayType; count: number } | null = null;

  const detailedItems: MonthlyDetailedItem[] = records.map((rec) => {
    if (rec.dayType === "DIMANCHE") {
      totalDimanches += 1;
      totalDimancheAssistants += rec.assistantCount;
    } else if (rec.dayType === "JEUDI") {
      totalJeudis += 1;
      totalJeudiAssistants += rec.assistantCount;
    }

    const formatted = formatDateFR(rec.date);
    if (!meilleureJournee || rec.assistantCount > meilleureJournee.count) {
      meilleureJournee = { date: formatted, dayType: rec.dayType as DayType, count: rec.assistantCount };
    }
    if (!pireJournee || rec.assistantCount < pireJournee.count) {
      pireJournee = { date: formatted, dayType: rec.dayType as DayType, count: rec.assistantCount };
    }

    return {
      id: rec.id,
      date: rec.date.toISOString(),
      formattedDate: formatted,
      dayType: rec.dayType as DayType,
      assistantCount: rec.assistantCount,
      observation: rec.observation,
    };
  });

  const totalJours = totalDimanches + totalJeudis;
  const totalAssistants = totalDimancheAssistants + totalJeudiAssistants;
  const moyenneDimanche = safeDivide(totalDimancheAssistants, totalDimanches);
  const moyenneJeudi = safeDivide(totalJeudiAssistants, totalJeudis);
  const moyenneGenerale = safeDivide(totalAssistants, totalJours);

  const indicators = buildIndicatorRows({
    totalDimanches,
    totalJeudis,
    totalJours,
    totalAssistantsDimanche: totalDimancheAssistants,
    totalAssistantsJeudi: totalJeudiAssistants,
    totalGeneralAssistants: totalAssistants,
    moyenneDimanche,
    moyenneJeudi,
    moyenneGenerale,
  });

  // Import dynamique ou service commentaire
  const monthName = MOIS_FRANCAIS[month - 1] || `Mois ${month}`;

  return {
    year,
    month,
    monthName,
    records: detailedItems,
    indicators,
    totalJours,
    totalAssistants,
    moyenneGenerale,
    totalDimanches,
    totalJeudis,
    totalDimancheAssistants,
    totalJeudiAssistants,
    moyenneDimanche,
    moyenneJeudi,
    meilleureJournee,
    pireJournee,
    commentaire: "", // Rempli par commentaire.service
  };
}

/**
 * Récupère le bilan annuel complet
 */
export async function getAnnualReport(year: number): Promise<AnnualReportData> {
  const startDate = new Date(year, 0, 1, 0, 0, 0);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // Découpage mensuel (1 à 12)
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    return {
      month: i + 1,
      monthName: MOIS_FRANCAIS[i],
      dimanches: 0,
      jeudis: 0,
      dimancheAssistants: 0,
      jeudiAssistants: 0,
      totalJours: 0,
      assistants: 0,
      moyenne: 0,
    };
  });

  let totalDimanches = 0;
  let totalJeudis = 0;
  let totalDimanchesAssistants = 0;
  let totalJeudisAssistants = 0;

  for (const r of records) {
    const m = r.date.getMonth(); // 0 à 11
    if (r.dayType === "DIMANCHE") {
      totalDimanches += 1;
      totalDimanchesAssistants += r.assistantCount;
      monthsData[m].dimanches += 1;
      monthsData[m].dimancheAssistants += r.assistantCount;
    } else {
      totalJeudis += 1;
      totalJeudisAssistants += r.assistantCount;
      monthsData[m].jeudis += 1;
      monthsData[m].jeudiAssistants += r.assistantCount;
    }
    monthsData[m].totalJours += 1;
    monthsData[m].assistants += r.assistantCount;
  }

  // Calcul moyennes pour chaque mois
  let meilleurMois: { monthName: string; moyenne: number; total: number } | null = null;
  let faibleMois: { monthName: string; moyenne: number; total: number } | null = null;

  const monthlyBreakdown = monthsData.map((m) => {
    const moyenne = safeDivide(m.assistants, m.totalJours);
    if (m.totalJours > 0) {
      if (!meilleurMois || moyenne > meilleurMois.moyenne) {
        meilleurMois = { monthName: m.monthName, moyenne, total: m.assistants };
      }
      if (!faibleMois || moyenne < faibleMois.moyenne) {
        faibleMois = { monthName: m.monthName, moyenne, total: m.assistants };
      }
    }
    return {
      month: m.month,
      monthName: m.monthName,
      dimanches: m.dimanches,
      jeudis: m.jeudis,
      totalJours: m.totalJours,
      assistants: m.assistants,
      moyenne,
    };
  });

  const totalGeneralJours = totalDimanches + totalJeudis;
  const totalGeneralAssistants = totalDimanchesAssistants + totalJeudisAssistants;
  const moyenneAnnuelle = safeDivide(totalGeneralAssistants, totalGeneralJours);
  const moyenneDimanche = safeDivide(totalDimanchesAssistants, totalDimanches);
  const moyenneJeudi = safeDivide(totalJeudisAssistants, totalJeudis);

  return {
    year,
    totalDimanches,
    totalJeudis,
    totalDimanchesAssistants,
    totalJeudisAssistants,
    totalGeneralJours,
    totalGeneralAssistants,
    moyenneAnnuelle,
    moyenneDimanche,
    moyenneJeudi,
    meilleurMois,
    faibleMois,
    monthlyBreakdown,
    commentaire: "",
  };
}

/**
 * Données préparées pour les graphiques du Dashboard
 */
export async function getDashboardChartsData(year?: number) {
  const currentYear = year || new Date().getFullYear();
  const annual = await getAnnualReport(currentYear);

  // Calcul des moyennes mensuelles par type de jour (Dimanche / Jeudi)
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });

  const monthStatsMap = Array.from({ length: 12 }, () => ({
    sunCount: 0,
    sunTotal: 0,
    thuCount: 0,
    thuTotal: 0,
  }));

  for (const r of records) {
    const m = r.date.getMonth();
    if (r.dayType === "DIMANCHE") {
      monthStatsMap[m].sunCount += 1;
      monthStatsMap[m].sunTotal += r.assistantCount;
    } else {
      monthStatsMap[m].thuCount += 1;
      monthStatsMap[m].thuTotal += r.assistantCount;
    }
  }

  const comparisonBars = annual.monthlyBreakdown.map((m, idx) => ({
    mois: m.monthName.slice(0, 4) + ".",
    moisComplet: m.monthName,
    MoyenneDimanche: safeDivide(monthStatsMap[idx].sunTotal, monthStatsMap[idx].sunCount),
    MoyenneJeudi: safeDivide(monthStatsMap[idx].thuTotal, monthStatsMap[idx].thuCount),
    TotalAssistants: m.assistants,
    MoyenneGlobale: m.moyenne,
  }));

  // 2. Graphique linéaire : évolution mensuelle
  const lineChartData = annual.monthlyBreakdown.map((m) => ({
    mois: m.monthName.slice(0, 4) + ".",
    assistants: m.assistants,
    moyenne: m.moyenne,
  }));

  // 3. Graphique circulaire : répartition des assistants entre dimanche et jeudi
  const pieChartData = [
    {
      name: "Dimanches",
      value: annual.totalDimanchesAssistants,
      color: "#4f46e5", // Indigo
    },
    {
      name: "Jeudis",
      value: annual.totalJeudisAssistants,
      color: "#06b6d4", // Cyan
    },
  ];

  return {
    currentYear,
    comparisonBars,
    lineChartData,
    pieChartData,
    annualOverview: annual,
  };
}
