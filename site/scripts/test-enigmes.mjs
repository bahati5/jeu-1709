#!/usr/bin/env node
/* Vérifie que chaque énigme a bien UNE solution, et que c'est celle
 * qui est enregistrée en base.
 *
 *   node scripts/test-enigmes.mjs
 *
 * À relancer après chaque modification depuis /admin. Une énigme à deux
 * solutions n'est pas un détail : il trouvera l'autre, elle sera refusée,
 * et il passera la soirée à s'acharner sur une réponse juste.
 *
 * Les contrôles sont écrits ici parce qu'ils encodent la logique de
 * chaque énigme. Quand tu en changes une, change le contrôle avec.
 */
import { readFile } from 'node:fs/promises';

try {
  const txt = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  for (const l of txt.split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const { listerDossiers } = await import('../lib/donnees.js');
const { verifier, verifierDossier } = await import('../lib/reponses.js');

let ko = 0;
const dit = (nom, vrai, detail = '') => {
  if (vrai) console.log(`  \x1b[32m✓\x1b[0m ${nom}`);
  else { ko++; console.log(`  \x1b[31m✗\x1b[0m ${nom}${detail ? `\n      ${detail}` : ''}`); }
};

const dossiers = Object.fromEntries((await listerDossiers()).map((d) => [d.slug, d]));
const accepte = (slug, s) => dossiers[slug] && verifier(dossiers[slug].solution, s);

/* ---------------------------------------------------------------- */
console.log('\nUNICITÉ DES SOLUTIONS\n');

/* J1 — sept témoins, exactement deux menteurs */
{
  const J = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const T = [
    ['1', (j) => ['mardi', 'vendredi'].includes(j)],
    ['2', (j) => j === 'vendredi'],
    ['3', (j) => !['lundi', 'dimanche'].includes(j)],
    ['4', (j) => j === 'samedi'],
    ['5', (j, M) => M.has('1') || M.has('2')],
    ['6', (j) => !['samedi', 'dimanche'].includes(j)],
    ['7', (j) => !['mardi', 'mercredi'].includes(j)],
  ];
  const noms = T.map(([n]) => n);
  const sols = [];
  for (const j of J) {
    for (let a = 0; a < noms.length; a++) for (let b = a + 1; b < noms.length; b++) {
      const M = new Set([noms[a], noms[b]]);
      if (T.every(([n, f]) => f(j, M) !== M.has(n))) sols.push([j, [...M].join(' ')]);
    }
  }
  dit(`J1 · une seule solution sur les 147 combinaisons`, sols.length === 1, `${sols.length} : ${JSON.stringify(sols)}`);
  if (sols.length === 1) dit('J1 · la base accepte cette solution', accepte('camion-ordures', `${sols[0][0]} ${sols[0][1]}`));
}

/* J2 — interpolation sur le registre du faussaire */
{
  const an = 1994 + 3 / 12 + (726 - 60) / 120;
  dit('J2 · le n° 726 tombe en 1999', Math.floor(an) === 1999, `donne ${an.toFixed(2)}`);
  dit('J2 · la base accepte « 1999 »', accepte('le-masque', '1999'));
}

/* J3 — Vigenère de clé MARAUDEUR */
{
  const d = dossiers['le-parchemin'];
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const dechiffre = (txt, cle) => {
    let k = 0;
    return [...txt].map((c) => {
      if (!/[A-Z]/.test(c)) return c;
      const v = (c.charCodeAt(0) - 65 - (cle.charCodeAt(k++ % cle.length) - 65) + 26) % 26;
      return String.fromCharCode(65 + v);
    }).join('');
  };
  const clair = dechiffre(strip(d?.solution?.revele || ''), 'MARAUDEUR');
  dit('J3 · MARAUDEUR déchiffre bien le parchemin', clair.includes('BALANCE') && clair.includes('VIERGE'), clair.slice(0, 70));
  dit('J3 · le mois n\'est jamais écrit en clair', !clair.includes('SEPTEMBRE'), clair.slice(0, 70));
  dit('J3 · la base accepte « septembre »', accepte('le-parchemin', 'septembre'));
}

/* J4 — la période maquillée se distingue par sa régularité, pas par sa moyenne */
{
  const R = (dossiers['jours-creux']?.payload?.enonce || '')
    .split('\n').map((l) => l.match(/^\s+(\d+) → (\d+)$/)).filter(Boolean)
    .map((m) => [Number(m[1]), Number(m[2])]);
  const inc = R.slice(1).map(([j, v], i) => [j, v - R[i][1]]);
  const st = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length;
                      return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
  const moy = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const tr = (a, b) => inc.filter(([j]) => j >= a && j <= b).map(([, v]) => v);
  const autres = inc.filter(([j]) => !(j >= 13 && j <= 19) && !(j >= 6 && j <= 8)).map(([, v]) => v);

  dit('J4 · trente relevés lus depuis la base', R.length === 30, `${R.length}`);
  dit('J4 · la période 12-19 est trop régulière', st(tr(13, 19)) < 2, `écart-type ${st(tr(13, 19)).toFixed(2)}`);
  dit('J4 · le reste respire normalement', st(autres) > 25, `écart-type ${st(autres).toFixed(1)}`);
  dit('J4 · sa moyenne est pourtant normale (le piège tient)', moy(tr(13, 19)) > 85 && moy(tr(13, 19)) < 110, `${moy(tr(13, 19)).toFixed(0)}`);
  dit('J4 · le pont 5-8 est un leurre visible', moy(tr(6, 8)) < 45, `${moy(tr(6, 8)).toFixed(0)}`);
  dit('J4 · la base accepte « du 12 au 19 »', accepte('jours-creux', 'du 12 au 19'));
}

/* J6 — hex → ROT13 */
{
  const hex = (dossiers['le-scelle']?.payload?.enonce || '').match(/([0-9a-f]{40,})/)?.[1] || '';
  const txt = Buffer.from(hex, 'hex').toString();
  const rot = txt.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode((c <= 'Z' ? 90 : 122) >= c.charCodeAt(0) + 13 ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13));
  dit('J6 · la chaîne hex donne ARRETE 561', rot.startsWith('ARRETE 561'), rot);
  dit('J6 · la base accepte « 561 »', accepte('le-scelle', '561'));
}

/* J7 — la grille de déduction */
{
  const G = ['MENGUE', 'BEKALE', 'NZE', 'OYONO', 'ABESSOLO'];
  const H = ['03h30', '03h50', '04h10', '04h30', '04h50'];
  const perms = (a) => a.length <= 1 ? [a]
    : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  const sols = [];
  for (const p of perms([0, 1, 2, 3, 4])) {
    const P = Object.fromEntries(G.map((g, i) => [g, p[i]]));
    if (![0, 4].includes(P.ABESSOLO)) continue;
    if (P.BEKALE - P.MENGUE !== 2) continue;
    if (P.OYONO >= P.NZE || P.NZE - P.OYONO === 1) continue;
    if (P.MENGUE === 0) continue;
    if (P.BEKALE !== 4) continue;
    for (const cle of G) {
      if (['NZE', 'ABESSOLO'].includes(cle)) continue;
      if ([0, 4].includes(P[cle])) continue;
      if (P[cle] <= P.OYONO) continue;                 // la 10e contrainte
      sols.push(H[P[cle]]);
    }
  }
  dit('J7 · la grille a une solution unique', sols.length === 1, `${sols.length} : ${JSON.stringify(sols)}`);
  if (sols.length === 1) {
    dit('J7 · et c\'est bien 04h10', sols[0] === '04h10', sols[0]);
    dit('J7 · la base accepte « 04h10 »', accepte('quatre-heures-dix', '04h10'));
  }
}

/* J8 — la convergence */
{
  const vendredis = [];
  for (let d = 1; d <= 30; d++) if (new Date(Date.UTC(1999, 8, d)).getUTCDay() === 5) vendredis.push(d);
  const dans = vendredis.filter((d) => d >= 12 && d <= 19);
  dit('J8 · les vendredis de septembre 1999 sont 3, 10, 17, 24', JSON.stringify(vendredis) === '[3,10,17,24]', JSON.stringify(vendredis));
  dit('J8 · un seul tombe entre le 12 et le 19', dans.length === 1 && dans[0] === 17, JSON.stringify(dans));
  dit('J8 · la base accepte « 17091999 »', accepte('l-enveloppe', '17091999'));
}

/* ---------------------------------------------------------------- */
console.log('\nTOLÉRANCE DE SAISIE\n');
for (const [slug, variantes] of Object.entries({
  'camion-ordures': ['  Vendredi 5 4 ', 'VENDREDI 4 ET 5', 'vendredi, gardien et Mvé',
                     'Vendredi — le gardien et Sœur Mvé', 'vendredi mve gardien'],
  'jours-creux': ['12 19', 'DU 12 AU 19', '12-19'],
  'quatre-heures-dix': ['04h10', '4:10', 'quatre heures dix'],
  'l-enveloppe': ['17091999', '17/09/1999', '17 09 1999'],
})) {
  for (const v of variantes) dit(`${slug} accepte « ${v.trim()} »`, accepte(slug, v));
}

/* ---------------------------------------------------------------- */
console.log('\nCE QUI DOIT RESTER VIDE\n');
for (const d of Object.values(dossiers)) {
  if (d.recompense?.nom) console.log(`  \x1b[90m·\x1b[0m ${d.slug} : récompense écrite`);
}
const vides = Object.values(dossiers).filter((d) => !d.recompense?.nom);
if (vides.length) console.log(`  \x1b[33m⚠\x1b[0m ${vides.length} récompense(s) encore vides : ${vides.map((d) => d.slug).join(', ')}`);

/* ------------------------------------------------------------------ */
/*  Ce que le CLIENT envoie vraiment                                   */
/*                                                                     */
/*  Le jour 5 a été rejeté en conditions réelles : sur une manche       */
/*  « imposteur », le joueur désigne une déposition, et le client       */
/*  envoie le texte ENTIER de cette déposition — pas le nom écrit dans  */
/*  les réponses acceptées. Le test ci-dessous rejoue ce geste-là.      */
/* ------------------------------------------------------------------ */

console.log('\nCE QUE LE CLIENT ENVOIE\n');

for (const d of await listerDossiers()) {
  if (d.type !== 'imposteur') continue;
  const decl = d.payload?.declarations || [];
  const idx = d.solution?.imposteur;

  if (!Number.isInteger(idx) || !decl[idx]) {
    console.log(`  \x1b[31m✗\x1b[0m ${d.slug} : pas d'index d'imposteur exploitable`);
    ko++;
    continue;
  }

  /* On appelle la MÊME fonction que /api/verify, pas une copie. */
  const envoye = decl[idx];
  const acceptee = verifierDossier(d, envoye);

  if (acceptee) {
    console.log(`  \x1b[32m✓\x1b[0m ${d.slug} : la désignation de « ${envoye.slice(0, 18)}… » est acceptée`);
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${d.slug} : désigner l'imposteur donne REJETÉ`);
    ko++;
  }

  /* Et désigner quelqu'un d'autre doit bien être refusé. */
  const autre = decl.find((_, k) => k !== idx);
  if (autre && verifierDossier(d, autre)) {
    console.log(`  \x1b[31m✗\x1b[0m ${d.slug} : une mauvaise désignation passe aussi`);
    ko++;
  } else {
    console.log(`  \x1b[32m✓\x1b[0m ${d.slug} : une mauvaise désignation est refusée`);
  }
}

console.log(ko
  ? `\n\x1b[31m${ko} problème(s).\x1b[0m Une énigme à deux solutions le fera s'acharner sur une réponse juste.\n`
  : `\n\x1b[32mToutes les énigmes ont une solution unique, et la base l'accepte.\x1b[0m\n`);
process.exit(ko ? 1 : 0);
