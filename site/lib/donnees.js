/* La couche d'accès aux données.
 *
 * Deux pilotes derrière une seule interface :
 *   — Supabase, dès que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont posés ;
 *   — un fichier JSON local sinon, pour développer sans rien brancher.
 *
 * Le reste de l'application ne sait pas lequel tourne.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supa, supaActif, BUCKET } from './supabase.js';
import { CONFIG_DEFAUT, normaliserConfig } from './config.js';
import { SCENES } from './animations.js';
import { nettoyerPayload, estType } from './types.js';

const RACINE = path.join(process.cwd(), '.data');
const FICHIER = path.join(RACINE, 'fonds47.json');
const MEDIAS_LOCAUX = path.join(RACINE, 'medias');

export const ETAT_INITIAL = {
  resolus: {},        // { slug: { at, tentatives, minutes } }
  debuts: {},         // { slug: ISO } — l'instant d'ouverture, base des indices
  indicesVus: {},     // { slug: n }
  anomalies: {},      // { slug: at }
  serrures: {},       // { slug: true } — parchemins ouverts
  vuesAnim: {},       // { cleScene: n } — pour la version courte
  tentatives: {},     // { slug: { n, jusqu } }
  bonus: false,
  codeOk: false,
};

/* ---------------------------------------------------------------- */
/*  Pilote fichier                                                   */
/* ---------------------------------------------------------------- */

async function lireFichier() {
  try {
    return JSON.parse(await fs.readFile(FICHIER, 'utf8'));
  } catch {
    return { config: {}, dossiers: [], etat: {}, animations: [], medias: [] };
  }
}
async function ecrireFichier(db) {
  await fs.mkdir(RACINE, { recursive: true });
  await fs.writeFile(FICHIER, JSON.stringify(db, null, 2), 'utf8');
  return db;
}

/* ---------------------------------------------------------------- */
/*  Configuration                                                    */
/* ---------------------------------------------------------------- */

export async function lireConfig() {
  if (supaActif()) {
    const { data, error } = await supa().from('jeu_config').select('data').eq('id', 'principal').maybeSingle();
    /* Ne pas faire tomber le jeu pour une base qui hoquette — mais ne pas
       non plus servir la config par défaut en silence : ça donne un site
       qui « marche » et ne montre rien, et on cherche pendant une heure. */
    if (error) console.error('[fonds47] lecture de jeu_config :', error.message);
    return normaliserConfig(data?.data);
  }
  const db = await lireFichier();
  return normaliserConfig(db.config);
}

export async function ecrireConfig(patch) {
  const actuel = await lireConfig();
  const suivant = normaliserConfig({ ...actuel, ...(patch || {}) });
  if (supaActif()) {
    await supa().from('jeu_config').upsert({ id: 'principal', data: suivant });
    return suivant;
  }
  const db = await lireFichier();
  db.config = suivant;
  await ecrireFichier(db);
  return suivant;
}

/* ---------------------------------------------------------------- */
/*  Dossiers — le contenu du jeu                                     */
/* ---------------------------------------------------------------- */

const RANGEE_VIDE = {
  slug: '', ordre: 0, actif: true, titre: '', genre: '', type: 'saisie',
  payload: {}, solution: {}, indices: [], animations: {}, recompense: {},
  anomalie: {}, chrono_ref: null,
};

function assainir(d) {
  const r = { ...RANGEE_VIDE, ...d };
  if (!estType(r.type)) r.type = 'saisie';
  r.slug = String(r.slug || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60);
  r.ordre = Number(r.ordre) || 0;
  r.actif = r.actif !== false;
  /* Une réponse glissée par mégarde dans `payload` est écartée ici,
     avant d'atteindre la base. C'est la deuxième barrière après `versClient`. */
  r.payload = nettoyerPayload(r.type, r.payload || {});
  r.indices = Array.isArray(r.indices) ? r.indices.filter(Boolean).slice(0, 10) : [];
  r.chrono_ref = r.chrono_ref === '' || r.chrono_ref == null ? null : Number(r.chrono_ref);
  return r;
}

export async function listerDossiers({ actifsSeuls = false } = {}) {
  let rows;
  if (supaActif()) {
    let q = supa().from('dossiers').select('*').order('ordre', { ascending: true });
    if (actifsSeuls) q = q.eq('actif', true);
    const { data, error } = await q;
    if (error) throw error;
    rows = data || [];
  } else {
    const db = await lireFichier();
    rows = (db.dossiers || []).filter((d) => (actifsSeuls ? d.actif !== false : true));
    rows.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }
  return rows;
}

