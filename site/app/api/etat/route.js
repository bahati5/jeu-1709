/* L'état du jeu tel que le joueur a le droit de le voir.
 *
 * Cette route est la seule surface publique du jeu. Tout ce qui n'y est pas
 * n'existe pas pour lui : les dossiers futurs, les réponses, les récompenses
 * non gagnées, les anomalies non trouvées.
 */
import { estAdmin, json } from '@/lib/acces';
import { etatTemps, maintenant, ongletsOuverts, verdictOuvert, indicesDepuis, minutesDepuis } from '@/lib/temps';
import { lireConfig, lireEtat, lireDossier, listerAnimations, amorcerAnimations } from '@/lib/donnees';
import { versClient } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = await lireConfig();
  const etat = await lireEtat();
  const e = etatTemps(cfg, maintenant());

  /* La barre de répétition n'existe que pour elle. Elle est liée au cookie
     admin, pas à un réglage : il n'y a donc rien à penser à éteindre avant
     de lui envoyer le lien. Lui ne l'aura jamais. */
  const repetition = await estAdmin();

  const base = {
    repetition,
    phase: e.phase,
    titre: cfg.titre,
    /* L'habillage — saisi depuis /admin, jamais écrit ici. */
    skin: cfg.skin,
    amorcage: cfg.amorcage,
    surtitre: cfg.surtitre,
    cote: cfg.cote,
    intro: cfg.intro,
    attente: cfg.attente,
    piedFonds: cfg.piedFonds,
    horloge: e.t,
    fuseau: cfg.fuseau,
    tailleFonds: cfg.tailleFonds,
    animations: cfg.animations,
    vuesAnim: etat.vuesAnim || {},
    /* Les paliers et le banc d'essai ne servent qu'à elle — jamais à lui. */
    ...(repetition ? { paliers: cfg.paliers, essai: etat.essai?.actif ? etat.essai : null } : {}),
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

      /* Les indices se DEMANDENT. Le temps ne fait que les rendre
         demandables ; c'est lui qui décide d'en ouvrir un, et on ne lui
         sert que ceux qu'il a effectivement demandés.
         On compte avec l'heure du SERVEUR (e.t), pas Date.now() : sous
         SIM_DATE les deux divergent, et rien ne s'ouvrirait en répétition. */
      const debut = etat.debuts?.[slug] ? Date.parse(etat.debuts[slug]) : null;
      const nbIndices = (d.indices || []).length;
      const parLeTemps = Math.min(indicesDepuis(cfg, debut, e.t), nbIndices);
      const demandes = Math.min(etat.indicesVus?.[slug] || 0, nbIndices);

      manche.indices = (d.indices || []).slice(0, demandes);   // rien de plus
      manche.indicesTotal = nbIndices;
      manche.indicesDemandes = demandes;
      manche.indicesDisponibles = parLeTemps;
      manche.peutDemander = demandes < parLeTemps;
      manche.minutes = minutesDepuis(debut, e.t);
      /* Le palier du PROCHAIN indice qu'il pourra demander. */
      manche.prochainIndice = demandes < nbIndices ? ((cfg.paliers || [])[demandes] ?? null) : null;

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
