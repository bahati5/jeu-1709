/* La porte de la console.
 *
 * Un mot de passe, un cookie, rien d'autre. Pas de compte, pas d'e-mail :
 * une seule personne s'en sert.
 */
import { COOKIE_ADMIN, mdpConfigure, mdpJuste, sceau, json } from '@/lib/acces';

export const dynamic = 'force-dynamic';

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

export async function POST(req) {
  const corps = await req.json().catch(() => ({}));

  if (!mdpConfigure()) {
    /* Utile seulement en local : en ligne, ça ne doit jamais arriver. */
    return json({ ok: false, pasConfigure: true }, 200);
  }

  if (!mdpJuste(corps.mdp)) {
    /* Une seconde de patience à chaque échec. Ça ne gêne personne qui
       connaît le mot de passe, et ça rend l'essai en série inutile. */
    await attendre(1000);
    return json({ ok: false }, 200);
  }

  const rep = json({ ok: true });
  rep.headers.append('Set-Cookie', [
    `${COOKIE_ADMIN}=${sceau(process.env.ADMIN_MDP)}`,
    'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${60 * 60 * 24 * 40}`,
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; '));
  return rep;
}

/* Se déconnecter. */
export async function DELETE() {
  const rep = json({ ok: true });
  rep.headers.append('Set-Cookie',
    `${COOKIE_ADMIN}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return rep;
}
