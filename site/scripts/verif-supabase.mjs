#!/usr/bin/env node
/* Vérifie que Supabase est correctement branché ET correctement fermé.
 *
 *   node scripts/verif-supabase.mjs
 *
 * Le second point est le plus important : si la clé publique peut lire
 * la table `dossiers`, il lit les réponses des sept dossiers depuis la
 * console de son navigateur, et la semaine est morte. Ce script le teste
 * pour de vrai — il ne se contente pas de supposer que RLS est actif.
 */
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

/* Charger .env.local sans dépendance */
try {
  const txt = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  for (const ligne of txt.split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* pas de .env.local : on prend l'environnement tel quel */ }

const URL_ = process.env.SUPABASE_URL;
const SECRETE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIQUE = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'fonds47';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const ko = (m) => { console.log(`  \x1b[31m✗\x1b[0m ${m}`); echecs++; };
const info = (m) => console.log(`    \x1b[90m${m}\x1b[0m`);
let echecs = 0;

console.log('\nSUPABASE — vérification\n');

/* ---- 1. Les variables ---- */
if (!URL_) ko('SUPABASE_URL manquante');
else if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(URL_.trim()))
  ko(`SUPABASE_URL a une forme inattendue : ${URL_}`);
else ok(`URL du projet : ${URL_}`);

if (!SECRETE) {
  ko('SUPABASE_SERVICE_ROLE_KEY manquante');
} else if (SECRETE.startsWith('sb_publishable_')) {
  ko('Tu as collé la clé PUBLIABLE dans SUPABASE_SERVICE_ROLE_KEY.');
  info('Il faut la clé secrète : sb_secret_… (ou l\'ancienne service_role).');
} else if (SECRETE.startsWith('sb_secret_')) {
  ok('Clé secrète (nouveau format sb_secret_…)');
} else if (SECRETE.startsWith('eyJ')) {
  try {
    const r = JSON.parse(Buffer.from(SECRETE.split('.')[1], 'base64').toString());
    if (r.role === 'service_role') ok('Clé service_role (ancien format JWT) — valide, retirée fin 2026');
    else ko(`Cette clé JWT a le rôle « ${r.role} », pas service_role. C'est la clé anon.`);
  } catch { ko('Clé JWT illisible'); }
} else ko('Format de clé non reconnu');

if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  ko('Une clé Supabase est préfixée NEXT_PUBLIC_ : elle part au navigateur. Retire-la.');
}

if (echecs) { console.log(`\n${echecs} problème(s). Corrige .env.local et relance.\n`); process.exit(1); }

/* ---- 2. La connexion et les tables ---- */
const s = createClient(URL_.replace(/\/$/, ''), SECRETE, { auth: { persistSession: false } });

const TABLES = ['jeu_config', 'dossiers', 'etat_jeu', 'animations', 'medias'];
console.log('\nLes tables\n');
for (const t of TABLES) {
  const { error, count } = await s.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    ko(`${t} — ${error.message}`);
    if (/does not exist|schema cache/i.test(error.message))
      info('La table manque : as-tu bien exécuté TOUT lib/schema.sql dans l\'éditeur SQL ?');
  } else ok(`${t} — ${count} ligne(s)`);
}

/* ---- 3. Le bucket ---- */
console.log('\nLe stockage\n');
{
  const { data, error } = await s.storage.listBuckets();
  if (error) ko(`impossible de lister les buckets — ${error.message}`);
  else {
    const b = (data || []).find((x) => x.id === BUCKET || x.name === BUCKET);
    if (!b) { ko(`bucket « ${BUCKET} » introuvable`); info('La dernière ligne de schema.sql le crée.'); }
    else if (b.public) { ko(`le bucket « ${BUCKET} » est PUBLIC — les médias seraient lisibles sans passer par le verrou de date`); }
    else ok(`bucket « ${BUCKET} » présent et privé`);
  }
}

/* ---- 4. Le test qui compte vraiment ---- */
console.log('\nLe verrou — la clé publique peut-elle lire ?\n');
if (!PUBLIQUE) {
  info('SUPABASE_PUBLISHABLE_KEY absente de .env.local : test sauté.');
  info('Ajoute-la (elle n\'est pas secrète) pour vérifier que RLS tient vraiment.');
} else {
  const p = createClient(URL_.replace(/\/$/, ''), PUBLIQUE, { auth: { persistSession: false } });
  let fuite = false;
  for (const t of TABLES) {
    const { data, error } = await p.from(t).select('*').limit(1);
    if (!error && Array.isArray(data)) {
      ko(`la clé publique LIT « ${t} » — RLS ne protège pas cette table`);
      fuite = true;
    }
  }
  if (!fuite) ok('la clé publique ne lit aucune table. RLS tient.');
  else info('Vérifie qu\'aucune policy n\'a été créée et que RLS est bien activé sur les 5 tables.');
}

/* ---- 5. Écriture réelle ---- */
console.log('\nÉcriture\n');
{
  const essai = { id: 'essai-verif', data: { fait: new Date().toISOString() } };
  const { error: e1 } = await s.from('jeu_config').upsert(essai);
  if (e1) ko(`écriture refusée — ${e1.message}`);
  else {
    const { error: e2 } = await s.from('jeu_config').delete().eq('id', 'essai-verif');
    ok(e2 ? 'écriture ok (nettoyage échoué, sans gravité)' : 'écriture et suppression ok');
  }
}

console.log(echecs
  ? `\n\x1b[31m${echecs} problème(s).\x1b[0m Ne mets pas en ligne tant que ce n'est pas vert.\n`
  : '\n\x1b[32mTout est bon.\x1b[0m Relance `npm run dev` : la pastille de /admin doit passer au vert.\n');
process.exit(echecs ? 1 : 0);
