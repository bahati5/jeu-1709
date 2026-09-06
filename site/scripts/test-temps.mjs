/* Le calendrier est la pièce dont tout dépend.
 *
 * Il est entièrement configurable et ne connaît aucun dossier : ce test
 * fabrique donc ses propres programmes plutôt que de s'appuyer sur un
 * contenu qui vit maintenant en base et change tous les jours.
 *
 *   node scripts/test-temps.mjs
 */
import { CONFIG_DEFAUT, normaliserConfig } from '../lib/config.js';
import { etatTemps, jalons, indicesDepuis, ongletsOuverts, verdictOuvert } from '../lib/temps.js';

let ko = 0;
let n = 0;
const dit = (nom, obtenu, attendu) => {
  n++;
  if (JSON.stringify(obtenu) !== JSON.stringify(attendu)) {
    ko++;
    console.error(`✗ ${nom}\n   attendu ${JSON.stringify(attendu)}\n   obtenu  ${JSON.stringify(obtenu)}`);
  }
};
/* [phase, index du jour, dossier du jour] */
const p = (cfg, iso) => {
  const e = etatTemps(cfg, new Date(iso));
  return [e.phase, e.jour ? e.jour.index : null, e.jour ? e.jour.dossier : null];
};

const PROG = ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'];

/* ── 10 → 17 septembre, un dossier par jour, bascule à 06h00 ────────── */
const C = normaliserConfig({ ...CONFIG_DEFAUT, fuseau: 'Europe/Paris', programme: PROG });

dit('huit jours au total', jalons(C).jours.length, 8);
dit('un dossier dès le premier jour', jalons(C).jours[0].dossier, 'un');
dit('un dossier chaque jour', jalons(C).jours.filter((j) => j.dossier).length, 8);
dit('le dernier jour porte le huitième', jalons(C).jours[7].dossier, 'huit');

dit('la veille au soir',           p(C, '2026-09-09T23:00:00+02:00'), ['avant', null, null]);
dit('le 10 à 05h59',               p(C, '2026-09-10T05:59:00+02:00'), ['avant', null, null]);
dit('le 10 à 06h00',               p(C, '2026-09-10T06:00:00+02:00'), ['enquete', 0, 'un']);
dit('le 11 à 05h59 — encore J1',   p(C, '2026-09-11T05:59:00+02:00'), ['enquete', 0, 'un']);
dit('le 11 à 06h00 — J2',          p(C, '2026-09-11T06:00:00+02:00'), ['enquete', 1, 'deux']);
dit('le 16',                       p(C, '2026-09-16T12:00:00+02:00'), ['enquete', 6, 'sept']);
dit('le 17 à 05h59',               p(C, '2026-09-17T05:59:00+02:00'), ['enquete', 6, 'sept']);
dit('le 17 à 06h00 — le verdict',  p(C, '2026-09-17T06:00:00+02:00'), ['enquete', 7, 'huit']);

/* ── un onglet fermé n'existe pas ───────────────────────────────────── */
{
  const e = etatTemps(C, new Date('2026-09-12T10:00:00+02:00'));
  const etat = { resolus: {}, bonus: false };
  dit('en cours de semaine : ni enveloppe ni invitation',
    ongletsOuverts(e, etat), ['fonds', 'tableau', 'manche']);

  const fin = etatTemps(C, new Date('2026-09-17T07:00:00+02:00'));
  dit("le 17, l'enveloppe reste fermée tant que la manche n'est pas résolue",
    verdictOuvert(fin, etat), false);
  dit("le 17, l'enveloppe s'ouvre une fois la manche résolue",
    verdictOuvert(fin, { resolus: { huit: { at: 'x' } } }), true);
  dit("l'invitation n'apparaît que si elle l'ouvre",
    ongletsOuverts(fin, { resolus: { huit: { at: 'x' } }, bonus: true }),
    ['fonds', 'tableau', 'manche', 'enveloppe', 'invitation']);
}

