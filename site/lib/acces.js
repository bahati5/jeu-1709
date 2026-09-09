/* Qui a le droit de quoi.
 *
 * Le jeu est ouvert : le lien ne sera partagé qu'à lui, et rien de secret
 * ne transite par le client de toute façon (les réponses sont vérifiées
 * côté serveur, les dossiers futurs n'existent pas).
 *
 * La console, elle, est fermée par un mot de passe — c'est le seul endroit
 * où vivent les réponses, les indices et les lettres du 17.
 */
import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';

export const COOKIE_ADMIN = 'd1709_a';

/** Comparaison à durée constante, pour ne rien apprendre au chronomètre. */
export function egal(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* Le cookie ne porte pas le mot de passe : il porte son empreinte. Un cookie
   lu par-dessus l'épaule ne rend donc pas le mot de passe lui-même. */
export const sceau = (mdp) =>
  createHash('sha256').update(`1709:${mdp}`).digest('hex');

/** Le mot de passe attendu, s'il est configuré. */
export const mdpConfigure = () => Boolean(process.env.ADMIN_MDP);

/** Le mot de passe saisi est-il le bon ? */
export const mdpJuste = (saisi) =>
  mdpConfigure() && egal(String(saisi || ''), process.env.ADMIN_MDP);

export async function estAdmin() {
  if (!mdpConfigure()) return false;   // pas de mot de passe = console fermée
  const c = await cookies();
  return egal(c.get(COOKIE_ADMIN)?.value, sceau(process.env.ADMIN_MDP));
}

/** 404 partout, jamais 403 : un 403 confirme qu'il y a quelque chose derrière. */
export const introuvable = () =>
  new Response(JSON.stringify({ erreur: 'introuvable' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' },
  });
