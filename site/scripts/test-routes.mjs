/* Les routes, interrogées pour de vrai.
 *
 * Ce fichier existe à cause d'une panne qui a atteint la production : en
 * factorisant la vérification des réponses, un import encore utilisé par
 * l'anomalie avait disparu. `next build` ne dit rien — une route n'est
 * exécutée que quand on l'appelle — et le signalement d'anomalie renvoyait
 * 500 en silence.
 *
 *   npm run dev        (dans un autre terminal)
 *   npm run routes
 *
 * Chaque appel ici est un geste que le joueur fait vraiment.
 */
const BASE = process.env.BASE || 'http://localhost:3000';
const MDP = process.env.ADMIN_MDP;

let ko = 0;
const vert = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const rouge = (m) => { console.log(`  \x1b[31m✗\x1b[0m ${m}`); ko++; };
const gris = (m) => console.log(`    \x1b[90m${m}\x1b[0m`);

let cookie = '';
async function appel(chemin, { methode = 'GET', corps } = {}) {
  const r = await fetch(BASE + chemin, {
    method: methode,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: corps ? JSON.stringify(corps) : undefined,
    redirect: 'manual',
  });
  const set = r.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const texte = await r.text();
  let json = null; try { json = JSON.parse(texte); } catch { /* pas du JSON */ }
  return { statut: r.status, json, texte };
}

/* Aucune route ne doit jamais répondre 5xx : c'est le seul code qui dit
   « le serveur s'est cassé ». 404 est une réponse, 500 est une panne. */
const jamais500 = (nom, r) => {
  if (r.statut >= 500) { rouge(`${nom} → ${r.statut} — le serveur s'est cassé`); gris(r.texte.slice(0, 300)); return false; }
  return true;
};

console.log(`\nLES ROUTES — ${BASE}\n`);

if (!MDP) {
  console.log('  \x1b[31m✗\x1b[0m ADMIN_MDP absent de l\'environnement.');
  gris('  ADMIN_MDP="…" npm run routes    (ou lance-le depuis un shell qui a .env.local)');
  process.exit(1);
}

/* --- 1 · la porte --- */
const mauvais = await appel('/api/connexion', { methode: 'POST', corps: { mdp: 'pas le bon' } });
jamais500('connexion (mauvais mot de passe)', mauvais);
if (mauvais.json?.ok === false) vert('un mauvais mot de passe est refusé');
else rouge('un mauvais mot de passe passe');

const bon = await appel('/api/connexion', { methode: 'POST', corps: { mdp: MDP } });
if (bon.json?.ok) vert('le bon mot de passe ouvre la console');
else { rouge('le bon mot de passe est refusé — ADMIN_MDP ne correspond pas au serveur'); process.exit(1); }

const adm = await appel('/api/admin');
jamais500('/api/admin', adm);
if (adm.statut === 200) vert('/api/admin répond');
else rouge(`/api/admin → ${adm.statut}`);
if (adm.json?.panne) { rouge('la base ne répond pas : ' + adm.json.panne.message); process.exit(1); }

/* --- 2 · on se place sur chaque jour et on rejoue les gestes du joueur --- */
await appel('/api/repetition', { methode: 'POST', corps: { action: 'essai.debut' } });
const total = (adm.json?.config?.programme || []).filter(Boolean).length || 8;

