import { NextRequest, NextResponse } from "next/server";
import { getAttendances, saveAttendance, deleteAttendance } from "@/services/accueil.service";
import type { DayType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const dayType = (searchParams.get("dayType") as DayType | "ALL") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") as "date" | "assistantCount") || "date";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 50;

    const result = await getAttendances({
      year,
      month,
      startDate,
      endDate,
      dayType,
      search,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/attendances error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la récupération." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await saveAttendance(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendances error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la création." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: "L'identifiant (id) est obligatoire pour une modification." },
        { status: 400 }
      );
    }
    const result = await saveAttendance(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PUT /api/attendances error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la modification." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "L'identifiant est obligatoire." },
        { status: 400 }
      );
    }
    const result = await deleteAttendance(id);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/attendances error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
