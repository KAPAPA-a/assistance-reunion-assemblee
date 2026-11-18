import { formatNombreFR } from "@/lib/utils";
import type { StatsOverview, MonthlyReportData, AnnualReportData, MonthlyComparisonItem } from "@/types";

/**
 * Génère un commentaire analytique pour le Dashboard et les Statistiques Générales
 */
export function genererCommentaireGeneral(stats: StatsOverview, periodeLabel: string = "la période étudiée"): string {
  if (stats.totalJours === 0) {
    return `Aucune journée d'accueil n'a encore été enregistrée pour ${periodeLabel}. Veuillez enregistrer les présences pour générer les analyses statistiques.`;
  }

  const p1 = `Au cours de ${periodeLabel}, ${stats.totalJours} journée${stats.totalJours > 1 ? "s" : ""} d'accueil ${stats.totalJours > 1 ? "ont été organisées" : "a été organisée"}, dont ${stats.totalDimanches} dimanche${stats.totalDimanches > 1 ? "s" : ""} et ${stats.totalJeudis} jeudi${stats.totalJeudis > 1 ? "s" : ""}.`;

  const pSun =
    stats.totalDimanches > 0
      ? `Le dimanche a enregistré un total de ${formatNombreFR(stats.totalAssistantsDimanche)} assistant${stats.totalAssistantsDimanche > 1 ? "s" : ""}, avec une moyenne de ${formatNombreFR(stats.moyenneDimanche)} assistant${stats.moyenneDimanche >= 2 ? "s" : ""} par journée.`
      : `Aucun accueil du dimanche n'a été enregistré sur cette période.`;

  const pThu =
    stats.totalJeudis > 0
      ? `Le jeudi a enregistré un total de ${formatNombreFR(stats.totalAssistantsJeudi)} assistant${stats.totalAssistantsJeudi > 1 ? "s" : ""}, avec une moyenne de ${formatNombreFR(stats.moyenneJeudi)} assistant${stats.moyenneJeudi >= 2 ? "s" : ""} par journée.`
      : `Aucun accueil du jeudi n'a été enregistré sur cette période.`;

  const pTot = `Au total, ${formatNombreFR(stats.totalGeneralAssistants)} assistant${stats.totalGeneralAssistants > 1 ? "s ont" : " a"} participé aux différentes journées d'accueil, soit une moyenne générale de ${formatNombreFR(stats.moyenneGenerale)} assistant${stats.moyenneGenerale >= 2 ? "s" : ""} par jour.`;

  let pComp = "";
  let pReco = "";

  if (stats.totalDimanches > 0 && stats.totalJeudis > 0) {
    if (stats.moyenneDimanche > stats.moyenneJeudi) {
      const ecart = formatNombreFR(stats.moyenneDimanche - stats.moyenneJeudi);
      pComp = `L'analyse comparative met en évidence que la participation moyenne du dimanche (${formatNombreFR(stats.moyenneDimanche)}) est supérieure à celle du jeudi (${formatNombreFR(stats.moyenneJeudi)}), soit un écart positif moyen de ${ecart} assistant${Number(ecart.replace(",", ".")) >= 2 ? "s" : ""} par séance.`;
      pReco = `Il est recommandé de consolider la dynamique du dimanche tout en mettant en œuvre des actions ciblées de mobilisation pour les accueils du jeudi afin de rééquilibrer la fréquentation globale.`;
    } else if (stats.moyenneJeudi > stats.moyenneDimanche) {
      const ecart = formatNombreFR(stats.moyenneJeudi - stats.moyenneDimanche);
      pComp = `L'analyse comparative révèle que la participation moyenne du jeudi (${formatNombreFR(stats.moyenneJeudi)}) surpasse celle du dimanche (${formatNombreFR(stats.moyenneDimanche)}), avec un écart favorable de ${ecart} assistant${Number(ecart.replace(",", ".")) >= 2 ? "s" : ""}.`;
      pReco = `Ce résultat positif pour le jeudi démontre une forte mobilisation en semaine. Un effort d'accompagnement peut être maintenu pour stimuler l'affluence dominicale.`;
    } else {
      pComp = `On constate une parfaite parité de fréquentation moyenne entre le dimanche et le jeudi (${formatNombreFR(stats.moyenneDimanche)} assistants par jour).`;
      pReco = `La régularité observée entre les deux jours témoigne d'une fréquentation équilibrée et stable.`;
    }
  } else if (stats.totalDimanches > 0) {
    pComp = `Seuls les accueils du dimanche sont documentés à ce stade.`;
    pReco = `L'enregistrement des séances du jeudi permettra de disposer d'une vision comparative complète.`;
  } else {
    pComp = `Seuls les accueils du jeudi sont documentés à ce stade.`;
    pReco = `L'enregistrement des séances du dimanche permettra d'enrichir le suivi comparatif.`;
  }

  let pPic = "";
  if (stats.meilleureJournee) {
    pPic = ` La plus forte affluence a été observée le ${stats.meilleureJournee.date} (${stats.meilleureJournee.dayType.toLowerCase()}) avec un pic de ${formatNombreFR(stats.meilleureJournee.count)} assistants.`;
  }

  return `${p1}\n\n${pSun}\n\n${pThu}\n\n${pTot}\n\n${pComp}${pPic}\n\n${pReco}`;
}

