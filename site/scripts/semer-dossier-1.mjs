#!/usr/bin/env node
/* Verse le dossier 1 dans la base.
 *
 *   node scripts/semer-dossier-1.mjs
 *
 * Ce script n'est pas le jeu : c'est un chargement unique, pour t'éviter
 * de taper trois mille signes dans un formulaire. Une fois versé, tout se
 * modifie depuis /admin — énoncé, réponses, indices, récompense, chrono.
 * Relançable : il écrase le dossier « camion-ordures » et rien d'autre.
 */
import { readFile } from 'node:fs/promises';

try {
  const txt = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  for (const l of txt.split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const { enregistrerDossier, lireConfig, ecrireConfig, pilote } = await import('../lib/donnees.js');

/* ------------------------------------------------------------------ */
/*  Les réponses acceptées — générées, pour ne refuser aucune écriture */
/* ------------------------------------------------------------------ */
const JOUR = 'vendredi';
const MENTEURS = ['4', '5'];

const reponses = [];
for (const j of [JOUR, `le ${JOUR}`]) {
  for (const [a, b] of [MENTEURS, [...MENTEURS].reverse()]) {
    reponses.push(`${j} ${a} ${b}`);
    reponses.push(`${j} ${a} et ${b}`);
    reponses.push(`${a} ${b} ${j}`);
  }
}
/* Il peut aussi nommer les menteurs plutôt que les numéroter. */
for (const g of ['gardien', 'le gardien']) {
  for (const m of ['mve', 'soeur mve', 'sœur mvé', 'mvé']) {
    reponses.push(`${JOUR} ${g} ${m}`);
    reponses.push(`${JOUR} ${m} ${g}`);
  }
}

const dossier = {
  slug: 'camion-ordures',
  titre: 'Le camion des ordures',
  genre: 'Logique — sept témoins, deux menteurs',
  type: 'saisie',
  ordre: 0,
  actif: true,
  chrono_ref: 35,

  payload: {
    enonce: `Note de marge, écriture à l'encre bleue :

« Je commence par celui-là. Trente-cinq minutes pour moi, et je connaissais déjà le tour. Vous en mettrez plus. Tout le monde en met plus, parce que tout le monde commence par croire celui qui donne un chiffre. »

— — —

DOSSIER 1 · classé le 4 mars 1994
Sept dépositions recueillies au 12 de la rue Ndjolé.

Un locataire du troisième a quitté l'immeuble un jour de la semaine dernière, et n'y est pas revenu. Sept voisins ont été entendus. Le rapport ne conclut rien, sauf une ligne, soulignée deux fois :

    « Exactement deux de ces sept personnes mentent. »

1 · Mme ONDO — fiche F-1041
« C'était un jour de passage du camion. »
   Le camion passe le mardi et le vendredi.

2 · M. BALEP — fiche F-1042
« C'était le lendemain du jour où j'ai touché ma paie. »
   M. Balep est payé chaque jeudi.

3 · LA BOULANGÈRE — fiche F-1043
« Ma boutique était ouverte, il est passé devant. »
   La boulangerie ferme le lundi et le dimanche.

4 · LE GARDIEN — fiche F-5017
« C'était deux jours après le marché. »
   Le marché a lieu le jeudi.

5 · SŒUR MVÉ — fiche F-1045
« Au moins un des deux, Ondo ou Balep, ment. »

6 · M. TCHOUA — fiche F-1046
« C'était un jour ouvré. »

7 · AWA — fiche F-1047
« Ce n'était ni un mardi ni un mercredi. »`,

    consigne: 'Quel jour, et qui sont les deux menteurs ?',
    placeholder: 'le jour, puis les deux numéros — ex. « lundi 2 6 »',
  },

  /* Ne quitte jamais le serveur. */
  solution: {
    reponses,
    resultat: 'VENDREDI',
  },

  indices: [
    "Sept jours, vingt et une paires de menteurs possibles : cent quarante-sept combinaisons. C'est peu. Rien n'interdit de les parcourir une à une.",
    "La cinquième déposition ne parle pas du jour. Elle parle des autres dépositions. Traite-la à part : elle peut être fausse sans qu'aucune de celles qu'elle vise le soit.",
    "Suppose un instant que le gardien dise vrai, et compte combien de personnes deviennent menteuses. Tu verras que c'est beaucoup trop.",
  ],

  /* La seconde couche. Rien ne la signale au joueur. */
  anomalie: {
    ou: "Les numéros de fiche des sept témoins.",
    texte: "La fiche du gardien porte le numéro F-5017. Les six autres se suivent — F-1041, 1042, 1043, puis 1045, 1046, 1047. Il manque F-1044, et le gardien occupe sa place avec un numéro qui vient d'ailleurs. Sa déposition a été versée depuis un autre dossier.",
    reponses: [
      'F-5017', '5017', 'f5017',
      'la fiche du gardien', 'fiche du gardien', 'le numero de fiche du gardien',
      'le numero du gardien', 'numero de fiche', 'les numeros de fiche',
      'F-1044', '1044', 'il manque F-1044', 'il manque le 1044',
    ],
  },

  recompense: {
    nom: '',            // à remplir depuis /admin
    precision: '',
    gag: false,
  },

  animations: {
    mode: 'toutes',
    sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'],
  },
};

/* ------------------------------------------------------------------ */
console.log(`\nPilote : ${pilote()}`);
if (pilote() !== 'supabase') {
  console.log('\x1b[33mAttention : Supabase n\'est pas branché, ça part dans .data/fonds47.json.\x1b[0m');
}

await enregistrerDossier(dossier);
console.log(`\x1b[32m✓\x1b[0m dossier « ${dossier.titre} » versé (${reponses.length} formulations acceptées)`);

/* Le placer au jour 1 s'il n'est programmé nulle part. */
const cfg = await lireConfig();
const prog = [...(cfg.programme || [])];
if (!prog.includes(dossier.slug)) {
  if (prog[0] == null) {
    prog[0] = dossier.slug;
    await ecrireConfig({ programme: prog });
    console.log('\x1b[32m✓\x1b[0m placé au premier jour');
  } else {
    console.log(`  le premier jour est déjà pris par « ${prog[0] }» — place-le depuis /admin`);
  }
} else {
  console.log(`  déjà au programme (jour ${prog.indexOf(dossier.slug) + 1})`);
}

console.log(`
Il reste à faire depuis /admin :
  · écrire la récompense du jour 1 (elle est vide exprès)
  · vérifier le chrono de référence : 35 min
  · relire l'énoncé et le durcir si tu le trouves trop tendre

Pour le jouer tout de suite :
  SIM_DATE=${(cfg.debut || '2026-09-10')}T09:00:00+01:00 npm run dev
`);
