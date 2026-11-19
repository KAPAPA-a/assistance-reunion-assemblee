"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  DoorOpen,
  DoorClosed,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Home,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("KAPAPA");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doorOpen, setDoorOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Identifiant ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      // Succès : Déclencher l'animation d'ouverture de porte
      setDoorOpen(true);

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* 1. Ambiance de fond : Façade de nuit avec lueur de lanterne */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-black pointer-events-none" />

      {/* Lanterne au sommet */}
      <div className="absolute top-4 sm:top-8 flex flex-col items-center z-10">
        <div className="w-1.5 h-8 bg-amber-700 rounded-full" />
        <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse">
          <div className="w-4 h-4 rounded-full bg-amber-300 shadow-[0_0_20px_#f59e0b]" />
        </div>
      </div>

      {/* 2. LE CADRE ARCHITECTURAL DE LA PORTE D'ENTRÉE */}
      <div className="w-full max-w-lg relative z-10 pt-14 sm:pt-16">
        {/* Fronton supérieur en pierre / bois sculpté */}
        <div className="relative mx-auto w-[92%] sm:w-[95%] bg-gradient-to-b from-[#3a2218] to-[#25150f] border-t-4 border-l-4 border-r-4 border-[#523324] rounded-t-3xl p-3 sm:p-4 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-amber-300">
            <Home className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-black tracking-widest text-xs sm:text-sm uppercase text-amber-200 drop-shadow">
              Salle d&apos;Accueil &amp; Réunions
            </span>
            <Home className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[10px] sm:text-xs text-amber-400/70 font-mono tracking-widest mt-0.5 uppercase">
            Porte d&apos;accès principale • Sécurisée
          </p>

          {/* Plaque en laiton gravé */}
          <div className="mt-2 inline-block px-4 py-1 bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700 rounded-md shadow-md border border-yellow-300/60">
            <span className="text-[11px] font-bold tracking-wider text-amber-950 uppercase">
              Bienvenue • Entrée réservée
            </span>
          </div>
        </div>

        {/* Encadrement et Chambranle de la porte */}
        <div className="relative bg-[#1c0f0a] border-4 border-[#3f251a] shadow-[0_25px_60px_rgba(0,0,0,0.9)] rounded-b-2xl p-2 sm:p-3 overflow-hidden">
          {/* Lueur intérieure qui apparaît quand la porte s'ouvre */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-amber-300 via-amber-100 to-yellow-200 transition-opacity duration-1000 flex flex-col items-center justify-center z-0 ${
              doorOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <Sparkles className="w-16 h-16 text-amber-600 animate-spin" />
            <h2 className="text-xl sm:text-2xl font-black text-amber-950 uppercase tracking-widest mt-3">
              Porte Ouverte !
            </h2>
            <p className="text-sm font-semibold text-amber-900 mt-1">
              Bienvenue {username}, entrée en cours...
            </p>
          </div>

          {/* VRAIE PORTE EN BOIS BATTANTE (AVEC PERSPECTIVE 3D) */}
          <div
            className={`relative z-10 transition-all duration-1000 origin-left ease-in-out ${
              doorOpen
                ? "opacity-0 scale-95 [transform:perspective(1200px)_rotateY(-85deg)]"
                : "opacity-100 scale-100"
            }`}
          >
            {/* Texture de bois noble de la porte */}
            <div className="bg-gradient-to-b from-[#2e1910] via-[#3a2016] to-[#1f100a] border-2 border-[#543425] rounded-xl p-5 sm:p-7 shadow-inner relative">
              {/* Moulures supérieures de porte */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="h-12 rounded-lg bg-gradient-to-b from-[#24130c] to-[#341d13] border border-[#523324] shadow-inner flex items-center justify-center">
                  <div className="w-8 h-4 rounded-sm border border-amber-600/30" />
                </div>
                <div className="h-12 rounded-lg bg-gradient-to-b from-[#24130c] to-[#341d13] border border-[#523324] shadow-inner flex items-center justify-center">
                  <div className="w-8 h-4 rounded-sm border border-amber-600/30" />
                </div>
              </div>

              {/* Panneau de Serrure & Formulaire d'accès incrusté dans la porte */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Message d'erreur */}
                {error && (
                  <div className="p-3 bg-red-950/80 border border-red-500/80 rounded-xl flex items-center gap-2 text-xs text-red-200 animate-shake">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Champ 1 : Identifiant */}
                <div>
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Utilisateur (Clé d&apos;accès) :</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: KAPAPA"
                      className="w-full px-3.5 py-2.5 bg-black/60 border-2 border-amber-800/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition shadow-inner uppercase"
                      disabled={loading || doorOpen}
                    />
                  </div>
                </div>

                {/* Champ 2 : Mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mot de passe (Digicode) :</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez le code..."
                      className="w-full pl-3.5 pr-11 py-2.5 bg-black/60 border-2 border-amber-800/80 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition shadow-inner"
                      disabled={loading || doorOpen}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-200 p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Poignée dorée et Bouton d'entrée */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || doorOpen}
                    className="w-full relative group overflow-hidden py-3 px-4 rounded-xl font-black uppercase tracking-widest text-sm text-amber-950 transition-all duration-300 shadow-xl active:scale-[0.98] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-400 border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
                        <span>Déverrouillage...</span>
                      </div>
                    ) : doorOpen ? (
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-5 h-5 text-amber-950" />
                        <span>Entrée autorisée...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <DoorClosed className="w-5 h-5 text-amber-950 group-hover:hidden" />
                        <DoorOpen className="w-5 h-5 text-amber-950 hidden group-hover:inline" />
                        <span>OUVRIR LA PORTE</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {/* Moulures inférieures avec serrure et poignée dorée décorative */}
              <div className="mt-5 pt-3 border-t border-[#4f3223] flex items-center justify-between text-[11px] text-amber-400/60 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Accès restreint aux gestionnaires
                </span>
                <span className="font-bold text-amber-300/80">KAPAPA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Marches du perron au bas de la porte */}
        <div className="mx-auto w-[96%] h-3 bg-gradient-to-b from-[#2a170f] to-[#150a06] border-t border-[#46281a] shadow-md" />
        <div className="mx-auto w-[99%] h-3 bg-gradient-to-b from-[#1c0f09] to-[#0c0503] border-t border-[#361f14] rounded-b-lg shadow-xl" />
      </div>

      {/* Mention de bas de page */}
      <div className="mt-8 text-center text-xs text-slate-500 relative z-10 font-sans">
        Application de Gestion et Suivi d&apos;Accueil • Dimanche &amp; Jeudi
      </div>
    </div>
  );
}
