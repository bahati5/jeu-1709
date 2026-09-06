/* Le calendrier fait autorité, et il est entièrement configuré.
   Aucune date n'est écrite en dur ici. */
import { normaliserConfig, nbJours, dateDuJour, JOUR_MS } from './config.js';

/** Décalage réel du fuseau à un instant donné, en minutes (gère l'heure d'été). */
function decalage(ts, fuseau) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: fuseau, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(
    f.formatToParts(new Date(ts)).filter((x) => x.type !== 'literal').map((x) => [x.type, Number(x.value)]),
  );
  const local = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return (local - ts) / 60000;
}

/** Instant UTC correspondant à une date locale + heure dans le fuseau. */
export function instant(dateISO, heure, fuseau = 'Europe/Paris') {
  const [a, m, j] = String(dateISO).split('-').map(Number);
  const brut = Date.UTC(a, (m || 1) - 1, j || 1, heure || 0);
  const d1 = decalage(brut, fuseau);
  const t1 = brut - d1 * 60000;
  const d2 = decalage(t1, fuseau);        // seconde passe : bascule d'heure d'été
  return d2 === d1 ? t1 : brut - d2 * 60000;
}

export function maintenant() {
  const sim = process.env.SIM_DATE;
  if (sim && process.env.NODE_ENV !== 'production') {
    const d = new Date(sim);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Les bornes calculées à partir de la configuration. */
export function jalons(cfg) {
  const c = normaliserConfig(cfg);
  const n = nbJours(c.debut, c.fin);
  const jours = [];
  for (let i = 0; i < n; i++) {
    const dernier = i === n - 1;
    jours.push({
      index: i,
      dernier,
      date: dateDuJour(c.debut, i),
      dossier: c.programme[i] || null,
      /* Le dernier jour s'ouvre à l'heure du verdict, les autres à l'heure de bascule. */
      ouvre: instant(dateDuJour(c.debut, i), dernier ? c.heureVerdict : c.heureOuverture, c.fuseau),
    });
  }
  return { cfg, jours, verdict: jours[n - 1].ouvre };
}

/**
 * Phase courante.
 *  avant   — le dossier n'est pas ouvert
 *  enquete — un jour de jeu, avec ou sans énigme
 *  verdict — le dernier jour, à partir de l'heure du verdict
 */
export function etatTemps(cfg, d = maintenant()) {
  const j = jalons(cfg);
  const t = d.getTime();
  if (t < j.jours[0].ouvre) {
    return { phase: 'avant', jour: null, t, ouverture: j.jours[0].ouvre, j };
  }
  for (let i = j.jours.length - 1; i >= 0; i--) {
    if (t >= j.jours[i].ouvre) {
      return { phase: 'enquete', jour: j.jours[i], t, ouvertJour: j.jours[i].ouvre, j };
    }
  }
  return { phase: 'avant', jour: null, t, ouverture: j.jours[0].ouvre, j };
}

export function minutesEcoulees(e) {
  return e.ouvertJour ? Math.max(0, Math.floor((e.t - e.ouvertJour) / 60000)) : 0;
}
/** Indices ouverts, comptés depuis l'instant où il a ouvert l'épreuve.
    Compter depuis l'aube les rendrait tous disponibles avant son réveil. */
export function indicesDepuis(cfg, debutMs, t = Date.now()) {
  if (!debutMs) return 0;
  const m = Math.max(0, Math.floor((t - debutMs) / 60000));
  return (cfg.paliers || []).filter((p) => m >= p).length;
}
export function minutesDepuis(debutMs, t = Date.now()) {
  return debutMs ? Math.max(0, Math.floor((t - debutMs) / 60000)) : 0;
}

/** Les onglets qui existent pour lui. Un onglet fermé n'existe pas. */
/** Les onglets qui existent pour lui. Un onglet fermé n'existe pas.
    L'assemblage n'apparaît que le dernier jour, et seulement une fois
    l'épreuve du jour résolue : c'est elle qui lève les scellés. */
export function ongletsOuverts(e, etat) {
  const t = ['fonds', 'tableau'];
  if (e.jour?.dossier) t.push('manche');
  if (verdictOuvert(e, etat)) t.push('enveloppe');
  if (etat?.bonus) t.push('invitation');
  return t;
}
export function verdictOuvert(e, etat) {
  if (!e.jour?.dernier) return false;
  return !e.jour.dossier || !!etat?.resolus?.[e.jour.dossier];
}

/** Le dossier ouvert aujourd'hui, ou null. Sert de garde à toutes les routes. */
export function dossierDuJour(e) {
  return e.phase === 'enquete' ? (e.jour?.dossier || null) : null;
}

/** Les dossiers déjà ouverts (aujourd'hui compris) — pour les médias et le tableau. */
export function dossiersOuverts(e) {
  if (e.phase !== 'enquete') return [];
  return e.j.jours
    .filter((j) => j.index <= e.jour.index && j.dossier)
    .map((j) => j.dossier);
}

export function lisible(d, fuseau = 'Europe/Paris') {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: fuseau, weekday: 'short', day: 'numeric', month: 'long' }).format(d);
}
export function heureLisible(d, fuseau = 'Europe/Paris') {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: fuseau, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
export { JOUR_MS };
