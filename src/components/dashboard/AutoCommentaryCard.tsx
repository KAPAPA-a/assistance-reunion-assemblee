"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, FileText } from "lucide-react";

interface AutoCommentaryCardProps {
  commentary: string;
  title?: string;
  subtitle?: string;
}

export function AutoCommentaryCard({
  commentary,
  title = "Commentaire analytique automatique",
  subtitle = "Synthèse intelligente générée à partir des données réelles enregistrées",
}: AutoCommentaryCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(commentary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Découpage en paragraphes pour un affichage propre
  const paragraphs = commentary.split("\n\n").filter((p) => p.trim().length > 0);

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-100/80 dark:border-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
          title="Copier le texte"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-normal">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="bg-white/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
