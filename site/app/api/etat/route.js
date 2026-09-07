/* L'état du jeu tel que le joueur a le droit de le voir.
 *
 * Cette route est la seule surface publique du jeu. Tout ce qui n'y est pas
 * n'existe pas pour lui : les dossiers futurs, les réponses, les récompenses
 * non gagnées, les anomalies non trouvées.
 */
import { estJoueur, introuvable, json } from '@/lib/acces';
import { etatTemps, maintenant, ongletsOuverts, verdictOuvert, indicesDepuis, minutesDepuis } from '@/lib/temps';
import { lireConfig, lireEtat, lireDossier, listerAnimations, amorcerAnimations } from '@/lib/donnees';
import { versClient } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await estJoueur())) return introuvable();

  const cfg = await lireConfig();
  const etat = await lireEtat();
  const e = etatTemps(cfg, maintenant());

  const base = {
    phase: e.phase,
    titre: cfg.titre,
    horloge: e.t,
    fuseau: cfg.fuseau,
    tailleFonds: cfg.tailleFonds,
    animations: cfg.animations,
    vuesAnim: etat.vuesAnim || {},
  };

  /* Avant l'ouverture : un sceau et un compte à rebours. Rien d'autre. */
  if (e.phase !== 'enquete') {
    return json({ ...base, ouverture: e.ouverture });
  }

  const total = e.j.jours.length;
  const slug = e.jour.dossier;
  const resolu = Boolean(slug && etat.resolus?.[slug]);

  /* Le dossier du jour, réduit à sa projection publique. */
  let manche = null;
  if (slug) {
    const d = await lireDossier(slug);
    if (d && d.actif !== false) {
      manche = versClient(d, { resolu });

      /* Les indices ouverts, et eux seuls.
         On compte avec l'heure du SERVEUR (e.t), pas Date.now() : sous
         SIM_DATE les deux divergent, et les indices ne s'ouvriraient
         jamais en répétition. */
      const debut = etat.debuts?.[slug] ? Date.parse(etat.debuts[slug]) : null;
      const n = indicesDepuis(cfg, debut, e.t);
      manche.indices = (d.indices || []).slice(0, n);
      manche.indicesTotal = (d.indices || []).length;
      manche.minutes = minutesDepuis(debut, e.t);
      manche.prochainIndice = (cfg.paliers || [])[n] ?? null;

      /* Une serrure ouverte révèle son texte — après coup seulement. */
      if (d.type === 'serrure' && etat.serrures?.[slug]) {
        manche.payload.revele = d.solution?.revele || '';
        manche.ouverte = true;
      }

      /* La récompense n'existe qu'une fois gagnée. */
      if (resolu) manche.recompense = d.recompense || null;

      const bloc = etat.tentatives?.[slug];
      if (bloc?.jusqu && bloc.jusqu > e.t) manche.bloqueJusqu = bloc.jusqu;
      manche.tentativesRestantes = Math.max(0, (cfg.tentativesMax || 5) - (bloc?.n || 0));
    }
  }

  /* Le tableau : ce qu'il a établi. Les résultats en clair, c'est voulu. */
  const acquis = [];
  for (const j of e.j.jours) {
    if (!j.dossier || j.index > e.jour.index) continue;
    const r = etat.resolus?.[j.dossier];
    if (!r) continue;
    const d = await lireDossier(j.dossier);
    if (!d) continue;
    acquis.push({
      slug: j.dossier,
      titre: d.titre,
      genre: d.genre,
      date: j.date,
      resultat: r.resultat || '',
      minutes: r.minutes ?? null,
      chronoRef: d.chrono_ref ?? null,
      recompense: d.recompense || null,
    });
  }

  /* Les anomalies trouvées — jamais celles qui restent à trouver. */
  const anomalies = [];
  for (const [s, at] of Object.entries(etat.anomalies || {})) {
    const d = await lireDossier(s);
    if (d?.anomalie?.texte) anomalies.push({ slug: s, texte: d.anomalie.texte, at });
  }

  const catalogue = (await listerAnimations()).length
    ? await listerAnimations()
    : await amorcerAnimations();

  return json({
    ...base,
    jour: { index: e.jour.index, date: e.jour.date, dernier: e.jour.dernier, total },
    onglets: ongletsOuverts(e, etat),
    manche,
    acquis,
    anomalies,
    scelles: { total, pris: acquis.length },
    verdict: verdictOuvert(e, etat),
    codeOk: Boolean(etat.codeOk),
    bonus: Boolean(etat.bonus),
    catalogue: catalogue.map(({ cle, nom, declencheur, duree_ms, actif, ordre }) =>
      ({ cle, nom, declencheur, duree_ms, actif, ordre })),
  });
}