/**
 * Génère le commentaire pour le relevé mensuel
 */
export function genererCommentaireMensuel(data: MonthlyReportData): string {
  if (data.totalJours === 0) {
    return `Aucun accueil n'a été enregistré durant le mois de ${data.monthName} ${data.year}.`;
  }

  const p1 = `Durant le mois de ${data.monthName} ${data.year}, ${data.totalJours} journée${data.totalJours > 1 ? "s" : ""} d'accueil ${data.totalJours > 1 ? "ont été tenues" : "a été tenue"} (${data.totalDimanches} dimanche${data.totalDimanches > 1 ? "s" : ""} et ${data.totalJeudis} jeudi${data.totalJeudis > 1 ? "s" : ""}), rassemblant un effectif cumulé de ${formatNombreFR(data.totalAssistants)} assistant${data.totalAssistants > 1 ? "s" : ""}.`;

  const pMoy = `La moyenne mensuelle s'établit à ${formatNombreFR(data.moyenneGenerale)} assistant${data.moyenneGenerale >= 2 ? "s" : ""} par accueil, avec ${formatNombreFR(data.moyenneDimanche)} le dimanche et ${formatNombreFR(data.moyenneJeudi)} le jeudi.`;

  let pPics = "";
  if (data.meilleureJournee && data.records.length > 1) {
    pPics = `Le pic de fréquentation du mois a été atteint le ${data.meilleureJournee.date} avec ${formatNombreFR(data.meilleureJournee.count)} assistants.`;
    if (data.pireJournee && data.pireJournee.count !== data.meilleureJournee.count) {
      pPics += ` À l'inverse, l'affluence la plus modérée s'est produite le ${data.pireJournee.date} avec ${formatNombreFR(data.pireJournee.count)} assistants.`;
    }
  }

  let pReco = "";
  if (data.totalDimanches > 0 && data.totalJeudis > 0) {
    if (data.moyenneDimanche > data.moyenneJeudi) {
      pReco = `Pour le mois suivant, une attention particulière pourra être portée sur la communication des séances du jeudi afin de réduire l'écart avec les dimanches.`;
    } else if (data.moyenneJeudi > data.moyenneDimanche) {
      pReco = `La remarquable assiduité du jeudi constitue un point d'appui solide à valoriser pour l'ensemble des rendez-vous.`;
    } else {
      pReco = `La régularité entre le dimanche et le jeudi confirme une bonne stabilité de la communauté d'assistants.`;
    }
  } else {
    pReco = `Il conviendra d'assurer la tenue et le relevé de l'ensemble des accueils prévus au calendrier.`;
  }

  return `${p1}\n\n${pMoy}${pPics ? `\n\n${pPics}` : ""}\n\nConclusion et recommandations :\n${pReco}`;
}

/**
 * Génère le commentaire pour la comparaison entre mois
 */
