/* Les types de manche.
 *
 * Le site ne connaît QUE ces types. Le contenu — énoncés, réponses,
 * indices, fichiers — est saisi depuis /admin et vit en base.
 * Ajouter un dossier = remplir un formulaire. Ajouter un TYPE = du code.
 *
 * Chaque type déclare :
 *   champs   — ce que l'admin affiche comme formulaire
 *   public   — les clés de `payload` servies au joueur (liste blanche stricte)
 *   secret   — ce qui vit dans `solution` et ne quitte jamais le serveur
 */

export const TYPES = {
  note: {
    nom: 'Note',
    resume: "Une lettre, une note de marge. Pas d'énigme : une respiration narrative.",
    aResoudre: false,
    champs: [
      { cle: 'texte', libelle: 'Le texte', forme: 'texte-long', requis: true },
      { cle: 'signature', libelle: 'Signature', forme: 'texte' },
      { cle: 'ton', libelle: 'Ton', forme: 'choix', options: ['neutre', 'manuscrit', 'administratif'] },
    ],
    public: ['texte', 'signature', 'ton'],
    secret: [],
  },

  saisie: {
    nom: 'Saisie',
    resume: 'Un énoncé, un champ de réponse. Le cas général.',
    aResoudre: true,
    champs: [
      { cle: 'enonce', libelle: "L'énoncé", forme: 'texte-long', requis: true },
      { cle: 'consigne', libelle: 'La question posée', forme: 'texte' },
      { cle: 'placeholder', libelle: 'Exemple dans le champ', forme: 'texte' },
      { cle: 'medias', libelle: 'Pièces jointes', forme: 'medias' },
    ],
    public: ['enonce', 'consigne', 'placeholder', 'medias'],
    secret: ['reponses'],
  },

  fichier: {
    nom: 'Fichier',
    resume: 'Un ou plusieurs fichiers à décortiquer, plus une réponse à trouver.',
    aResoudre: true,
    champs: [
      { cle: 'enonce', libelle: "L'énoncé", forme: 'texte-long', requis: true },
      { cle: 'consigne', libelle: 'La question posée', forme: 'texte' },
      { cle: 'medias', libelle: 'Les fichiers', forme: 'medias', requis: true },
    ],
    public: ['enonce', 'consigne', 'medias'],
    secret: ['reponses'],
  },

  grille: {
    nom: 'Grille de déduction',
    resume: 'Le Cluedo. Des catégories, des contraintes, une seule configuration.',
    aResoudre: true,
    champs: [
      { cle: 'enonce', libelle: "L'énoncé", forme: 'texte-long' },
      { cle: 'categories', libelle: 'Les catégories', forme: 'categories', requis: true },
      { cle: 'contraintes', libelle: 'Les contraintes', forme: 'liste', requis: true },
      { cle: 'consigne', libelle: 'La question posée', forme: 'texte' },
    ],
    public: ['enonce', 'categories', 'contraintes', 'consigne'],
    secret: ['reponses', 'solutionGrille'],
  },

  imposteur: {
    nom: 'Imposteur',
    resume: "Des déclarations, une seule est fabriquée. Il désigne laquelle.",
    aResoudre: true,
    champs: [
      { cle: 'enonce', libelle: "L'énoncé", forme: 'texte-long' },
      { cle: 'declarations', libelle: 'Les déclarations', forme: 'declarations', requis: true },
      { cle: 'consigne', libelle: 'La question posée', forme: 'texte' },
    ],
    public: ['enonce', 'declarations', 'consigne'],
    secret: ['reponses', 'imposteur'],
  },

  serrure: {
    nom: 'Serrure',
    resume: "Un texte caché qu'une phrase de passe révèle, ligne à ligne. Le parchemin.",
    aResoudre: true,
    champs: [
      { cle: 'invite', libelle: "L'invite affichée", forme: 'texte-long', requis: true },
      { cle: 'consigne', libelle: 'La question posée ensuite', forme: 'texte' },
      { cle: 'fermeture', libelle: 'Phrase qui referme', forme: 'texte' },
    ],
    public: ['invite', 'consigne', 'fermeture'],
    // `passe` ouvre le texte, `revele` est le texte, `reponses` est l'énigme d'après
    secret: ['passe', 'revele', 'reponses'],
  },

  assemblage: {
    nom: 'Assemblage',
    resume: 'Un taquin. Une fois reconstitué, un champ de code apparaît.',
    aResoudre: true,
    champs: [
      { cle: 'enonce', libelle: "L'énoncé", forme: 'texte-long' },
      { cle: 'media', libelle: "L'image", forme: 'media', requis: true },
      { cle: 'colonnes', libelle: 'Colonnes', forme: 'nombre', defaut: 4 },
      { cle: 'lignes', libelle: 'Lignes', forme: 'nombre', defaut: 2 },
      { cle: 'consigne', libelle: 'La question posée', forme: 'texte' },
    ],
    public: ['enonce', 'colonnes', 'lignes', 'consigne'],
    secret: ['reponses'],
  },

  anomalie: {
    nom: 'Anomalie',
    resume: "La seconde couche. Rien ne la signale ; elle se dépose au tableau si repérée.",
    aResoudre: true,
    champs: [
      { cle: 'texte', libelle: 'Ce qui se dépose au tableau', forme: 'texte-long', requis: true },
      { cle: 'ou', libelle: 'Où elle se cache', forme: 'texte' },
    ],
    public: [],
    secret: ['reponses', 'texte', 'ou'],
  },
};

export const LISTE_TYPES = Object.entries(TYPES).map(([cle, t]) => ({
  cle, nom: t.nom, resume: t.resume, aResoudre: t.aResoudre,
}));

export const estType = (t) => Object.prototype.hasOwnProperty.call(TYPES, t);

/**
 * Réduit un dossier à ce qui peut légitimement partir au navigateur.
 * Liste blanche : une clé oubliée dans `payload` ne fuit pas par accident.
 */
export function versClient(d, { resolu = false } = {}) {
  const t = TYPES[d.type];
  if (!t) return null;
  const payload = {};
  for (const cle of t.public) {
    if (d.payload && d.payload[cle] !== undefined) payload[cle] = d.payload[cle];
  }
  return {
    slug: d.slug,
    titre: d.titre,
    genre: d.genre,
    type: d.type,
    aResoudre: t.aResoudre,
    payload,
    chronoRef: d.chrono_ref ?? null,
    animations: d.animations || {},
    resolu,
  };
}

/** Garde-fou : ce qui ne doit jamais se retrouver dans un payload public. */
export function nettoyerPayload(type, payload = {}) {
  const t = TYPES[type];
  if (!t) return {};
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (t.secret.includes(k)) continue; // une réponse glissée dans payload est écartée
    out[k] = v;
  }
  return out;
}
