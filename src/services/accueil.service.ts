import { prisma } from "@/lib/prisma";
import { getValidDayType, parseLocalDate } from "@/lib/utils";
import { attendanceSchema, type AttendanceInput } from "@/lib/validations";
import type { ActionResponse, AttendanceRecord, DayType } from "@/types";

export interface AttendanceFilters {
  year?: number;
  month?: number; // 1-12
  startDate?: string; // YYYY-MM-DD – pour les rapports personnalisés
  endDate?: string;   // YYYY-MM-DD – pour les rapports personnalisés
  dayType?: DayType | "ALL";
  search?: string;
  sortBy?: "date" | "assistantCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/**
 * Récupère tous les enregistrements selon les filtres
 */
export async function getAttendances(filters: AttendanceFilters = {}) {
  try {
    const {
      year,
      month,
      startDate,
      endDate,
      dayType,
      search,
      sortBy = "date",
      sortOrder = "desc",
      page = 1,
      pageSize = 20,
    } = filters;

    // Construction de la clause WHERE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (dayType && dayType !== "ALL") {
      where.dayType = dayType;
    }

    // Filtre par plage de dates personnalisée (prioritaire sur year/month)
    if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split("-").map(Number);
      const [ey, em, ed] = endDate.split("-").map(Number);
      where.date = {
        gte: new Date(sy, sm - 1, sd, 0, 0, 0),
        lte: new Date(ey, em - 1, ed, 23, 59, 59),
      };
    } else if (year && month) {
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (year) {
      const startOfYear = new Date(year, 0, 1, 0, 0, 0);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      where.date = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (search && search.trim()) {
      where.observation = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      success: true,
      records: records as AttendanceRecord[],
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des accueils:", error);
    return {
      success: false,
      records: [] as AttendanceRecord[],
      pagination: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
      error: "Impossible de charger les enregistrements depuis la base de données.",
    };
  }
}

/**
 * Récupère un enregistrement par son identifiant
 */
export async function getAttendanceById(id: string): Promise<AttendanceRecord | null> {
  try {
    const record = await prisma.attendance.findUnique({
      where: { id },
    });
    return record as AttendanceRecord | null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'accueil:", error);
    return null;
  }
}

/**
 * Enregistre ou modifie un accueil avec vérification côté serveur
 */
export async function saveAttendance(input: AttendanceInput): Promise<ActionResponse<AttendanceRecord>> {
  try {
    // 1. Validation Zod côté serveur
    const validated = attendanceSchema.safeParse(input);
    if (!validated.success) {
      const fieldErrors: Record<string, string[]> = {};
      validated.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return {
        success: false,
        message: "Les données transmises sont invalides.",
        errors: fieldErrors,
      };
    }

    const { id, date: dateStr, assistantCount, observation } = validated.data;
    const targetDate = parseLocalDate(dateStr);
    const dayType = getValidDayType(targetDate);

    if (!dayType) {
      return {
        success: false,
        message: "Jour non autorisé. L'accueil doit impérativement avoir lieu un Dimanche ou un Jeudi.",
      };
    }

    // 2. Vérification de l'unicité de la date (doublon interdit)
    // Recherche par plage du même jour pour éviter les décalages d'heure
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const existing = await prisma.attendance.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        NOT: id ? { id } : undefined,
      },
    });

    if (existing) {
      return {
        success: false,
        message: `Une journée d'accueil est déjà enregistrée pour le ${targetDate.toLocaleDateString("fr-FR")}. Les doublons sont interdits.`,
      };
    }

    // 3. Création ou Mise à jour
    let record: AttendanceRecord;
    if (id) {
      record = (await prisma.attendance.update({
        where: { id },
        data: {
          date: targetDate,
          dayType,
          assistantCount,
          observation: observation ? observation.trim() : null,
        },
      })) as unknown as AttendanceRecord;
      return {
        success: true,
        message: "La journée d'accueil a été modifiée avec succès.",
        data: record,
      };
    } else {
      record = (await prisma.attendance.create({
        data: {
          date: targetDate,
          dayType,
          assistantCount,
          observation: observation ? observation.trim() : null,
        },
      })) as unknown as AttendanceRecord;
      return {
        success: true,
        message: "La journée d'accueil a été enregistrée avec succès.",
        data: record,
      };
    }
  } catch (error) {
    console.error("Erreur saveAttendance:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de l'enregistrement dans la base de données.",
    };
  }
}

/**
 * Supprime un accueil par son identifiant
 */
export async function deleteAttendance(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "L'enregistrement à supprimer est introuvable.",
      };
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return {
      success: true,
      message: "La journée d'accueil a été supprimée avec succès.",
    };
  } catch (error) {
    console.error("Erreur deleteAttendance:", error);
    return {
      success: false,
      message: "Impossible de supprimer cet enregistrement.",
    };
  }
}

export interface BulkImportItem {
  date: string; // YYYY-MM-DD ou ISO
  assistantCount: number;
  observation?: string | null;
}

export interface BulkImportResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Import en masse d'enregistrements (utilisé pour Import Excel/CSV et Restauration JSON)
 */
export async function importAttendancesBulk(
  items: BulkImportItem[],
  options: { overwrite?: boolean } = { overwrite: false }
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    message: "",
    totalProcessed: items.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const rowNum = idx + 1;

    try {
      if (!item.date) {
        result.errors.push(`Ligne ${rowNum} : Date manquante.`);
        result.skipped++;
        continue;
      }

      // Nettoyer la date
      let dateStr = item.date;
      if (dateStr.includes("T")) {
        dateStr = dateStr.split("T")[0];
      }

      const parsedDate = parseLocalDate(dateStr);
      if (isNaN(parsedDate.getTime())) {
        result.errors.push(`Ligne ${rowNum} (${item.date}) : Format de date non reconnu.`);
        result.skipped++;
        continue;
      }

      const dayType = getValidDayType(parsedDate);
      if (!dayType) {
        result.errors.push(`Ligne ${rowNum} (${dateStr}) : Le jour n'est ni un dimanche ni un jeudi.`);
        result.skipped++;
        continue;
      }

      const count = Number(item.assistantCount);
      if (isNaN(count) || !Number.isInteger(count) || count < 0) {
        result.errors.push(`Ligne ${rowNum} (${dateStr}) : Nombre d'assistants invalide (${item.assistantCount}).`);
        result.skipped++;
        continue;
      }

      const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59);

      const existing = await prisma.attendance.findFirst({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (existing) {
        if (options.overwrite) {
          await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              assistantCount: count,
              observation: item.observation ? item.observation.trim() : existing.observation,
            },
          });
          result.updated++;
        } else {
          result.skipped++;
        }
      } else {
        await prisma.attendance.create({
          data: {
            date: parsedDate,
            dayType,
            assistantCount: count,
            observation: item.observation ? item.observation.trim() : null,
          },
        });
        result.inserted++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      result.errors.push(`Ligne ${rowNum} : ${msg}`);
      result.skipped++;
    }
  }

  result.message = `Importation terminée : ${result.inserted} ajout(s), ${result.updated} mise(s) à jour, ${result.skipped} ignoré(s).`;
  return result;
}