export function genererCommentaireComparatif(
  monthA: MonthlyComparisonItem,
  monthB: MonthlyComparisonItem
): string {
  if (monthA.totalJours === 0 && monthB.totalJours === 0) {
    return `Données insuffisantes : aucun accueil n'a été consigné pour ${monthA.monthName} ${monthA.year} et ${monthB.monthName} ${monthB.year}.`;
  }

  if (monthA.totalJours === 0) {
    return `${monthA.monthName} ${monthA.year} ne comporte aucun accueil enregistré, tandis que ${monthB.monthName} ${monthB.year} totalise ${formatNombreFR(monthB.totalAssistants)} assistants sur ${monthB.totalJours} jours (moyenne : ${formatNombreFR(monthB.moyenneJournaliere)} assistants/jour).`;
  }

  if (monthB.totalJours === 0) {
    return `${monthB.monthName} ${monthB.year} ne comporte aucun enregistrement. Pour rappel, ${monthA.monthName} ${monthA.year} enregistrait une moyenne de ${formatNombreFR(monthA.moyenneJournaliere)} assistants/jour.`;
  }

  const diffMoyenne = Number((monthB.moyenneJournaliere - monthA.moyenneJournaliere).toFixed(2));
  const diffTotal = monthB.totalAssistants - monthA.totalAssistants;
  const tauxEvolutionMoyenne =
    monthA.moyenneJournaliere > 0
      ? Number((((monthB.moyenneJournaliere - monthA.moyenneJournaliere) / monthA.moyenneJournaliere) * 100).toFixed(2))
      : 100;

  let sensTexte = "";
  if (diffMoyenne > 0) {
    sensTexte = `La participation a progressé de ${formatNombreFR(tauxEvolutionMoyenne)} % entre ${monthA.monthName} et ${monthB.monthName} en termes de moyenne journalière. ${monthB.monthName} présente une moyenne de ${formatNombreFR(monthB.moyenneJournaliere)} assistants, contre ${formatNombreFR(monthA.moyenneJournaliere)} en ${monthA.monthName}.`;
  } else if (diffMoyenne < 0) {
    sensTexte = `La participation journalière moyenne a régressé de ${formatNombreFR(Math.abs(tauxEvolutionMoyenne))} % entre ${monthA.monthName} et ${monthB.monthName}. ${monthB.monthName} enregistre une moyenne de ${formatNombreFR(monthB.moyenneJournaliere)} assistants/jour, contre ${formatNombreFR(monthA.moyenneJournaliere)} pour ${monthA.monthName}.`;
  } else {
    sensTexte = `La moyenne journalière est restée strictement constante entre ${monthA.monthName} et ${monthB.monthName} (${formatNombreFR(monthA.moyenneJournaliere)} assistants par jour).`;
  }

  // Précision importante pour ne pas confondre total et moyenne
  let nuanceTotal = "";
  if (
    (diffMoyenne > 0 && diffTotal < 0) ||
    (diffMoyenne < 0 && diffTotal > 0)
  ) {
    nuanceTotal = ` Notons que l'évolution de la moyenne journalière (${diffMoyenne > 0 ? "+" : ""}${formatNombreFR(diffMoyenne)}) diverge de l'évolution du volume cumulé d'assistants (${diffTotal > 0 ? "+" : ""}${diffTotal}), ce qui s'explique par un nombre de journées d'accueil différent (${monthA.totalJours} jours contre ${monthB.totalJours} jours).`;
  }

  return `${sensTexte}${nuanceTotal}`;
}

/**
 * Génère le commentaire pour le bilan annuel
 */
export function genererCommentaireAnnuel(annual: AnnualReportData): string {
  if (annual.totalGeneralJours === 0) {
    return `Aucune donnée d'accueil n'a été enregistrée pour l'exercice ${annual.year}.`;
  }

  const p1 = `Sur l'ensemble de l'année civile ${annual.year}, un total de ${annual.totalGeneralJours} journées d'accueil a été organisé (${annual.totalDimanches} dimanches et ${annual.totalJeudis} jeudis), représentant un volume cumulé de ${formatNombreFR(annual.totalGeneralAssistants)} assistants accueillis.`;

  const pMoy = `La moyenne annuelle globale se chiffre à ${formatNombreFR(annual.moyenneAnnuelle)} assistants par jour. Les dimanches enregistrent une moyenne de ${formatNombreFR(annual.moyenneDimanche)} assistants (${formatNombreFR(annual.totalDimanchesAssistants)} au total), tandis que les jeudis affichent une moyenne de ${formatNombreFR(annual.moyenneJeudi)} assistants (${formatNombreFR(annual.totalJeudisAssistants)} au total).`;

  let pMois = "";
  if (annual.meilleurMois) {
    pMois = `L'analyse mensuelle identifie ${annual.meilleurMois.monthName} comme le mois le plus performant avec une moyenne de ${formatNombreFR(annual.meilleurMois.moyenne)} assistants par séance.`;
    if (annual.faibleMois && annual.faibleMois.monthName !== annual.meilleurMois.monthName) {
      pMois += ` Le mois de ${annual.faibleMois.monthName} a enregistré la moyenne la plus basse de l'exercice avec ${formatNombreFR(annual.faibleMois.moyenne)} assistants par jour.`;
    }
  }

  let pReco = "";
  if (annual.moyenneDimanche > annual.moyenneJeudi) {
    pReco = `Pour l'exercice suivant, les efforts d'organisation et de fidélisation devront privilégier les créneaux du jeudi, afin de réduire la disparité observée et de maximiser l'impact global de chaque session d'accueil.`;
  } else if (annual.moyenneJeudi > annual.moyenneDimanche) {
    pReco = `L'excellente adhésion constatée les jeudis représente un atout majeur. Il convient de capitaliser sur ces bonnes pratiques pour dynamiser davantage les dimanches.`;
  } else {
    pReco = `L'exercice démontre un équilibre exemplaire entre les dimanches et jeudis. La priorité pour l'année à venir sera de consolider ce socle de participation.`;
  }

  return `${p1}\n\n${pMoy}\n\n${pMois}\n\nConclusion et orientations stratégiques :\n${pReco}`;
}