for (let j = 1; j <= total; j++) {
  await appel('/api/repetition', { methode: 'POST', corps: { action: 'jour', jour: j } });
  await appel('/api/repetition', { methode: 'POST', corps: { action: 'manche.raz' } });

  const etat = await appel('/api/etat');
  if (!jamais500(`/api/etat (jour ${j})`, etat)) continue;
  const m = etat.json?.manche;
  if (!m) { gris(`jour ${j} : pas de manche`); continue; }

  const cle = await appel('/api/repetition', { methode: 'POST', corps: { action: 'reponse' } });
  const { reponse, passe, anomalie } = cle.json || {};

  console.log(`\x1b[90m  jour ${j} · ${m.slug} (${m.type})\x1b[0m`);

  /* ouvrir la manche */
  const ouvre = await appel('/api/ouvrir', { methode: 'POST', corps: { slug: m.slug } });
  jamais500('  ouvrir', ouvre) && vert('  la manche s\'ouvre');

  /* demander un indice */
  await appel('/api/repetition', { methode: 'POST', corps: { action: 'paliers', zero: true } });
  const ind = await appel('/api/indice', { methode: 'POST', corps: { slug: m.slug } });
  if (jamais500('  indice', ind)) {
    if (ind.json?.ok && ind.json.texte) vert('  un indice se demande');
    else rouge(`  l'indice ne vient pas (${JSON.stringify(ind.json)})`);
  }

  /* une mauvaise réponse */
  const faux = await appel('/api/verify', { methode: 'POST', corps: { slug: m.slug, saisie: 'zzz pas ça zzz' } });
  if (jamais500('  mauvaise réponse', faux)) {
    if (faux.json?.ok === false) vert('  une mauvaise réponse est rejetée');
    else rouge('  une mauvaise réponse passe');
  }

  /* la phrase de passe, s'il y en a une */
  if (passe) {
    const p = await appel('/api/verify', { methode: 'POST', corps: { slug: m.slug, quoi: 'passe', saisie: passe } });
    if (jamais500('  passe', p)) {
      if (p.json?.ok) vert('  la phrase de passe ouvre le texte');
      else rouge('  la phrase de passe est refusée');
    }
  }

  /* l'anomalie — celle qui a cassé en silence */
  if (anomalie) {
    const a = await appel('/api/verify', { methode: 'POST', corps: { slug: m.slug, quoi: 'anomalie', saisie: anomalie } });
    if (jamais500('  anomalie', a)) {
      if (a.json?.ok && a.json.texte) vert('  l\'anomalie est acceptée et rend son texte');
      else rouge(`  l'anomalie « ${anomalie} » ne passe pas (${JSON.stringify(a.json)})`);
    }
  }

  /* la bonne réponse — pour une manche « imposteur », on DÉSIGNE, comme le client */
  let envoi = reponse;
  if (m.type === 'imposteur') {
    const decl = m.payload?.declarations || [];
    const trouve = decl.find((t) => t.toLowerCase().includes(String(reponse).toLowerCase()));
    if (trouve) envoi = trouve;
    else gris('  (pas de déposition correspondante, on envoie le nom)');
  }
  const juste = await appel('/api/verify', { methode: 'POST', corps: { slug: m.slug, saisie: envoi } });
  if (jamais500('  bonne réponse', juste)) {
    if (juste.json?.ok) vert('  la bonne réponse est acceptée');
    else rouge(`  la bonne réponse est REJETÉE (envoyé : « ${String(envoi).slice(0, 40)}… »)`);
  }
}

/* --- 3 · le final : l'enveloppe et le code du dernier jour --- */
console.log('\n\x1b[90m  le dernier jour\x1b[0m');
{
  await appel('/api/repetition', { methode: 'POST', corps: { action: 'jour', jour: total } });
  const etat = await appel('/api/etat');
  const v = etat.json?.verdict;

  if (!v?.ouvert) {
    rouge("  l'enveloppe ne s'ouvre pas alors que le dernier dossier est résolu");
  } else {
    vert("  l'enveloppe s'ouvre");
    if (v.codeOk) gris('  (le code avait déjà été donné)');
    if (!v.codeOk && v.lettre) rouge('  LA LETTRE FUITE avant le code');
    else if (!v.codeOk) vert('  la lettre ne quitte pas le serveur avant le code');
  }

  const faux = await appel('/api/verify', { methode: 'POST', corps: { quoi: 'code', saisie: '00000000' } });
  if (jamais500('  code faux', faux)) {
    if (faux.json?.ok === false) vert('  un mauvais code est refusé');
    else rouge('  un mauvais code passe');
  }

  const code = adm.json?.config?.codeFinal;
  const juste = await appel('/api/verify', { methode: 'POST', corps: { quoi: 'code', saisie: code } });
  if (jamais500('  code juste', juste)) {
    if (juste.json?.ok && juste.json.texte) vert('  le bon code ouvre la lettre');
    else if (juste.json?.ok) rouge('  le bon code passe mais ne rend aucune lettre');
    else rouge(`  le bon code (« ${code} ») est REFUSÉ`);
  }

  const apres = await appel('/api/etat');
  if (apres.json?.verdict?.lettre) vert('  la lettre est servie une fois le code donné');
  else rouge("  la lettre n'apparaît pas après le code");
}

/* --- 4 · on referme proprement --- */
await appel('/api/repetition', { methode: 'POST', corps: { action: 'essai.fin' } });
vert('\n  le banc d\'essai est refermé, les vraies dates sont revenues');

console.log(ko
  ? `\n\x1b[31m${ko} problème(s) sur les routes.\x1b[0m\n`
  : '\n\x1b[32mChaque geste du joueur passe, sur les huit jours.\x1b[0m\n');
process.exit(ko ? 1 : 0);
