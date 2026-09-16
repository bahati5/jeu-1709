#!/usr/bin/env node
/* Le dossier 6 devient une pièce à reconstituer.
 *
 *   npm run puzzle6
 *
 * Pourquoi : l'énigme d'origine (hex → ROT13) demandait deux conversions
 * que rien, dans le jeu, n'apprend à faire. Le joueur pouvait rester
 * bloqué indéfiniment devant une chaîne de chiffres.
 *
 * Ce que ça change : la manche passe du type `saisie` au type `assemblage`.
 * Le scan de l'arrêté a été déchiré en six morceaux ; le joueur les remet
 * dans l'ordre et LIT le numéro. Le champ de réponse n'apparaît qu'une
 * fois la pièce reconstituée — c'est le comportement natif du type.
 *
 * Ce qui ne change pas : la réponse reste 561, l'anomalie reste le champ
 * `Artist`, l'EXIF reste dans l'énoncé (le J7 et le J8 s'y appuient). Le
 * décodage devient un second chemin vers la même réponse, pour qui
 * préfère décoder plutôt que reconstituer.
 *
 * N'écrit QUE le dossier `le-scelle` et son média. La progression du
 * joueur vit dans une autre table : elle n'est pas touchée.
 */
import { readFile } from 'node:fs/promises';

/* `--local` ignore les clés Supabase et travaille sur .data/fonds47.json :
   de quoi essayer la manche sur sa machine sans toucher à la partie en cours. */
const LOCAL = process.argv.includes('--local');

