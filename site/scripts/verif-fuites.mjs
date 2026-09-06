#!/usr/bin/env node
/* Vérifie qu'aucune chaîne secrète n'atteint le navigateur.
 *
 * Il est dev-devops : il ouvrira les devtools et lira le bundle. Une seule
 * fuite tue la semaine entière. Ce script tire les secrets de la BASE — pas
 * d'une liste écrite à la main qui se périmerait au premier dossier ajouté —
 * et les cherche dans tout ce que Next sert au client.
 *
 *   node scripts/verif-fuites.mjs        (après `npm run build`)
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

process.env.NODE_ENV ||= 'production';
const { listerDossiers, lireConfig } = await import('../lib/donnees.js');

/* ---- 1. Ce qui ne doit jamais sortir ---- */
const secrets = new Map();          // chaîne -> d'où elle vient
const ajouter = (v, source) => {
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.length >= 4) secrets.set(t, source);
  } else if (Array.isArray(v)) v.forEach((x) => ajouter(x, source));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => ajouter(x, source));
};

const dossiers = await listerDossiers();
for (const d of dossiers) {
  ajouter(d.solution, `solution de « ${d.titre || d.slug} »`);
  ajouter(d.anomalie, `anomalie de « ${d.titre || d.slug} »`);
  ajouter(d.recompense, `récompense de « ${d.titre || d.slug} »`);
  /* Les énoncés des jours futurs ne doivent pas non plus fuiter. */
  ajouter(d.payload?.enonce, `énoncé de « ${d.titre || d.slug} »`);
  ajouter(d.indices, `indices de « ${d.titre || d.slug} »`);
}
const cfg = await lireConfig();
ajouter(cfg.codeFinal, 'code final');
ajouter(cfg.lettreFinale, 'lettre du 17');
ajouter(cfg.lettreFinaleAnomalies, 'lettre du 17 (variante)');

/* Les variables d'environnement sensibles, tant qu'à faire. */
for (const c of ['SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_TOKEN', 'JOUEUR_TOKEN']) {
  if (process.env[c]) secrets.set(process.env[c], `variable ${c}`);
}

if (!secrets.size) {
  console.log('Aucun secret en base : rien à vérifier. Remplis un dossier d\'abord.');
  process.exit(0);
}

/* ---- 2. Tout ce que le navigateur peut voir ---- */
const racine = path.join(process.cwd(), '.next');
async function fichiersClient(dir, acc = []) {
  let entrees;
  try { entrees = await readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrees) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'cache' || e.name === 'server') continue;   // jamais servi
      await fichiersClient(p, acc);
    } else if (/\.(js|mjs|css|json|html|txt|map)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

const fichiers = await fichiersClient(racine);
if (!fichiers.length) {
  console.error('Pas de build trouvé. Lance `npm run build` d\'abord.');
  process.exit(1);
}

/* ---- 3. La chasse ---- */
const trouvees = [];
for (const f of fichiers) {
  const texte = await readFile(f, 'utf8').catch(() => '');
  if (!texte) continue;
  for (const [s, source] of secrets) {
    if (texte.includes(s)) {
      trouvees.push({ fichier: path.relative(process.cwd(), f), secret: s.slice(0, 40), source });
    }
  }
}

const octets = (await Promise.all(fichiers.map((f) => stat(f).then((s) => s.size).catch(() => 0))))
  .reduce((a, b) => a + b, 0);

console.log(`${secrets.size} chaînes secrètes cherchées dans ${fichiers.length} fichiers (${Math.round(octets / 1024)} Ko servis au client).`);

if (trouvees.length) {
  console.error('\nFUITE — ces chaînes atteignent le navigateur :\n');
  for (const t of trouvees) console.error(`  ${t.fichier}\n    ${t.source} : « ${t.secret}… »`);
  console.error('\nNe déploie pas.');
  process.exit(1);
}

console.log('Aucune fuite. Le bundle est propre.');
