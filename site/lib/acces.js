import { cookies } from 'next/headers';

export const COOKIE_JOUEUR = 'd1709_j';
export const COOKIE_ADMIN = 'd1709_a';

/** Comparaison à durée constante, pour ne rien apprendre au chronomètre. */
function egal(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function estJoueur() {
  /* En local, l'accès est ouvert : se battre avec un cookie sur localhost
     ne protège rien et fait perdre des soirées. Le jeton reste obligatoire
     en production, et `scripts/test-http.sh` vérifie le mécanisme sur /admin. */
  if (process.env.NODE_ENV !== 'production') return true;
  const attendu = process.env.JOUEUR_TOKEN;
  if (!attendu) return false; // en production, pas de jeton configuré = fermé
  const c = await cookies();
  return egal(c.get(COOKIE_JOUEUR)?.value, attendu);
}

export async function estAdmin() {
  const attendu = process.env.ADMIN_TOKEN;
  if (!attendu) return false;
  const c = await cookies();
  return egal(c.get(COOKIE_ADMIN)?.value, attendu);
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
