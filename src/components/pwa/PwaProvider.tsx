"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Enregistrement du Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker PWA enregistré avec succès:", registration.scope);
          })
          .catch((error) => {
            console.error("Échec de l'enregistrement du Service Worker:", error);
          });
      });
    }

    // 2. Vérifier si l'app est déjà en mode plein écran / installée
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // 3. Détecter iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const promptDismissed = localStorage.getItem("pwa_prompt_dismissed");
    const dismissedTime = promptDismissed ? parseInt(promptDismissed, 10) : 0;
    const now = Date.now();
    // Ne pas ré-afficher pendant 3 jours si l'utilisateur l'a fermé
    const shouldShow = now - dismissedTime > 3 * 24 * 60 * 60 * 1000;

    // 4. Écoute de l'événement d'installation Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (shouldShow) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Pour iOS, afficher la bannière après un court délai si sur mobile et pas encore installé
    if (isIosDevice && shouldShow) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  return (
    <>
      {children}

      {/* Bannière d'installation PWA Mobile */}
      {showPrompt && !isStandalone && (
        <aside
          role="complementary"
          aria-label="Installation de l'application"
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-slate-900/95 dark:bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 no-print"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">Installer l&apos;application</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Accédez à l&apos;application directement depuis votre écran d&apos;accueil, même sans connexion.
              </p>

              {isIos ? (
                <div className="mt-2 text-xs bg-slate-800/80 rounded-lg p-2 text-slate-300 border border-slate-700 flex items-center gap-2">
                  <Share className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Appuyez sur <strong className="text-white">Partager</strong> puis sur{" "}
                    <strong className="text-white">« Sur l&apos;écran d&apos;accueil »</strong>.
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Installer
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Plus tard
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
