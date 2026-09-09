/* Le banc d'essai — réservé au cookie admin.
 *
 * Il sert à parcourir les huit jours d'affilée, en ligne, sans attendre les
 * paliers d'indices ni le lendemain. Il n'est jamais servi au joueur :
 * `estAdmin()` le garde, et lui n'a pas ce cookie.
 *
 * La règle qui compte : ENTRER dans le banc d'essai met les vraies dates et
 * les vrais paliers de côté, dans l'état du jeu. EN SORTIR les remet
 * exactement comme ils étaient et efface la partie de test. Tant qu'on n'est
 * pas entré, `jour` et `paliers` refusent d'agir — pour qu'un doigt qui
 * glisse ne décale pas le calendrier de la vraie partie.
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

  const etat = await lireEtat();
  const essai = etat.essai?.actif ? etat.essai : null;

  /* Ce qu'il faut avoir mis de côté avant de toucher au calendrier. */
  const aGarder = (k) => ({
    debut: k.debut, fin: k.fin,
    heureOuverture: k.heureOuverture, heureVerdict: k.heureVerdict,
    paliers: k.paliers,
  });

  switch (c.action) {
    /* --- Entrer dans le banc d'essai --- */
    case 'essai.debut': {
      if (essai) return json({ ok: true, essai, deja: true });
      const garde = aGarder(cfg);
      const nouvel = await muterEtat(() => ({
        ...ETAT_INITIAL,
        essai: { actif: true, depuis: new Date().toISOString(), config: garde },
      }));
      /* Jour 1, bascule à minuit, indices tout de suite. */
      const aujourd = new Intl.DateTimeFormat('en-CA', {
        timeZone: cfg.fuseau, year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
      await ecrireConfig({
        debut: aujourd,
        fin: iso(Date.parse(`${aujourd}T00:00:00Z`) + (n - 1) * JOUR_MS),
        heureOuverture: 0, heureVerdict: 0,
        paliers: (cfg.paliers || []).map(() => 0),
      });
      return json({ ok: true, essai: nouvel.essai, jour: 1 });
    }

    /* --- En sortir : tout remettre comme avant, et effacer la partie d'essai --- */
    case 'essai.fin': {
      if (essai?.config) await ecrireConfig(essai.config);
      await ecrireEtat({ ...ETAT_INITIAL });
      return json({ ok: true, rendu: essai?.config || null });
    }

    /* --- Se placer sur un jour donné, aujourd'hui, horloge réelle --- */
    case 'jour': {
      if (!essai) return json({ ok: false, horsEssai: true }, 409);
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
      if (!essai) return json({ ok: false, horsEssai: true }, 409);
      /* « Rétablir » veut dire : tes paliers à toi, pas des valeurs en dur. */
      const vrais = essai.config?.paliers?.length ? essai.config.paliers : [60, 120, 180];
      const paliers = c.zero !== false ? vrais.map(() => 0) : vrais;
      await ecrireConfig({ paliers });
      return json({ ok: true, paliers });
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

    /* --- Tout remettre à zéro, contenu conservé. On reste dans le banc
           d'essai si on y était : sortir, c'est `essai.fin`. --- */
    case 'raz':
      await ecrireEtat({ ...ETAT_INITIAL, ...(essai ? { essai } : {}) });
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
