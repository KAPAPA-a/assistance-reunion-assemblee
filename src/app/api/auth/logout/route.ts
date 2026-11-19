import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Déconnexion réussie.",
  });

  // Suppression des cookies de session
  response.cookies.delete("auth_session");
  response.cookies.delete("auth_user");

  return response;
}
