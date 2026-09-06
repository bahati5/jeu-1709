/* Le client Supabase. SERVEUR UNIQUEMENT.
 *
 * Il utilise la clé `service_role`, qui traverse RLS et voit donc les
 * réponses des dossiers. Si ce module se retrouvait dans un bundle
 * navigateur, le joueur lirait toutes les solutions dans l'onglet réseau.
 *
 * D'où le garde-fou ci-dessous, et la règle : aucun composant client
 * n'importe ce fichier. Le front parle uniquement à /api/*.
 */
import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error(
    'lib/supabase.js a été importé côté navigateur. ' +
    'La clé service_role ne doit jamais quitter le serveur.',
  );
}

let client = null;

export function supa() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) return null;          // pas configuré : on bascule sur le fichier
  client = createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'fonds47' } },
  });
  return client;
}

export const supaActif = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const BUCKET = process.env.SUPABASE_BUCKET || 'fonds47';
