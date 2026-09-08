/* La barre de répétition — réservée au cookie admin.
 *
 * Elle sert à parcourir les huit jours d'affilée, sans attendre les
 * paliers d'indices ni le lendemain. Elle n'est jamais servie au joueur :
 * `estAdmin()` la garde, et un cookie joueur ne l'ouvre pas.
 */
import { estAdmin, introuvable, json } from '@/lib/acces';
import { lireConfig, ecrireConfig, lireEtat, ecrireEtat, muterEtat, ETAT_INITIAL, lireDossier }
  from '@/lib/donnees';
import { etatTemps, maintenant, dossierDuJour } from '@/lib/temps';

export const dynamic = 'force-dynamic';

const JOUR_MS = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

export async function POST(req) {
  if (!(await estAdmin())) return introuvable();

  let c = {};
  try { c = await req.json(); } catch { return json({ erreur: 'json' }, 400); }

  const cfg = await lireConfig();
  const e = etatTemps(cfg, maintenant());
  const n = (cfg.programme || []).length || 8;

  switch (c.action) {
    /* --- Se placer sur un jour donné, aujourd'hui, horloge réelle --- */
    case 'jour': {
      const vise = Math.max(1, Math.min(n, Number(c.jour) || 1));
      const aujourd = new Intl.DateTimeFormat('en-CA', {
        timeZone: cfg.fuseau, year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
      const base = Date.parse(`${aujourd}T00:00:00Z`);
      const debut = iso(base - (vise - 1) * JOUR_MS);
      await ecrireConfig({
        debut, fin: iso(Date.parse(`${debut}T00:00:00Z`) + (n - 1) * JOUR_MS),
        heureOuverture: 0, heureVerdict: 0,
      });
      return json({ ok: true, jour: vise });
    }

    /* --- Indices demandables tout de suite, ou paliers rétablis --- */
    case 'paliers': {
      const zero = c.zero !== false;
      await ecrireConfig({ paliers: zero ? [0, 0, 0] : [60, 120, 180] });
      return json({ ok: true, paliers: zero ? [0, 0, 0] : [60, 120, 180] });
    }

    /* --- Rejouer les scènes en pleine longueur --- */
    case 'scenes.oublier':
      return json({ ok: true, etat: await muterEtat((s) => ({ ...s, vuesAnim: {} })) });

    /* --- Repartir de zéro sur la manche du jour --- */
    case 'manche.raz': {
      const slug = dossierDuJour(e);
      if (!slug) return json({ ok: false });
      return json({ ok: true, etat: await muterEtat((s) => {
        const r = { ...s.resolus }; delete r[slug];
        const t = { ...s.tentatives }; delete t[slug];
        const d = { ...s.debuts }; delete d[slug];
        const i = { ...s.indicesVus }; delete i[slug];
        const ser = { ...s.serrures }; delete ser[slug];
        const an = { ...s.anomalies }; delete an[slug];
        return { ...s, resolus: r, tentatives: t, debuts: d, indicesVus: i, serrures: ser, anomalies: an };
      }) });
    }

    /* --- Tout remettre à zéro, contenu conservé --- */
    case 'raz':
      await ecrireEtat({ ...ETAT_INITIAL });
      return json({ ok: true });

    /* --- La réponse attendue, pour ne pas résoudre huit énigmes à la main --- */
    case 'reponse': {
      const slug = dossierDuJour(e);
      if (!slug) return json({ ok: false });
      const d = await lireDossier(slug);
      return json({
        ok: true,
        reponse: d?.solution?.reponses?.[0] ?? '',
        passe: d?.type === 'serrure' ? (d.solution?.passe ?? '') : null,
        anomalie: d?.anomalie?.reponses?.[0] ?? null,
      });
    }

    default:
      return json({ erreur: 'action inconnue' }, 400);
  }
}