for (const f of LOCAL ? [] : ['../.env', '../.env.local']) {
  try {
    const txt = await readFile(new URL(f, import.meta.url), 'utf8');
    for (const l of txt.split('\n')) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}

const { enregistrerMedia, enregistrerDossier, lireDossier, pilote } =
  await import('../lib/donnees.js');

const SLUG = 'le-scelle';
const NOM_MEDIA = 'piece_06.svg';
const COLONNES = 3, LIGNES = 2;

/* ------------------------------------------------------------------ */
/*  Le scan de l'arrêté.                                               */
/*                                                                     */
/*  900 × 600, découpé en 3 × 2 morceaux de 300 × 300. Le numéro est    */
/*  posé à cheval sur les trois morceaux du bas et mord la couture      */
/*  horizontale : aucun fragment ne le livre seul.                      */
/* ------------------------------------------------------------------ */

const barre = (y, x1, x2, o = 0.5) =>
  `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="3.5" rx="1.5" fill="#2e2a22" opacity="${o}"/>`;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="papier" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#efe7d2"/>
      <stop offset="0.5" stop-color="#e7dcc2"/>
      <stop offset="1" stop-color="#ddd0b2"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="b"/>
      <feColorMatrix in="b" type="saturate" values="0"/>
      <feBlend in2="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>

  <rect width="900" height="600" fill="url(#papier)"/>
  <rect width="900" height="600" fill="url(#papier)" filter="url(#grain)" opacity="0.14"/>

  <!-- taches d'humidité : chaque morceau porte sa marque -->
  <ellipse cx="120" cy="90"  rx="70"  ry="48" fill="#b9a67c" opacity="0.13"/>
  <ellipse cx="760" cy="150" rx="95"  ry="60" fill="#a8946a" opacity="0.10"/>
  <ellipse cx="430" cy="520" rx="110" ry="44" fill="#b9a67c" opacity="0.09"/>

  <rect x="26" y="26" width="848" height="548" fill="none" stroke="#5c5140" stroke-width="2.5" opacity="0.65"/>
  <rect x="36" y="36" width="828" height="528" fill="none" stroke="#5c5140" stroke-width="1" opacity="0.4"/>

  <!-- en-tête : morceaux haut-gauche et haut-centre -->
  <text x="450" y="86" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="21" letter-spacing="6" fill="#3a3327">RÉPUBLIQUE GABONAISE</text>
  <text x="450" y="114" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="13.5" letter-spacing="3.5" fill="#5c5140">PRÉFECTURE DE L'ESTUAIRE — DIRECTION DE LA SANTÉ</text>
  <rect x="330" y="132" width="240" height="1.6" fill="#5c5140" opacity="0.7"/>

  <!-- le numéro : à cheval sur la couture du bas et sur les trois colonnes -->
  <text x="450" y="322" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="76" letter-spacing="10" font-weight="bold" fill="#241f18">ARRÊTÉ N° 561</text>
  <text x="450" y="366" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="24" letter-spacing="5" fill="#3a3327">du 10 septembre 1999</text>

  <!-- corps : réparti pour qu'aucun morceau ne soit vide -->
  <text x="70" y="196" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="#3a3327">Le Préfet de l'Estuaire,</text>
  <text x="70" y="228" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="#3a3327">Vu le rapport d'inspection sanitaire du 8 septembre 1999,</text>
  <text x="70" y="256" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="#3a3327">Vu l'avis de la commission d'hygiène,</text>

  <text x="70" y="424" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="#3a3327">ARTICLE PREMIER — La maternité Sainte-Odile est fermée</text>
  <text x="70" y="452" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="#3a3327">au public du 12 au 19 septembre 1999 inclus.</text>
  ${barre(480, 70, 520, 0.38)}
  ${barre(498, 70, 430, 0.3)}

  <!-- tampon : morceau bas-droite -->
  <g transform="translate(736 452) rotate(-13)">
    <circle r="82" fill="none" stroke="#6b2b22" stroke-width="4.5" opacity="0.62"/>
    <circle r="70" fill="none" stroke="#6b2b22" stroke-width="1.6" opacity="0.5"/>
    <text y="-22" text-anchor="middle" font-family="Georgia, serif" font-size="13"
          letter-spacing="2.5" fill="#6b2b22" opacity="0.72">PRÉFECTURE</text>
    <!-- surtout pas le numéro ici : un seul fragment le livrerait -->
    <text y="6" text-anchor="middle" font-family="Georgia, serif" font-size="18"
          font-weight="bold" letter-spacing="1.5" fill="#6b2b22" opacity="0.78">ESTUAIRE</text>
    <text y="30" text-anchor="middle" font-family="Georgia, serif" font-size="12"
          letter-spacing="2" fill="#6b2b22" opacity="0.7">10 · 09 · 1999</text>
  </g>

  <!-- mention de classement : morceau haut-droite -->
  <g transform="translate(700 172) rotate(-8)">
    <rect x="-96" y="-24" width="192" height="48" fill="none" stroke="#6b2b22"
          stroke-width="2.5" opacity="0.55"/>
    <text y="8" text-anchor="middle" font-family="Georgia, serif" font-size="19"
          letter-spacing="3" fill="#6b2b22" opacity="0.7">CARTON 47</text>
  </g>

  <!-- signature : morceau bas-gauche -->
  <text x="70" y="540" font-family="Georgia, 'Times New Roman', serif" font-size="14"
        letter-spacing="1.5" fill="#5c5140" opacity="0.85">Pour le Préfet, le Secrétaire général</text>
  <path d="M 72 524 q 26 -22 46 -4 t 40 -10 q 18 -6 30 8" fill="none"
        stroke="#2c3a52" stroke-width="2.6" opacity="0.7" stroke-linecap="round"/>

  <!-- les coutures du déchirement -->
  <path d="M 300 0 V 600 M 600 0 V 600 M 0 300 H 900" fill="none"
        stroke="#8a7a58" stroke-width="1" opacity="0.22" stroke-dasharray="7 9"/>
</svg>`;

/* ------------------------------------------------------------------ */

const ENONCE = `Vous ne demandez plus la permission. Vous forcez le scellé et vous remontez au dossier personnel d'Okoumé.

    CONSEIL DE DISCIPLINE — 2019
    M. Okoumé, greffier, radié pour refus caractérisé
    d'exécuter l'ordre de destruction du carton 47.

Vous relisez trois fois. Il n'a jamais voulu détruire le dossier. Il a été radié pour avoir refusé de le faire.

Puis Mme Ondo, direction des archives, en-tête officiel, deux lignes :

    « Mlle Ruth Ekomi a été mise à pied à titre conservatoire le 14 septembre,
      à la suite d'un accès non autorisé au fonds 47. Nous vous saurions gré
      de cesser toute sollicitation. »

C'est vous qui lui aviez demandé de scanner le cliché.

Balep, le même soir : « la dame m'a demandé qui venait la nuit. j'ai dit. désolé chef. »

Okoumé, 03h50 :

    vous êtes allé trop loin maintenant
    si vous vous arrêtez là ils reprendront le dossier et le brûleront
    et elle sera tranquille
    si vous continuez vous la trouverez
    je ne vous aiderai plus mais je ne vous empêcherai plus
    choisissez vite il reste deux jours

Elle.

— — —

DOSSIER 6 · scellé numérique

Une photographie versée au dossier. On n'en a gardé que les métadonnées :

    Artist            : C. NZE
    DateTimeOriginal  : 1999:09:10 08:12:44
    ImageDescription  : 4e4545524752203536312051482031302046524347525a4f4552

Sur la chemise, une phrase :

    « La clé est dans l'image, pas sur l'image. »

Ruth avait scanné la pièce avant d'être mise à pied. Okoumé l'a sortie du
scellé cette nuit — en six morceaux, versés en vrac : le document avait été
déchiré avant d'être classé.

Remettez-le en place. Deux morceaux s'échangent d'un toucher.`;

const INDICES = [
  "Le champ Artist est un nom. Un nom n'est pas une clé — et celui-là, vous l'avez déjà vu hier.",
  "Commencez par le haut : « RÉPUBLIQUE GABONAISE » se lit au centre de la première ligne, l'encadré « CARTON 47 » se range à sa droite.",
  "Le tampon rouge va en bas à droite, la signature en bas à gauche. Ce qui reste entre les deux porte le numéro — c'est celui qu'on vous demande.",
];

/* `--apercu <chemin>` écrit le scan sur le disque et s'arrête là : de quoi
   regarder la pièce, et les six morceaux, sans rien toucher en base. */
const iApercu = process.argv.indexOf('--apercu');
if (iApercu !== -1) {
  const { writeFile } = await import('node:fs/promises');
  const dest = process.argv[iApercu + 1] || 'piece_06.svg';
  await writeFile(dest, SVG, 'utf8');
  console.log(`\x1b[32m✓\x1b[0m aperçu écrit : ${dest} — rien n'a été versé en base.`);
  process.exit(0);
}

console.log(`\nPilote : ${pilote()}`);

const actuel = await lireDossier(SLUG);
if (!actuel) {
  console.error(`\x1b[31m✗\x1b[0m dossier « ${SLUG} » introuvable. Lance d'abord npm run semer.`);
  process.exit(1);
}

const media = await enregistrerMedia({
  nom: NOM_MEDIA,
  octets: Buffer.from(SVG, 'utf8'),
  mime: 'image/svg+xml',
  dossierSlug: SLUG,
});
console.log(`\x1b[32m✓\x1b[0m média ${media.nom} (${media.taille} octets) attaché à ${SLUG}`);

await enregistrerDossier({
  ...actuel,
  type: 'assemblage',
  payload: {
    enonce: ENONCE,
    media: NOM_MEDIA,
    colonnes: COLONNES,
    lignes: LIGNES,
    consigne: 'Le numéro du document.',
    placeholder: 'un nombre',
  },
  indices: INDICES,
  animations: { mode: 'toutes', sequence: ['assemblage_ok', 'tampon_ok', 'sceau', 'chrono', 'recompense'] },
});

console.log(`\x1b[32m✓\x1b[0m dossier 6 · ${actuel.titre} — type ${actuel.type} → assemblage (${COLONNES}×${LIGNES})`);
console.log(`\x1b[90m  réponse inchangée   : ${(actuel.solution?.reponses || []).join(', ')}\x1b[0m`);
console.log(`\x1b[90m  anomalie inchangée  : ${actuel.anomalie?.ou || '—'}\x1b[0m`);
console.log(`\x1b[90m  progression du joueur : intacte (table séparée)\x1b[0m\n`);
