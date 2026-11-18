import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Gestion des Accueils - Dimanche & Jeudi",
  description:
    "Application professionnelle de gestion, de suivi et d'analyse statistique des accueils du dimanche et du jeudi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
