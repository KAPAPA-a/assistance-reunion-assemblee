import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Assistance Réunion - Gestion de l'Accueil",
    short_name: "Assistance",
    description:
      "Application mobile de gestion, suivi et statistiques des accueils d'assemblée (dimanche et jeudi)",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nouvel accueil",
        short_name: "Nouveau",
        description: "Enregistrer une nouvelle journée d'accueil",
        url: "/accueil",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Tableau de bord",
        short_name: "Dashboard",
        description: "Consulter les statistiques",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Liste des accueils",
        short_name: "Liste",
        description: "Consulter la liste complète",
        url: "/liste-accueils",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
