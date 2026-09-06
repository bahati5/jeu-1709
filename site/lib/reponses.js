/* La vérification des réponses.
 *
 * Les réponses vivent dans la colonne `solution` des dossiers, en base.
 * Elles ne sont jamais servies au client : seule cette fonction, appelée
 * depuis /api/verify, les voit.
 *
 * La comparaison est volontairement large. Refuser une bonne réponse
 * pour une apostrophe coûte une soirée ; accepter une variante ne coûte rien.
 */

export function normaliser(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // accents
    .replace(/[:.]/g, 'h')                              // 16:15 = 16.15 = 16h15
    .replace(/['’\-_,;]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const compact = (s) => normaliser(s).replace(/ /g, '');

/** Les formulations acceptées d'un dossier, quelle que soit la façon dont elles sont saisies. */
export function attendues(solution) {
  const brut = solution?.reponses;
  if (Array.isArray(brut)) return brut.map(String).filter(Boolean);
  if (typeof brut === 'string') return brut.split('|').map((x) => x.trim()).filter(Boolean);
  return [];
}

export function verifier(solution, saisie) {
  const n = normaliser(saisie);
  if (!n) return false;
  const c = n.replace(/ /g, '');
  return attendues(solution).some((a) => normaliser(a) === n || compact(a) === c);
}

/** La phrase de passe d'une serrure — même tolérance. */
export function verifierPasse(solution, saisie) {
  const attendu = solution?.passe;
  if (!attendu) return false;
  const n = normaliser(saisie);
  return normaliser(attendu) === n || compact(attendu) === n.replace(/ /g, '');
}

/** La phrase qui referme le parchemin. */
export function verifierFermeture(payload, saisie) {
  const attendu = payload?.fermeture;
  if (!attendu) return false;
  return normaliser(attendu) === normaliser(saisie);
}