/* ── les indices comptent depuis l'ouverture de la manche, pas depuis l'aube ── */
{
  const t0 = Date.parse('2026-09-11T21:00:00+02:00');   // il ouvre la manche le soir
  for (const [min, attendu] of [[0, 0], [59, 0], [60, 1], [119, 1], [120, 2], [180, 3], [900, 3]]) {
    dit(`${min} min après ouverture`, indicesDepuis(C, t0, t0 + min * 60000), attendu);
  }
  dit('manche jamais ouverte', indicesDepuis(C, 0), 0);
}

/* ── rien n'est figé : on décale tout et on change les heures ───────── */
{
  const D = normaliserConfig({
    ...C, debut: '2026-10-01', fin: '2026-10-05', heureOuverture: 9, heureVerdict: 20,
    programme: ['un', 'deux', null, 'quatre', 'cinq'], paliers: [30, 90],
  });
  dit('cinq jours', jalons(D).jours.length, 5);
  dit('programme retaillé aux dates', D.programme, ['un', 'deux', null, 'quatre', 'cinq']);
  dit('1er octobre',      p(D, '2026-10-01T10:00:00+02:00'), ['enquete', 0, 'un']);
  dit('1er oct. 08h59',   p(D, '2026-10-01T08:59:00+02:00'), ['avant', null, null]);
  dit('2 oct. à 08h59',   p(D, '2026-10-02T08:59:00+02:00'), ['enquete', 0, 'un']);
  dit('2 oct. à 09h00',   p(D, '2026-10-02T09:00:00+02:00'), ['enquete', 1, 'deux']);
  dit('journée sans manche', p(D, '2026-10-03T12:00:00+02:00'), ['enquete', 2, null]);
  dit('5 oct. à 19h59',   p(D, '2026-10-05T19:59:00+02:00'), ['enquete', 3, 'quatre']);
  dit('5 oct. à 20h00 — heure du verdict', p(D, '2026-10-05T20:00:00+02:00'), ['enquete', 4, 'cinq']);
  dit('paliers réduits (30/90)', indicesDepuis(D, 0 + 1, 1 + 30 * 60000), 1);
}

/* ── un dossier ne peut pas tomber deux fois ────────────────────────── */
{
  const E = normaliserConfig({ ...C, debut: '2026-09-10', fin: '2026-09-13', programme: ['un', 'un', 'deux', 'deux'] });
  dit('les doublons sont écartés', E.programme, ['un', null, 'deux', null]);
}

/* ── le décalage horaire est calculé, jamais supposé ────────────────── */
{
  const H = normaliserConfig({
    ...C, debut: '2026-10-24', fin: '2026-10-27', heureOuverture: 6, heureVerdict: 6,
    programme: ['un', 'deux', 'trois', 'quatre'],
  });
  dit('24 oct. — heure d\'été, UTC+2',   p(H, '2026-10-24T06:30:00+02:00'), ['enquete', 0, 'un']);
  dit('26 oct. — heure d\'hiver, UTC+1', p(H, '2026-10-26T06:30:00+01:00'), ['enquete', 2, 'trois']);
  dit('27 oct. — dernier jour',          p(H, '2026-10-27T06:30:00+01:00'), ['enquete', 3, 'quatre']);
}

/* ── un fuseau sans heure d'été : celui du jeu ──────────────────────── */
{
  const L = normaliserConfig({ ...C, fuseau: 'Africa/Libreville', programme: PROG });
  dit('Libreville, le 10 à 05h59', p(L, '2026-09-10T05:59:00+01:00'), ['avant', null, null]);
  dit('Libreville, le 10 à 06h00', p(L, '2026-09-10T06:00:00+01:00'), ['enquete', 0, 'un']);
}

console.log(ko === 0
  ? `✓ Calendrier : ${n} vérifications — bascules, onglets fermés, indices, programme décalé, doublons, changement d'heure, deux fuseaux.`
  : `✗ ${ko} échec(s) sur ${n}.`);
process.exit(ko ? 1 : 0);
