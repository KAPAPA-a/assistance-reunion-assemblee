import { NextRequest, NextResponse } from "next/server";
import { getStatsOverview, getDashboardChartsData, getMonthlyReport, getAnnualReport } from "@/services/statistiques.service";
import { genererCommentaireGeneral, genererCommentaireMensuel, genererCommentaireAnnuel } from "@/services/commentaires.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "overview";
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : new Date().getMonth() + 1;

    if (type === "overview") {
      const stats = await getStatsOverview({ year });
      const charts = await getDashboardChartsData(year);
      const commentary = genererCommentaireGeneral(stats, `l'année ${year}`);

      return NextResponse.json({
        success: true,
        stats,
        charts,
        commentary,
      });
    }

    if (type === "monthly") {
      const monthly = await getMonthlyReport(year, month);
      monthly.commentaire = genererCommentaireMensuel(monthly);

      return NextResponse.json({
        success: true,
        data: monthly,
      });
    }

    if (type === "annual") {
      const annual = await getAnnualReport(year);
      annual.commentaire = genererCommentaireAnnuel(annual);

      return NextResponse.json({
        success: true,
        data: annual,
      });
    }

    return NextResponse.json({ success: false, message: "Type inconnu" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors du calcul des statistiques." },
      { status: 500 }
    );
  }
}
