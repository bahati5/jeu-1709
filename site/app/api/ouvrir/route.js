/* Le joueur ouvre la manche du jour : le chrono part, et c'est de cet
   instant — pas de l'aube — que se comptent les indices. Compter depuis
   l'aube les rendrait tous disponibles avant son réveil. */
import { introuvable, json } from '@/lib/acces';
import { etatTemps, maintenant, dossierDuJour } from '@/lib/temps';
import { lireConfig, lireEtat, muterEtat } from '@/lib/donnees';

export const dynamic = 'force-dynamic';

export async function POST(req) {

  let corps = {};
  try { corps = await req.json(); } catch { return introuvable(); }

  const cfg = await lireConfig();
  const e = etatTemps(cfg, maintenant());
  if (corps.slug !== dossierDuJour(e)) return introuvable();

  const etat = await lireEtat();
  if (etat.debuts?.[corps.slug]) return json({ ok: true, debut: etat.debuts[corps.slug] });

  const debut = new Date(e.t).toISOString();
  await muterEtat((s) => ({ ...s, debuts: { ...s.debuts, [corps.slug]: debut } }));
  return json({ ok: true, debut });
}

/** Compte une scène vue, pour la version courte à partir de la Nième fois. */
export async function PATCH(req) {
  let corps = {};
  try { corps = await req.json(); } catch { return introuvable(); }
  const cles = Array.isArray(corps.scenes) ? corps.scenes.slice(0, 20) : [];
  if (!cles.length) return json({ ok: true });
  await muterEtat((s) => {
    const v = { ...(s.vuesAnim || {}) };
    for (const c of cles) v[c] = (v[c] || 0) + 1;
    return { ...s, vuesAnim: v };
  });
  return json({ ok: true });
}
