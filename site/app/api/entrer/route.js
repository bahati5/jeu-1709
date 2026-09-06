import { NextResponse } from 'next/server';
import { COOKIE_JOUEUR, COOKIE_ADMIN } from '@/lib/acces';

export const dynamic = 'force-dynamic';

/* Le lien à token. Pas de compte, pas de mot de passe : un lien, une fois. */
export async function GET(req) {
  const url = new URL(req.url);
  const t = url.searchParams.get('t') || '';
  const vers = url.searchParams.get('vers') === 'admin' ? '/admin' : '/';
  const rep = NextResponse.redirect(new URL(vers, url.origin));

  const opts = {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 40,
  };
  const joueur = process.env.JOUEUR_TOKEN && t === process.env.JOUEUR_TOKEN;
  const admin = process.env.ADMIN_TOKEN && t === process.env.ADMIN_TOKEN;
  if (joueur) rep.cookies.set(COOKIE_JOUEUR, t, opts);
  if (admin) rep.cookies.set(COOKIE_ADMIN, t, opts);

  /* En production on ne dit rien : rediriger en silence n'apprend rien à personne.
     En local, une redirection muette coûte une demi-heure de recherche. */
  if (!joueur && !admin && process.env.NODE_ENV !== 'production') {
    return new Response(
      `Jeton refusé.\n\n` +
      `Reçu   : ${t || '(vide)'}\n` +
      `Attendu: JOUEUR_TOKEN ou ADMIN_TOKEN de .env.local\n\n` +
      `En développement l'accès joueur est de toute façon ouvert : va directement sur /.\n` +
      `Ce lien ne sert qu'à /admin, et en production.`,
      { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }
  return rep;
}
