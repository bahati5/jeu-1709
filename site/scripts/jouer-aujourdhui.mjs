#!/usr/bin/env node
/* Déplace le jeu pour qu'il commence aujourd'hui, et remet la partie à zéro.
 *
 *   npm run aujourdhui        → tu es au jour 1
 *   npm run aujourdhui -- 5   → tu es au jour 5 (l'imposteur)
 *   npm run aujourdhui -- 8   → tu es au dernier jour, la convergence
 *
 * Pourquoi pas SIM_DATE : elle FIGE l'horloge du serveur. Les indices ne
 * s'ouvriraient jamais, le chrono resterait à zéro. Ici l'horloge est
 * réelle — le jeu se comporte exactement comme il le fera le 10.
 *
 * Pour revenir aux vraies dates : npm run aujourdhui -- --restaurer
 */
import { readFile } from 'node:fs/promises';

try {
  const txt = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  for (const l of txt.split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const { lireConfig, ecrireConfig, lireEtat, ecrireEtat, ETAT_INITIAL, pilote } =
  await import('../lib/donnees.js');

const args = process.argv.slice(2);
const restaurer = args.includes('--restaurer');
const garder = args.includes('--garder-avancement');
const jour = Math.max(1, Math.min(8, Number(args.find((a) => /^\d+$/.test(a))) || 1));

/* SIM_DATE fige l'horloge du serveur : le jeu servirait le jour de la
   simulation, pas celui d'aujourd'hui, et les indices ne s'ouvriraient
   jamais. C'est l'erreur qui fait perdre le plus de temps. */
if (process.env.SIM_DATE) {
  console.error(`
\x1b[31m  ✗ SIM_DATE est encore posée dans .env.local\x1b[0m

    valeur : ${process.env.SIM_DATE}

    Elle FIGE l'horloge du serveur. Tant qu'elle est là, le jeu servira
    le jour correspondant à cette date, les indices ne s'ouvriront jamais
    et le chrono restera à zéro.

    Commente ou supprime la ligne SIM_DATE dans site/.env.local, puis
    relance cette commande.
`);
  process.exit(1);
}

const cfg = await lireConfig();
const n = cfg.programme.length || 8;

if (restaurer) {
  await ecrireConfig({ debut: '2026-09-10', fin: '2026-09-17', heureOuverture: 6, heureVerdict: 6 });
  console.log('\n\x1b[32m✓\x1b[0m dates rétablies : 10 → 17 septembre, bascule à 6h\n');
  process.exit(0);
}

/* La date d'aujourd'hui DANS LE FUSEAU DU JEU — pas celle de la machine.
   À Libreville il est peut-être déjà demain quand il est encore hier ailleurs. */
const auj = new Intl.DateTimeFormat('en-CA', {
  timeZone: cfg.fuseau, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

const JOUR_MS = 86400000;
const decale = (iso, d) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * JOUR_MS).toISOString().slice(0, 10);

const debut = decale(auj, -(jour - 1));
const fin = decale(debut, n - 1);

await ecrireConfig({
  debut, fin,
  /* Minuit : le jour du jeu bascule en même temps que le jour civil,
     donc la journée en cours est ouverte quelle que soit l'heure qu'il est. */
  heureOuverture: 0,
  heureVerdict: 0,
});

if (!garder) await ecrireEtat({ ...ETAT_INITIAL });

const cfg2 = await lireConfig();
const slug = cfg2.programme[jour - 1];

console.log(`
\x1b[34mLe jeu commence aujourd'hui\x1b[0m  \x1b[90m(${pilote()})\x1b[0m

  premier jour   ${debut}
  dernier jour   ${fin}
  aujourd'hui    jour ${jour} sur ${n}${slug ? `  ·  ${slug}` : '  ·  aucune manche'}
  bascule        minuit, ${cfg.fuseau}
  avancement     ${garder ? 'conservé' : 'remis à zéro'}

\x1b[90mL'horloge est réelle : les indices s'ouvriront à ${(cfg.paliers || []).join(', ')} minutes
après que tu auras ouvert la manche, et le chrono tournera.\x1b[0m

  npm run dev        puis  http://localhost:3000

\x1b[90mPour sauter à un autre jour : npm run aujourdhui -- 5
Pour rétablir les vraies dates : npm run aujourdhui -- --restaurer\x1b[0m
`);
