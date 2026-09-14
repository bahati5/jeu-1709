#!/usr/bin/env node
/* Restaure la progression perdue le 14 septembre 2026.
 *
 *   node scripts/restaurer-progression.mjs            (montre, n'écrit pas)
 *   node scripts/restaurer-progression.mjs --ecrire   (écrit pour de vrai)
 *
 * Il a joué du jeudi 10 au lundi 14, sauf le dimanche 13. Une lecture
 * d'etat_jeu tombée en panne a rendu un état vierge, que muterEtat a
 * réécrit par-dessus : resolus s'est vidé. Le trou est bouché dans
 * lib/donnees.js — ce script remet ce qu'il avait gagné.
 *
 * Le dimanche 13 reste VOLONTAIREMENT absent de `resolus` : c'est lui
 * que l'encart doré lui proposera de reprendre.
 *
 * Ce script ne touche QUE la ligne etat_jeu. Il ne touche ni la config,
 * ni les dossiers. Il sauvegarde l'existant avant d'écrire.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

/* Les clés viennent de .env.local, puis de .env. Jamais écrites ici. */
for (const nom of ['../.env.local', '../.env']) {
  try {
    const txt = await readFile(new URL(nom, import.meta.url), 'utf8');
    for (const l of txt.split('\n')) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* le fichier peut ne pas exister */ }
}

const URL_ = process.env.SUPABASE_URL;
const CLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !CLE) {
  console.error('\n  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.');
  console.error('  Renseigne les DEUX dans site/.env — ton .env a une URL vide.\n');
  process.exit(1);
}

const ecrire = process.argv.includes('--ecrire');
const s = createClient(URL_, CLE, { auth: { persistSession: false } });

/* Ce qu'il a résolu. Le dimanche 13 n'y est pas : c'est le rattrapage. */
const JOURS = [
  ['camion-ordures', '2026-09-10', 'jeudi'],
  ['le-masque', '2026-09-11', 'vendredi'],
  ['le-parchemin', '2026-09-12', 'samedi'],
  ['imposteur', '2026-09-14', 'lundi'],
];

const { data: avant, error: eLire } = await s
  .from('etat_jeu').select('data').eq('id', 'principal').maybeSingle();
if (eLire) { console.error('lecture impossible :', eLire.message); process.exit(1); }

const { data: dossiers, error: eDos } = await s
  .from('dossiers').select('slug, titre, type, solution');
if (eDos) { console.error('lecture des dossiers impossible :', eDos.message); process.exit(1); }
const par = Object.fromEntries(dossiers.map((d) => [d.slug, d]));

const resolus = {};
for (const [slug, date] of JOURS) {
  const d = par[slug];
  if (!d) { console.error(`dossier introuvable : ${slug}`); process.exit(1); }
  resolus[slug] = {
    at: `${date}T19:00:00.000Z`,
    /* Ses vrais chronos sont perdus. `null` fait que le tableau n'affiche
       aucune durée, plutôt qu'un chiffre inventé. */
    minutes: null,
    resultat: d.solution?.resultat || d.solution?.reponses?.[0] || '',
  };
}

/* Le carnet fermé est une serrure : il l'avait ouverte pour résoudre. */
const serrures = { ...(avant?.data?.serrures || {}) };
for (const [slug] of JOURS) if (par[slug]?.type === 'serrure') serrures[slug] = true;

const suivant = { ...(avant?.data || {}), resolus, serrures };

console.log('\nAVANT');
console.log('  resolus :', JSON.stringify(Object.keys(avant?.data?.resolus || {})));
console.log('\nAPRÈS');
for (const [slug, date, jour] of JOURS) {
  console.log(`  ${date} ${jour.padEnd(9)} ${slug.padEnd(16)} « ${resolus[slug].resultat} »`);
}
console.log(`  2026-09-13 dimanche  jours-creux      ← LAISSÉ OUVERT (rattrapage)`);

if (!ecrire) {
  console.log('\n  Essai à blanc. Rien n’a été écrit.');
  console.log('  Pour écrire :  node scripts/restaurer-progression.mjs --ecrire\n');
  process.exit(0);
}

const sauvegarde = new URL('../.data-sauvegarde-etat_jeu.json', import.meta.url);
await writeFile(sauvegarde, JSON.stringify(avant?.data ?? null, null, 2));
console.log('\n  sauvegarde de l’ancien état :', sauvegarde.pathname);

const { error } = await s.from('etat_jeu').upsert({ id: 'principal', data: suivant });
if (error) { console.error('  ÉCHEC :', error.message); process.exit(1); }

const { data: relu } = await s.from('etat_jeu').select('data').eq('id', 'principal').single();
console.log('  relu en base :', JSON.stringify(Object.keys(relu.data.resolus)));
console.log('\n  Fait. Les scellés affichent 4/8, et dimanche l’attend.\n');
