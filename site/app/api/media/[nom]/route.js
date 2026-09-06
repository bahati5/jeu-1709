/* Les médias ne sont pas dans /public.
 *
 * Un fichier statique échappe au verrou de date et peut être mis en cache
 * par le CDN : la photo du dossier 5 serait lisible dès le premier jour.
 * Tout passe donc par ici, et un média dont le dossier n'est pas ouvert
 * renvoie 404 — jamais 403.
 */
import { estJoueur, estAdmin, introuvable } from '@/lib/acces';
import { etatTemps, maintenant, dossiersOuverts } from '@/lib/temps';
import { lireConfig, lireMedia } from '@/lib/donnees';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const { nom } = await params;

  const admin = await estAdmin();
  if (!admin && !(await estJoueur())) return introuvable();

  const m = await lireMedia(nom);
  if (!m) return introuvable();

  /* L'admin voit tout — c'est elle qui prépare. Le joueur, seulement
     les médias des dossiers déjà ouverts. Un média sans dossier attitré
     est neutre (une texture, un fond) et reste accessible. */
  if (!admin && m.dossier_slug) {
    const cfg = await lireConfig();
    const e = etatTemps(cfg, maintenant());
    if (!dossiersOuverts(e).includes(m.dossier_slug)) return introuvable();
  }

  return new Response(m.octets, {
    status: 200,
    headers: {
      'Content-Type': m.mime || 'application/octet-stream',
      'Content-Length': String(m.octets.length),
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${m.nom}"`,
    },
  });
}
