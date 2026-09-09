/* Le catalogue d'animations.
 *
 * Les scènes sont IMPLÉMENTÉES dans le code (app/scenes.jsx + globals.css).
 * Leur activation, leur durée, leur ordre et le fait qu'elles jouent ou non
 * après telle manche se règlent depuis /admin et vivent en base.
 *
 * Ce fichier n'est que la liste de ce qui existe — la source pour amorcer
 * la table `animations` au premier démarrage.
 */

export const SCENES = [
  {
    cle: 'demarrage', nom: 'Ouverture du fonds', declencheur: 'chargement',
    description: "FONDS 47 qui se tape à la machine, ACCÈS AUTORISÉ, barre de charge.",
    duree_ms: 2900, ordre: 10,
  },
  {
    cle: 'ouverture_dossier', nom: "Ouverture d'un dossier", declencheur: 'jour',
    description: "La chemise cartonnée se soulève, la date en grand.",
    duree_ms: 2500, ordre: 20,
  },
  {
    cle: 'tampon_ok', nom: 'Tampon — bonne réponse', declencheur: 'reponse-juste',
    description: "Un tampon s'écrase en plein écran avec une gerbe d'éclats.",
    duree_ms: 1200, ordre: 30,
  },
  {
    cle: 'tampon_ko', nom: 'Tampon — rejeté', declencheur: 'reponse-fausse',
    description: "REJETÉ, encre qui bave, léger tremblement de la page.",
    duree_ms: 800, ordre: 40,
  },
  {
    cle: 'sceau', nom: 'Le scellé se range', declencheur: 'reponse-juste',
    description: "Le sceau de cire monte se ranger dans l'enveloppe, face cachée.",
    duree_ms: 2000, ordre: 50,
  },
  {
    cle: 'chrono', nom: 'Duel de chrono', declencheur: 'reponse-juste',
    description: "Son temps contre celui de l'Archiviste, deux barres qui se remplissent.",
    duree_ms: 2200, ordre: 60,
  },
  {
    cle: 'recompense', nom: 'La carte cachetée', declencheur: 'reponse-juste',
    description: "Une carte scellée apparaît, la cire se fend, la carte se retourne.",
    duree_ms: 3000, ordre: 70,
  },
  {
    cle: 'anomalie', nom: 'Une anomalie se dépose', declencheur: 'anomalie',
    description: "Quelque chose glisse en silence dans la colonne « ne relève d'aucun dossier ».",
    duree_ms: 1500, ordre: 80,
  },
  {
    cle: 'indice', nom: 'Indice débloqué', declencheur: 'indice',
    description: "Un feuillet se déplie du bas, le texte s'écrit à la machine.",
    duree_ms: 2000, ordre: 90,
  },
  {
    cle: 'parchemin', nom: "L'encre apparaît", declencheur: 'serrure-ouverte',
    description: "Le texte se révèle ligne à ligne, comme sur la Carte du Maraudeur.",
    duree_ms: 4000, ordre: 100,
  },
  {
    cle: 'descellement', nom: 'Le descellement', declencheur: 'verdict',
    description: "Projecteur sur l'enveloppe, les sceaux se fendent en cascade.",
    duree_ms: 5200, ordre: 110,
  },
  {
    cle: 'assemblage_ok', nom: 'Assemblage résolu', declencheur: 'assemblage',
    description: "Les joints se ferment, un balayage de lumière, le champ de code apparaît.",
    duree_ms: 1100, ordre: 120,
  },
  {
    cle: 'verdict_acte', nom: "L'acte s'imprime", declencheur: 'code-juste',
    description: "L'acte rectifié sort ligne à ligne, comme d'une imprimante matricielle.",
    duree_ms: 3400, ordre: 130,
  },
];

export const CLES_SCENES = SCENES.map((s) => s.cle);
export const estScene = (c) => CLES_SCENES.includes(c);

/** Réglages globaux par défaut — modifiables depuis /admin. */
export const ANIM_DEFAUT = {
  actives: true,
  sautToujours: true,       // un clic saute la scène, toujours
  attendreLeJoueur: true,   // la scène reste tant qu'il ne l'a pas fermée
  courteApres: 2,           // à partir de la Nième fois, version raccourcie
  facteurCourte: 0.4,       // ce que « raccourcie » veut dire
  respecterReducedMotion: true,
};

/**
 * Ce qui doit jouer à un instant donné.
 *
 * @param declencheur  l'évènement ('reponse-juste', 'verdict'…)
 * @param dossier      le dossier courant (sa clé `animations`)
 * @param catalogue    les lignes de la table `animations`
 * @param global       les réglages globaux
 * @param vues         {cle: nombre de fois déjà vue}
 */
export function sequencePour(declencheur, dossier, catalogue, global = ANIM_DEFAUT, vues = {}) {
  if (global.actives === false) return [];

  const reglage = dossier?.animations || {};
  if (reglage.mode === 'aucune') return [];

  const parCle = new Map(catalogue.map((a) => [a.cle, a]));

  /* Si le dossier impose une séquence POUR CE DÉCLENCHEUR, elle fait loi —
     et son ordre aussi. S'il n'en dit rien, le catalogue reprend la main.

     Attention, c'est le piège : une séquence qui ne cite que les scènes de
     récompense ne doit pas éteindre l'ouverture du dossier, l'indice ou le
     parchemin. « Le dossier impose » veut dire « pour ce qu'il nomme », pas
     « pour tout le jeu ». */
  const impose = Array.isArray(reglage.sequence)
    ? reglage.sequence.filter((c) => parCle.get(c)?.declencheur === declencheur)
    : [];

  const cles = impose.length
    ? impose
    : catalogue
        .filter((a) => a.declencheur === declencheur && a.actif !== false)
        .sort((a, b) => a.ordre - b.ordre)
        .map((a) => a.cle);

  return cles
    .map((cle) => {
      const a = parCle.get(cle);
      if (!a || a.actif === false) return null;
      const fois = vues[cle] || 0;
      const courte =
        reglage.mode === 'courte' ||
        (global.courteApres > 0 && fois >= global.courteApres);
      return {
        cle,
        nom: a.nom,
        duree: Math.max(200, Math.round(a.duree_ms * (courte ? global.facteurCourte : 1))),
        courte,
        options: a.options || {},
      };
    })
    .filter(Boolean);
}
