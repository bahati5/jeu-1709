/* La vérification. Le seul endroit où une réponse est comparée.
 *
 * Rien ne sort d'ici que `ok`, et ce qui devient légitimement visible
 * une fois la manche gagnée.
 */
import { introuvable, json } from '@/lib/acces';
import { etatTemps, maintenant, dossierDuJour, dossiersOuverts, minutesDepuis } from '@/lib/temps';
import { lireConfig, lireEtat, lireDossier, muterEtat } from '@/lib/donnees';
import { normaliser, verifier, verifierDossier, verifierPasse } from '@/lib/reponses';

export const dynamic = 'force-dynamic';

export async function POST(req) {

  let corps = {};
  try { corps = await req.json(); } catch { return introuvable(); }

  const cfg = await lireConfig();
  const etat = await lireEtat();
  const e = etatTemps(cfg, maintenant());
  const t = e.t;

  /* --- Le code final --- */
  if (corps.quoi === 'code') {
    if (!e.jour?.dernier) return introuvable();
    const ok = normaliser(corps.saisie) === normaliser(cfg.codeFinal);
    if (!ok) return json({ ok: false });
    await muterEtat((s) => ({ ...s, codeOk: true }));

    /* La lettre part avec la réponse : la scène « L'acte s'imprime » la
       tape ligne à ligne, et l'onglet la garde ensuite. */
    const anos = Object.keys(etat.anomalies || {}).length;
    const complete = anos >= (cfg.seuilAnomalies ?? 4);
    return json({
      ok: true,
      texte: (complete && cfg.lettreFinaleAnomalies) ? cfg.lettreFinaleAnomalies : cfg.lettreFinale,
      complete,
    });
  }

  const slug = corps.slug;
  const jour = dossierDuJour(e);

  /* Une anomalie se signale à tout moment : il peut comprendre au cinquième
     jour ce qui clochait dans le premier dossier, et c'est même le but.
     Tout le reste ne concerne que la manche d'aujourd'hui. */
  const ouverts = dossiersOuverts(e);
  const permis = corps.quoi === 'anomalie' ? ouverts.includes(slug) : slug === jour;
  if (!slug || !permis) return introuvable();

  const d = await lireDossier(slug);
  if (!d || d.actif === false) return introuvable();

  /* --- La phrase de passe d'une serrure --- */
  if (corps.quoi === 'passe') {
    if (d.type !== 'serrure') return introuvable();
    if (!verifierPasse(d.solution, corps.saisie)) return json({ ok: false });
    await muterEtat((s) => ({ ...s, serrures: { ...s.serrures, [slug]: true } }));
    return json({ ok: true, revele: d.solution?.revele || '' });
  }

  /* --- L'anomalie : facultative, sans compteur de tentatives --- */
  if (corps.quoi === 'anomalie') {
    const ok = verifier(d.anomalie || {}, corps.saisie);
    if (!ok) return json({ ok: false });
    await muterEtat((s) => ({
      ...s, anomalies: { ...s.anomalies, [slug]: new Date(t).toISOString() },
    }));
    return json({ ok: true, texte: d.anomalie?.texte || '' });
  }

  /* --- La réponse de la manche --- */
  const bloc = etat.tentatives?.[slug] || { n: 0, jusqu: 0 };
  if (bloc.jusqu && bloc.jusqu > t) {
    return json({ ok: false, bloqueJusqu: bloc.jusqu }, 429);
  }

  if (etat.resolus?.[slug]) return json({ ok: true, deja: true });

  /* Une seule règle, partagée avec les tests : voir lib/reponses.js. */
  const ok = verifierDossier(d, corps.saisie);

  if (!ok) {
    const n = bloc.n + 1;
    const max = cfg.tentativesMax || 5;
    const bloque = n >= max;
    await muterEtat((s) => ({
      ...s,
      tentatives: {
        ...s.tentatives,
        [slug]: bloque
          ? { n: 0, jusqu: t + (cfg.blocageMinutes || 10) * 60000 }
          : { n, jusqu: 0 },
      },
    }));
    return json(
      bloque
        ? { ok: false, bloqueJusqu: t + (cfg.blocageMinutes || 10) * 60000 }
        : { ok: false, restant: max - n },
      bloque ? 429 : 200,
    );
  }

  const debut = etat.debuts?.[slug] ? Date.parse(etat.debuts[slug]) : null;
  const minutes = minutesDepuis(debut, t);

  await muterEtat((s) => ({
    ...s,
    resolus: {
      ...s.resolus,
      [slug]: {
        at: new Date(t).toISOString(),
        minutes,
        resultat: d.solution?.resultat || (d.solution?.reponses?.[0] ?? ''),
      },
    },
    tentatives: { ...s.tentatives, [slug]: { n: 0, jusqu: 0 } },
  }));

  return json({
    ok: true,
    resultat: d.solution?.resultat || '',
    recompense: d.recompense || null,
    minutes,
    chronoRef: d.chrono_ref ?? null,
    animations: d.animations || {},
  });
}
