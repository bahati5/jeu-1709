/* Chaque déclencheur doit produire au moins une scène.
 *
 * Ce test existe à cause d'un vrai bug : la séquence d'un dossier, qui ne
 * citait que les scènes de récompense, éteignait en silence l'ouverture du
 * dossier, l'indice, le parchemin et le descellement. Tout « marchait »,
 * simplement plus rien ne s'affichait.
 */
import { SCENES, ANIM_DEFAUT, sequencePour } from '../lib/animations.js';

const DECLENCHEURS = [...new Set(SCENES.map((s) => s.declencheur))];
const catalogue = SCENES.map((s, i) => ({ ...s, ordre: (i + 1) * 10, actif: true }));

const CAS = [
  ['un dossier sans réglage', {}],
  ['un dossier en mode « toutes »', { mode: 'toutes', sequence: [] }],
  ['un dossier qui impose la séquence des récompenses',
    { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] }],
];

let echecs = 0;
console.log('\nANIMATIONS — chaque déclencheur produit une scène\n');

for (const [nom, animations] of CAS) {
  console.log(`\x1b[90m  ${nom}\x1b[0m`);
  for (const d of DECLENCHEURS) {
    const seq = sequencePour(d, { animations }, catalogue, ANIM_DEFAUT, {});
    if (seq.length) {
      console.log(`  \x1b[32m✓\x1b[0m ${d.padEnd(16)} → ${seq.map((s) => s.cle).join(', ')}`);
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${d.padEnd(16)} → aucune scène`);
      echecs++;
    }
  }
}

/* Et « aucune » doit bien vouloir dire aucune. */
const muet = sequencePour('reponse-juste', { animations: { mode: 'aucune' } }, catalogue, ANIM_DEFAUT, {});
if (muet.length) { console.log('  \x1b[31m✗\x1b[0m le mode « aucune » joue quand même'); echecs++; }
else console.log('\n  \x1b[32m✓\x1b[0m le mode « aucune » ne joue rien');

const eteintes = sequencePour('reponse-juste', {}, catalogue, { ...ANIM_DEFAUT, actives: false }, {});
if (eteintes.length) { console.log('  \x1b[31m✗\x1b[0m les animations éteintes jouent quand même'); echecs++; }
else console.log('  \x1b[32m✓\x1b[0m animations éteintes : rien ne joue');

console.log(echecs
  ? `\n\x1b[31m${echecs} déclencheur(s) muet(s).\x1b[0m\n`
  : '\n\x1b[32mToutes les scènes se déclenchent.\x1b[0m\n');
process.exit(echecs ? 1 : 0);