export async function lireDossier(slug) {
  if (!slug) return null;
  if (supaActif()) {
    const { data } = await supa().from('dossiers').select('*').eq('slug', slug).maybeSingle();
    return data || null;
  }
  const db = await lireFichier();
  return (db.dossiers || []).find((d) => d.slug === slug) || null;
}

export async function enregistrerDossier(d) {
  const r = assainir(d);
  if (!r.slug) throw new Error('slug manquant');
  if (supaActif()) {
    const { data, error } = await supa()
      .from('dossiers').upsert(r, { onConflict: 'slug' }).select().single();
    if (error) throw error;
    return data;
  }
  const db = await lireFichier();
  db.dossiers = db.dossiers || [];
  const i = db.dossiers.findIndex((x) => x.slug === r.slug);
  if (i >= 0) db.dossiers[i] = { ...db.dossiers[i], ...r };
  else db.dossiers.push(r);
  await ecrireFichier(db);
  return r;
}

export async function supprimerDossier(slug) {
  if (supaActif()) {
    await supa().from('dossiers').delete().eq('slug', slug);
  } else {
    const db = await lireFichier();
    db.dossiers = (db.dossiers || []).filter((d) => d.slug !== slug);
    await ecrireFichier(db);
  }
  /* Le programme ne doit pas garder un slug fantôme. */
  const cfg = await lireConfig();
  if ((cfg.programme || []).includes(slug)) {
    await ecrireConfig({ programme: cfg.programme.map((s) => (s === slug ? null : s)) });
  }
  return true;
}

export async function reordonner(slugs) {
  const liste = Array.isArray(slugs) ? slugs : [];
  for (let i = 0; i < liste.length; i++) {
    if (supaActif()) await supa().from('dossiers').update({ ordre: i }).eq('slug', liste[i]);
  }
  if (!supaActif()) {
    const db = await lireFichier();
    for (const d of db.dossiers || []) {
      const i = liste.indexOf(d.slug);
      if (i >= 0) d.ordre = i;
    }
    await ecrireFichier(db);
  }
  return true;
}

/* ---------------------------------------------------------------- */
/*  État de la partie                                                */
/* ---------------------------------------------------------------- */

const fusionnerEtat = (o) => ({
  ...JSON.parse(JSON.stringify(ETAT_INITIAL)),
  ...(o || {}),
});

export async function lireEtat() {
  if (supaActif()) {
    const { data } = await supa().from('etat_jeu').select('data').eq('id', 'principal').maybeSingle();
    return fusionnerEtat(data?.data);
  }
  const db = await lireFichier();
  return fusionnerEtat(db.etat);
}

export async function ecrireEtat(etat) {
  if (supaActif()) {
    await supa().from('etat_jeu').upsert({ id: 'principal', data: etat });
    return etat;
  }
  const db = await lireFichier();
  db.etat = etat;
  await ecrireFichier(db);
  return etat;
}

export async function muterEtat(fn) {
  const etat = await lireEtat();
  const suivant = (await fn(etat)) ?? etat;
  await ecrireEtat(suivant);
  return suivant;
}

/* ---------------------------------------------------------------- */
/*  Animations                                                       */
/* ---------------------------------------------------------------- */

/** Amorce la table avec le catalogue du code, sans écraser les réglages. */
export async function amorcerAnimations() {
  const existantes = await listerAnimations();
  const connues = new Set(existantes.map((a) => a.cle));
  const neuves = SCENES.filter((s) => !connues.has(s.cle));
  if (!neuves.length) return existantes;
  if (supaActif()) {
    await supa().from('animations').upsert(neuves, { onConflict: 'cle' });
  } else {
    const db = await lireFichier();
    db.animations = [...(db.animations || []), ...neuves];
    await ecrireFichier(db);
  }
  return listerAnimations();
}

export async function listerAnimations() {
  if (supaActif()) {
    const { data } = await supa().from('animations').select('*').order('ordre', { ascending: true });
    return data || [];
  }
  const db = await lireFichier();
  return (db.animations || []).slice().sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
}

export async function majAnimation(cle, patch) {
  if (supaActif()) {
    await supa().from('animations').update(patch).eq('cle', cle);
  } else {
    const db = await lireFichier();
    const a = (db.animations || []).find((x) => x.cle === cle);
    if (a) Object.assign(a, patch);
    await ecrireFichier(db);
  }
  return listerAnimations();
}

/* ---------------------------------------------------------------- */
/*  Médias                                                           */
/* ---------------------------------------------------------------- */

