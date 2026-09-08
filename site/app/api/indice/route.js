/* Un indice se demande. Il ne tombe jamais tout seul.
 *
 * Le temps rend un indice *demandable* ; c'est le joueur qui décide de
 * l'ouvrir. Un indice non demandé n'existe pas côté client : il ne part
 * au navigateur qu'à la seconde où il le réclame.
 *
 * Les paliers — en minutes depuis l'ouverture de la manche — se règlent
 * depuis /admin → Les règles.
 */
import { estJoueur, introuvable, json } from '@/lib/acces';
import { etatTemps, maintenant, dossierDuJour, indicesDepuis, minutesDepuis } from '@/lib/temps';
import { lireConfig, lireEtat, lireDossier, muterEtat } from '@/lib/donnees';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await estJoueur())) return introuvable();

  let corps = {};
  try { corps = await req.json(); } catch { return introuvable(); }

  const cfg = await lireConfig();
  const e = etatTemps(cfg, maintenant());
  if (!corps.slug || corps.slug !== dossierDuJour(e)) return introuvable();

  const d = await lireDossier(corps.slug);
  if (!d || d.actif === false) return introuvable();

  const etat = await lireEtat();
  const nb = (d.indices || []).length;
  const debut = etat.debuts?.[corps.slug] ? Date.parse(etat.debuts[corps.slug]) : null;
  const parLeTemps = Math.min(indicesDepuis(cfg, debut, e.t), nb);
  const demandes = Math.min(etat.indicesVus?.[corps.slug] || 0, nb);

  if (demandes >= nb) return json({ ok: false, epuises: true });

  /* Pas encore l'heure : on dit quand, on ne donne rien. */
  if (demandes >= parLeTemps) {
    const palier = (cfg.paliers || [])[demandes] ?? null;
    const ecoulees = minutesDepuis(debut, e.t);
    return json({
      ok: false, pasEncore: true, palier, minutes: ecoulees,
      restant: palier == null ? null : Math.max(0, palier - ecoulees),
    });
  }

  const suivant = demandes + 1;
  await muterEtat((s) => ({ ...s, indicesVus: { ...s.indicesVus, [corps.slug]: suivant } }));

  return json({ ok: true, rang: suivant, texte: d.indices[demandes], reste: nb - suivant });
}
