import { z } from "zod";
import { getValidDayType, parseLocalDate } from "./utils";

export const attendanceSchema = z
  .object({
    id: z.string().optional(),
    date: z
      .string({ required_error: "La date d'accueil est obligatoire." })
      .min(1, "Veuillez sélectionner une date valide.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Le format de la date doit être AAAA-MM-JJ."),
    assistantCount: z.coerce
      .number({
        required_error: "Le nombre d'assistants est obligatoire.",
        invalid_type_error: "Le nombre d'assistants doit être un nombre entier.",
      })
      .int("Le nombre d'assistants ne peut pas être un nombre décimal.")
      .min(0, "Le nombre d'assistants doit être supérieur ou égal à 0."),
    observation: z.string().max(500, "L'observation ne peut pas dépasser 500 caractères.").optional().nullable(),
  })
  .refine(
    (data) => {
      const dayType = getValidDayType(data.date);
      return dayType === "DIMANCHE" || dayType === "JEUDI";
    },
    {
      message: "Seuls les dimanches et les jeudis sont autorisés pour l'enregistrement d'un accueil.",
      path: ["date"],
    }
  );

export type AttendanceInput = z.infer<typeof attendanceSchema>;
