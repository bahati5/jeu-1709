/* Le manifeste — ce que l'écran d'accueil affiche sous l'icône.
 *
 * Il est calculé, pas écrit : le nom vient de /admin comme tout le reste.
 * Un fichier statique aurait figé « Dossier 1709/26 » sur son téléphone.
 */
import { lireConfig } from '@/lib/donnees';

export const dynamic = 'force-dynamic';

export default async function manifest() {
  let cfg = {};
  try { cfg = await lireConfig(); } catch { /* base absente : on met du neutre */ }

  const titre = cfg.titre || 'Dossier';
  const court = (cfg.cote || titre).slice(0, 12);
  const fond = cfg.skin === 'chambre' ? '#070c0b' : '#0c0910';

  return {
    name: titre,
    short_name: court,
    start_url: '/',
    display: 'standalone',
    background_color: fond,
    theme_color: fond,
    icons: [],
  };
}