/**
 * Génère le commentaire pour la comparaison interannuelle (Année A vs Année B)
 */
export function genererCommentaireInterannuel(
  yearA: AnnualReportData,
  yearB: AnnualReportData
): string {
  if (yearA.totalGeneralJours === 0 && yearB.totalGeneralJours === 0) {
    return `Données insuffisantes : aucun accueil n'a été enregistré pour les exercices ${yearA.year} et ${yearB.year}.`;
  }

  if (yearA.totalGeneralJours === 0) {
    return `L'exercice ${yearA.year} ne contient aucun enregistrement, alors que l'exercice ${yearB.year} totalise ${formatNombreFR(yearB.totalGeneralAssistants)} assistants sur ${yearB.totalGeneralJours} journées (moyenne : ${formatNombreFR(yearB.moyenneAnnuelle)} assistants/jour).`;
  }

  if (yearB.totalGeneralJours === 0) {
    return `L'exercice ${yearB.year} ne comporte aucun enregistrement. Pour rappel, l'exercice ${yearA.year} comptait ${formatNombreFR(yearA.totalGeneralAssistants)} assistants (moyenne : ${formatNombreFR(yearA.moyenneAnnuelle)} ass./jour).`;
  }

  const diffMoyenne = Number((yearB.moyenneAnnuelle - yearA.moyenneAnnuelle).toFixed(2));
  const diffTotal = yearB.totalGeneralAssistants - yearA.totalGeneralAssistants;
  const tauxEvolutionMoyenne =
    yearA.moyenneAnnuelle > 0
      ? Number((((yearB.moyenneAnnuelle - yearA.moyenneAnnuelle) / yearA.moyenneAnnuelle) * 100).toFixed(2))
      : 100;

  let sens = "";
  if (diffMoyenne > 0) {
    sens = `Entre ${yearA.year} et ${yearB.year}, la moyenne annuelle par journée d'accueil a progressé de +${formatNombreFR(tauxEvolutionMoyenne)} %, passant de ${formatNombreFR(yearA.moyenneAnnuelle)} à ${formatNombreFR(yearB.moyenneAnnuelle)} assistants par jour (gain moyen de +${formatNombreFR(diffMoyenne)} assistants par séance).`;
  } else if (diffMoyenne < 0) {
    sens = `Entre ${yearA.year} et ${yearB.year}, la moyenne annuelle a régressé de ${formatNombreFR(tauxEvolutionMoyenne)} %, passant de ${formatNombreFR(yearA.moyenneAnnuelle)} à ${formatNombreFR(yearB.moyenneAnnuelle)} assistants par séance.`;
  } else {
    sens = `La fréquentation moyenne est restée parfaitement stable entre ${yearA.year} et ${yearB.year} avec ${formatNombreFR(yearA.moyenneAnnuelle)} assistants par séance.`;
  }

  const diffSun = Number((yearB.moyenneDimanche - yearA.moyenneDimanche).toFixed(2));
  const diffThu = Number((yearB.moyenneJeudi - yearA.moyenneJeudi).toFixed(2));

  const analyseJours = `Sur le plan des journées spécifiques : les dimanches sont passés de ${formatNombreFR(yearA.moyenneDimanche)} à ${formatNombreFR(yearB.moyenneDimanche)} assistants en moyenne (${diffSun >= 0 ? "+" : ""}${formatNombreFR(diffSun)}), tandis que les jeudis sont passés de ${formatNombreFR(yearA.moyenneJeudi)} à ${formatNombreFR(yearB.moyenneJeudi)} (${diffThu >= 0 ? "+" : ""}${formatNombreFR(diffThu)}).`;

  return `${sens}\n\n${analyseJours}`;
}
