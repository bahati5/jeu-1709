/* Les valeurs de départ, et le calcul des dates.
 *
 * Rien ici n'est le jeu. Ce fichier ne contient AUCUN dossier, AUCUN énoncé,
 * AUCUNE réponse : le contenu vit en base et se saisit depuis /admin.
 * Ce qui suit n'est que le point de départ d'une partie neuve.
 */
import { ANIM_DEFAUT } from './animations.js';

export const CONFIG_DEFAUT = {
  titre: 'LE FONDS 47',

  /* L'habillage. Deux directions, choisies depuis /admin. */
  skin: 'grimoire',          // 'grimoire' | 'chambre'
  amorcage: true,            // l'écran d'accès au premier chargement
  papierNet: false,          // true = pas de bords déchirés (secours d'affichage)
  surtitre: '',              // la ligne en petites capitales, au-dessus du titre
  cote: '',                  // la cote affichée dans le bandeau (ex. 1709)

  /* L'introduction — vide = pas d'écran d'introduction. Tout se saisit. */
  intro: { titre: '', texte: '', bouton: 'Entrer' },

  /* L'écran d'attente, avant l'ouverture. */
  attente: { titre: '', texte: '' },

  /* Le pied de la vue « le fonds ». */
  piedFonds: '',

  /* La seconde couche. Le champ discret sous chaque manche : ce n'est pas
     la réponse à l'énigme du jour, c'est ce qu'il a remarqué en marge et
     que personne ne lui demande. Tout se réécrit depuis /admin. */
  anomalie: {
    titre: 'CE QUI NE COLLE PAS',
    invite: 'un détail qui cloche, une contradiction…',
    bouton: 'Signaler',
    aide: "Rien ne vous oblige à remplir ce champ. Mais si quelque chose vous a arrêté — un détail qui revient, une date qui ne tient pas — dites-le ici. Le greffe en tient compte.",
  },

  /* Le calendrier */
  debut: '2026-09-10',
  fin: '2026-09-17',
  fuseau: 'Africa/Libreville',
  heureOuverture: 6,
  heureVerdict: 6,

  /* Le programme : un slug de dossier par jour, `null` = journée sans manche.
     Les slugs viennent de la table `dossiers`. La longueur suit les dates. */
  programme: [],

  /* Les règles */
  codeFinal: '17091999',
  paliers: [60, 120, 180],
  tentativesMax: 5,
  blocageMinutes: 10,

  /* La grille de la vue « le fonds » : autant de cases que de jours, par
     défaut. Mets-en plus si tu veux un fonds plus grand que la partie. */
  tailleFonds: 8,
  refus: [],              // les notes de refus des dossiers verrouillés

  /* Le final — tout se saisit depuis /admin. */
  titreVerdict: 'Les scellés sont levés',
  inviteVerdict: "Une enveloppe scellée. Elle ne s'ouvre qu'à une date.",
  invitePlaceholder: 'jjmmaaaa',
  invitation: { titre: '', texte: '' },
  lettreFinale: '',
  lettreFinaleAnomalies: '',
  seuilAnomalies: 4,

  /* Les animations */
  animations: { ...ANIM_DEFAUT },
};

export function normaliserConfig(c) {
  const cfg = { ...CONFIG_DEFAUT, ...(c || {}) };
  const n = nbJours(cfg.debut, cfg.fin);

  const p = Array.isArray(cfg.programme) ? cfg.programme.slice(0, n) : [];
  while (p.length < n) p.push(null);
  const vus = new Set();
  cfg.programme = p.map((s) => {
    if (!s || vus.has(s)) return null;   // doublons interdits
    vus.add(s);
    return s;
  });

  cfg.paliers = (cfg.paliers || CONFIG_DEFAUT.paliers)
    .map(Number).filter((x) => Number.isFinite(x) && x >= 0).sort((a, b) => a - b);
  cfg.tentativesMax = Math.max(1, Number(cfg.tentativesMax) || CONFIG_DEFAUT.tentativesMax);
  cfg.blocageMinutes = Math.max(0, Number(cfg.blocageMinutes) ?? CONFIG_DEFAUT.blocageMinutes);
  cfg.heureOuverture = borne(cfg.heureOuverture, 0, 23, CONFIG_DEFAUT.heureOuverture);
  cfg.heureVerdict = borne(cfg.heureVerdict, 0, 23, CONFIG_DEFAUT.heureVerdict);
  cfg.animations = { ...ANIM_DEFAUT, ...(cfg.animations || {}) };
  cfg.seuilAnomalies = Math.max(0, Number(cfg.seuilAnomalies) ?? CONFIG_DEFAUT.seuilAnomalies);

  cfg.skin = cfg.skin === 'chambre' ? 'chambre' : 'grimoire';
  cfg.amorcage = cfg.amorcage !== false;
  cfg.papierNet = cfg.papierNet === true;
  cfg.intro = { ...CONFIG_DEFAUT.intro, ...(cfg.intro || {}) };
  cfg.attente = { ...CONFIG_DEFAUT.attente, ...(cfg.attente || {}) };
  cfg.anomalie = { ...CONFIG_DEFAUT.anomalie, ...(cfg.anomalie || {}) };
  cfg.invitation = { ...CONFIG_DEFAUT.invitation, ...(cfg.invitation || {}) };
  return cfg;
}

const borne = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.floor(n) : def;
};

export const JOUR_MS = 86400000;
const jourUTC = (iso) => {
  const [a, m, j] = String(iso).split('-').map(Number);
  return Date.UTC(a, (m || 1) - 1, j || 1);
};
/** Nombre de jours de jeu, bornes incluses. */
export function nbJours(debut, fin) {
  return Math.max(1, Math.round((jourUTC(fin) - jourUTC(debut)) / JOUR_MS) + 1);
}
/** La date ISO du jour d'index i (0 = premier jour). */
export function dateDuJour(debut, i) {
  return new Date(jourUTC(debut) + i * JOUR_MS).toISOString().slice(0, 10);
}
