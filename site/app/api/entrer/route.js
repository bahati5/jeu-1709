/* L'ancienne porte à jeton — elle n'existe plus.
 *
 * Le jeu est ouvert et la console demande un mot de passe. Ce fichier ne
 * reste que pour qu'un vieux lien à jeton, s'il traîne quelque part, tombe
 * sur le jeu plutôt que sur une erreur. Tu peux supprimer ce dossier :
 *
 *     rm -rf site/app/api/entrer
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  return NextResponse.redirect(new URL('/', new URL(req.url).origin));
}
