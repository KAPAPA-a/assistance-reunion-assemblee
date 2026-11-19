import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Identifiants imposés
    const validUsername = "KAPAPA";
    const validPassword = "1977";

    // Vérification insensible à la casse pour le nom d'utilisateur, stricte pour le mot de passe
    if (
      username &&
      username.trim().toUpperCase() === validUsername &&
      password === validPassword
    ) {
      const response = NextResponse.json({
        success: true,
        message: "Bienvenue ! Porte déverrouillée avec succès.",
        user: { name: "KAPAPA" },
      });

      // Cookie de session valide 30 jours
      response.cookies.set("auth_session", "authenticated_kapapa", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 jours
      });

      // Cookie lisible côté client pour afficher le nom
      response.cookies.set("auth_user", "KAPAPA", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json(
      {
        success: false,
        message: "Identifiant ou mot de passe incorrect. La porte reste verrouillée.",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erreur login:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la connexion." },
      { status: 500 }
    );
  }
}