export async function listerMedias() {
  if (supaActif()) {
    const { data } = await supa().from('medias').select('*').order('created_at', { ascending: false });
    return data || [];
  }
  const db = await lireFichier();
  return db.medias || [];
}

export async function enregistrerMedia({ nom, octets, mime, dossierSlug }) {
  const propre = String(nom).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const chemin = `${Date.now()}-${propre}`;
  if (supaActif()) {
    const { error } = await supa().storage.from(BUCKET)
      .upload(chemin, octets, { contentType: mime, upsert: false });
    if (error) throw error;
    const { data, error: e2 } = await supa().from('medias')
      .upsert({ nom: propre, chemin, mime, taille: octets.length, dossier_slug: dossierSlug || null },
              { onConflict: 'nom' })
      .select().single();
    if (e2) throw e2;
    return data;
  }
  await fs.mkdir(MEDIAS_LOCAUX, { recursive: true });
  await fs.writeFile(path.join(MEDIAS_LOCAUX, chemin), octets);
  const db = await lireFichier();
  db.medias = (db.medias || []).filter((m) => m.nom !== propre);
  const row = { nom: propre, chemin, mime, taille: octets.length, dossier_slug: dossierSlug || null };
  db.medias.push(row);
  await ecrireFichier(db);
  return row;
}

/** Les octets d'un média. L'appelant a déjà vérifié que le dossier est ouvert. */
export async function lireMedia(nom) {
  const medias = await listerMedias();
  const m = medias.find((x) => x.nom === nom);
  if (!m) return null;
  if (supaActif()) {
    const { data, error } = await supa().storage.from(BUCKET).download(m.chemin);
    if (error || !data) return null;
    return { ...m, octets: Buffer.from(await data.arrayBuffer()) };
  }
  try {
    return { ...m, octets: await fs.readFile(path.join(MEDIAS_LOCAUX, m.chemin)) };
  } catch {
    return null;
  }
}

export async function supprimerMedia(nom) {
  const medias = await listerMedias();
  const m = medias.find((x) => x.nom === nom);
  if (!m) return false;
  if (supaActif()) {
    await supa().storage.from(BUCKET).remove([m.chemin]);
    await supa().from('medias').delete().eq('nom', nom);
  } else {
    try { await fs.unlink(path.join(MEDIAS_LOCAUX, m.chemin)); } catch {}
    const db = await lireFichier();
    db.medias = (db.medias || []).filter((x) => x.nom !== nom);
    await ecrireFichier(db);
  }
  return true;
}

export const pilote = () => (supaActif() ? 'supabase' : 'fichier');

/* Est-ce que la base répond vraiment ? Sert à la console pour dire ce qui
   cloche au lieu d'afficher une erreur 500 illisible à deux heures du matin. */
export async function diagnostic() {
  if (!supaActif()) {
    return {
      ok: true, pilote: 'fichier',
      message: 'Pas de Supabase branché : tout est écrit dans .data/fonds47.json.',
    };
  }
  const { error } = await supa().from('jeu_config').select('id').limit(1);
  if (!error) return { ok: true, pilote: 'supabase' };

  const m = String(error.message || '');
  let quoi = m;
  if (/invalid api key/i.test(m)) {
    quoi = "SUPABASE_SERVICE_ROLE_KEY n'est pas une clé valide pour ce projet. "
      + 'Reprends la clé secrète (« Secret key » ou « service_role ») du projet '
      + "dont l'URL est dans SUPABASE_URL, colle-la sans espace ni guillemet, puis redéploie.";
  } else if (/relation .* does not exist|schema cache/i.test(m)) {
    quoi = "Les tables n'existent pas dans ce projet : passe lib/schema.sql dans le SQL Editor.";
  } else if (/fetch failed|ENOTFOUND|getaddrinfo/i.test(m)) {
    quoi = "SUPABASE_URL ne répond pas. Vérifie l'adresse (https://xxxx.supabase.co, sans / final).";
  }
  return { ok: false, pilote: 'supabase', message: quoi, brut: m, url: urlVisible() };
}

/* L'URL, tronquée : de quoi vérifier qu'on parle au bon projet sans
   afficher quoi que ce soit de secret. */
function urlVisible() {
  const u = String(process.env.SUPABASE_URL || '');
  const m = u.match(/^https:\/\/([a-z0-9]{4})[a-z0-9]*\.supabase\.co/i);
  return m ? `https://${m[1]}….supabase.co` : (u ? 'adresse inattendue' : 'absente');
}
