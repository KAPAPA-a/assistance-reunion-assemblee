import { NextRequest, NextResponse } from "next/server";
import { importAttendancesBulk } from "@/services/accueil.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, overwrite } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucune donnée à importer (tableau d'enregistrements vide ou manquant)." },
        { status: 400 }
      );
    }

    const result = await importAttendancesBulk(items, { overwrite: Boolean(overwrite) });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/attendances/import error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors du traitement de l'importation." },
      { status: 500 }
    );
  }
}
