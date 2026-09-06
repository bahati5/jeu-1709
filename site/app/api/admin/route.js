/* La console. Tout ce que le jeu contient se règle ici.
 *
 * GET  → la configuration, les dossiers (solutions comprises : c'est elle),
 *        le catalogue d'animations, les médias, l'avancement.
 * POST → une action nommée.
 */
import { estAdmin, introuvable, json } from '@/lib/acces';
import {
  lireConfig, ecrireConfig, lireEtat, muterEtat, ETAT_INITIAL,
  listerDossiers, lireDossier, enregistrerDossier, supprimerDossier, reordonner,
  listerAnimations, majAnimation, amorcerAnimations,
  listerMedias, enregistrerMedia, supprimerMedia, pilote,
} from '@/lib/donnees';
import { etatTemps, maintenant, jalons } from '@/lib/temps';
import { LISTE_TYPES, TYPES } from '@/lib/types';
import { SCENES } from '@/lib/animations';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await estAdmin())) return introuvable();

  await amorcerAnimations();
  const cfg = await lireConfig();
  const etat = await lireEtat();
  const e = etatTemps(cfg, maintenant());

  return json({
    pilote: pilote(),
    config: cfg,
    dossiers: await listerDossiers(),
    animations: await listerAnimations(),
    medias: await listerMedias(),
    types: LISTE_TYPES,
    champs: Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, v.champs])),
    scenes: SCENES.map(({ cle, nom, declencheur }) => ({ cle, nom, declencheur })),
    etat,
    temps: {
      phase: e.phase,
      horloge: e.t,
      jour: e.jour ? { index: e.jour.index, date: e.jour.date, dossier: e.jour.dossier } : null,
      jours: jalons(cfg).jours.map((j) => ({
        index: j.index, date: j.date, dossier: j.dossier, ouvre: j.ouvre, dernier: j.dernier,
      })),
    },
  });
}

export async function POST(req) {
  if (!(await estAdmin())) return introuvable();

  const ct = req.headers.get('content-type') || '';

  /* ---- Téléversement d'un média ---- */
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const f = form.get('fichier');
    if (!f || typeof f === 'string') return json({ erreur: 'fichier manquant' }, 400);
    const octets = Buffer.from(await f.arrayBuffer());
    const m = await enregistrerMedia({
      nom: form.get('nom') || f.name,
      octets,
      mime: f.type || 'application/octet-stream',
      dossierSlug: form.get('dossier') || null,
    });
    return json({ ok: true, media: m });
  }

  let c = {};
  try { c = await req.json(); } catch { return json({ erreur: 'json' }, 400); }

  switch (c.action) {
    case 'config':
      return json({ ok: true, config: await ecrireConfig(c.config) });

    case 'dossier.enregistrer': {
      const d = await enregistrerDossier(c.dossier);
      return json({ ok: true, dossier: d, dossiers: await listerDossiers() });
    }

    case 'dossier.supprimer':
      await supprimerDossier(c.slug);
      return json({ ok: true, dossiers: await listerDossiers() });

    case 'dossier.reordonner':
      await reordonner(c.slugs);
      return json({ ok: true, dossiers: await listerDossiers() });

    case 'dossier.dupliquer': {
      const src = await lireDossier(c.slug);
      if (!src) return json({ erreur: 'introuvable' }, 404);
      const copie = { ...src, slug: `${src.slug}-copie`, titre: `${src.titre} (copie)`, ordre: (src.ordre || 0) + 1 };
      delete copie.id; delete copie.created_at; delete copie.updated_at;
      await enregistrerDossier(copie);
      return json({ ok: true, dossiers: await listerDossiers() });
    }

    case 'animation.maj':
      return json({ ok: true, animations: await majAnimation(c.cle, c.patch) });

    case 'media.supprimer':
      await supprimerMedia(c.nom);
      return json({ ok: true, medias: await listerMedias() });

    /* ---- Piloter la partie en direct ---- */
    case 'debloquer': {
      const d = await lireDossier(c.slug);
      const etat = await muterEtat((s) => ({
        ...s,
        resolus: {
          ...s.resolus,
          [c.slug]: {
            at: new Date().toISOString(),
            minutes: null,
            resultat: d?.solution?.resultat || (d?.solution?.reponses?.[0] ?? ''),
            parAdmin: true,
          },
        },
      }));
      return json({ ok: true, etat });
    }

    case 'reverrouiller': {
      const etat = await muterEtat((s) => {
        const r = { ...s.resolus }; delete r[c.slug];
        const t = { ...s.tentatives }; delete t[c.slug];
        return { ...s, resolus: r, tentatives: t };
      });
      return json({ ok: true, etat });
    }

    case 'liberer':   /* lever un blocage tout de suite */
      return json({ ok: true, etat: await muterEtat((s) => ({
        ...s, tentatives: { ...s.tentatives, [c.slug]: { n: 0, jusqu: 0 } },
      })) });

    case 'bonus':
      return json({ ok: true, etat: await muterEtat((s) => ({ ...s, bonus: !!c.valeur })) });

    case 'reinitialiser':   /* remet l'avancement à zéro, garde le contenu */
      return json({ ok: true, etat: await muterEtat(() => ({ ...ETAT_INITIAL })) });

    default:
      return json({ erreur: 'action inconnue' }, 400);
  }
}
