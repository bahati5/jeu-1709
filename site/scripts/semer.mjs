#!/usr/bin/env node
/* Verse LE CARTON 47 dans la base : la configuration et les huit jours.
 *
 *   npm run semer
 *
 * Ce script n'est PAS le jeu. C'est un chargement unique, pour t'éviter
 * de taper trente mille signes dans des formulaires. Une fois versé, tout
 * se modifie depuis /admin — et rien de tout ça ne vit dans le code de
 * l'application.
 *
 * Relançable : il écrase les huit dossiers listés ici, et rien d'autre.
 * Les huit récompenses sont volontairement vides : elles sont à toi.
 */
import { readFile } from 'node:fs/promises';

try {
  const txt = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  for (const l of txt.split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const { enregistrerDossier, ecrireConfig, pilote } = await import('../lib/donnees.js');

/* ================================================================== */
/*  JOUR 1 · 10 septembre — Le parapluie de la voiture 3               */
/*  Sept témoins, deux menteurs. Solution unique vérifiée sur les 147  */
/*  combinaisons : vendredi, menteurs n° 4 (gardien) et 5 (Mvé).       */
/* ================================================================== */

const reponsesJ1 = [];
for (const j of ['vendredi', 'le vendredi']) {
  for (const [a, b] of [['4', '5'], ['5', '4']]) {
    reponsesJ1.push(`${j} ${a} ${b}`, `${j} ${a} et ${b}`, `${a} ${b} ${j}`);
  }
}
for (const g of ['gardien', 'le gardien']) {
  for (const m of ['mve', 'soeur mve', 'sœur mvé', 'mvé', 'la soeur']) {
    for (const lien of [' ', ' et ']) {
      reponsesJ1.push(`vendredi ${g}${lien}${m}`, `vendredi ${m}${lien}${g}`);
    }
  }
}

const J1 = {
  slug: 'camion-ordures',
  titre: 'Le parapluie de la voiture 3',
  genre: 'Logique — sept témoins, deux menteurs',
  type: 'saisie', ordre: 0, chrono_ref: 35,
  payload: {
    enonce: `23h47 — numéro inconnu

« Bonsoir. Vous ne me connaissez pas.

Je m'appelle Adèle Mbeng, archiviste à la mairie centrale. Depuis six mois je numérise les registres de naissance de 1999. Il y a un acte, dans le carton 47, qui n'aurait jamais dû être écrit.

Je ne peux en parler à personne ici, et je ne peux pas vous envoyer le document : les sorties de fichiers sont journalisées, je serais repérée en une heure. Je vais devoir vous le faire passer en morceaux, cachés dans des choses sans intérêt.

Avant, je dois savoir si vous en êtes capable. Il y a un vieux dossier de 1994 dans le même carton. Sept voisins, deux menteurs. Personne ne l'a jamais résolu.

Faites-le et je continue.

P.-S. — Trois choses, et ne me demandez pas pourquoi.
Le carton 47 ne se consulte qu'entre le coucher et le lever du soleil.
Ce qui en sort la nuit doit y être rentré avant l'aube.
On n'écrit jamais dans le registre. On recopie à côté. »

— — —

DOSSIER 1 · classé le 4 mars 1994
Sept dépositions recueillies au 12 de la rue Ndjolé.

Un locataire du troisième a quitté l'immeuble un jour de la semaine dernière, et n'y est pas revenu. Sept voisins ont été entendus. Le rapport ne conclut rien, sauf une ligne, soulignée deux fois :

    « Exactement deux de ces sept personnes mentent. »

1 · Mme ONDO — fiche F-1041
« C'était un jour de passage du camion. »
   Le camion passe le mardi et le vendredi.

2 · M. BALEP — fiche F-1042
« C'était le lendemain du jour où j'ai touché ma paie. »
   M. Balep est payé chaque jeudi.

3 · LA BOULANGÈRE — fiche F-1043
« Ma boutique était ouverte, il est passé devant. »
   La boulangerie ferme le lundi et le dimanche.

4 · LE GARDIEN — fiche F-5017
« C'était deux jours après le marché. »
   Le marché a lieu le jeudi.

5 · SŒUR MVÉ — fiche F-1045
« Au moins un des deux, Ondo ou Balep, ment. »

6 · M. TCHOUA — fiche F-1046
« C'était un jour ouvré. »

7 · AWA — fiche F-1047
« Ce n'était ni un mardi ni un mercredi. »`,
    consigne: 'Quel jour, et qui sont les deux menteurs ?',
    placeholder: 'le jour, puis les deux numéros',
  },
  solution: { reponses: reponsesJ1, resultat: 'VENDREDI' },
  indices: [
    "Sept jours, vingt et une paires de menteurs possibles : cent quarante-sept combinaisons. C'est peu. Rien n'interdit de les parcourir une à une.",
    "La cinquième déposition ne parle pas du jour. Elle parle des autres dépositions. Traitez-la à part : elle peut être fausse sans qu'aucune de celles qu'elle vise le soit.",
    "Supposez un instant que le gardien dise vrai, et comptez combien de personnes deviennent menteuses. Vous verrez que c'est beaucoup trop.",
  ],
  anomalie: {
    ou: 'Les numéros de fiche des sept témoins.',
    texte: "La fiche du gardien porte le numéro F-5017. Les six autres se suivent — F-1041, 1042, 1043, puis 1045, 1046, 1047. Il manque F-1044, et le gardien occupe sa place avec un numéro venu d'ailleurs.",
    reponses: ['F-5017', '5017', 'la fiche du gardien', 'fiche du gardien', 'le numero de fiche du gardien',
               'numero de fiche', 'les numeros de fiche', 'F-1044', 'il manque F-1044', 'il manque le 1044'],
  },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 2 · 11 septembre — Le masque au certificat                    */
/*  60 → mars 1994, 120 numéros/an. (726-60)/120 = 5,55 ans → 1999.    */
/* ================================================================== */

const J2 = {
  slug: 'le-masque',
  titre: 'Le masque au certificat',
  genre: 'Expertise — interpolation',
  type: 'saisie', ordre: 1, chrono_ref: 55,
  payload: {
    enonce: `Adèle, 08h15 — « Apprenez à ne pas croire un papier tamponné. Vous en verrez d'autres. »

04h12 — un second numéro, minuscules, sans ponctuation :

    n'ouvrez pas ce qu'elle vous envoie

Vous montrez le message à Adèle. Elle met vingt minutes à répondre, ce qui ne lui ressemble pas.

    « Il s'appelle Okoumé. Il était greffier ici. On l'a radié en 2019.
      Ne lui répondez pas. Et surtout ne lui dites pas où vous en êtes. »

09h30 — un troisième message. Ruth, 23 ans, stagiaire à la numérisation :

    « bonjour !! excusez moi de vous deranger comme ça 😅 jai vu votre nom
      dans le journal des consultations du fonds 47 et personne ne consulte
      jamais ce fonds. si vous cherchez quelque chose jai acces au scanner
      moi. dites moi je peux aider »

— — —

DOSSIER 2 · saisie du 9 novembre 2001

Un masque, vendu comme pièce ancienne, accompagné d'un certificat d'authenticité en bonne et due forme :

    « Pièce sculptée en 1974. Certifiée conforme. »

Saisi le même jour, chez le même homme : son registre d'atelier. Trois entrées portent une date lisible.

    n° 060 — mars 1994
    n° 300 — mars 1996
    n° 540 — mars 1998

L'atelier a été déclaré à la préfecture le 2 février 1994.
Le masque porte, gravé sous la mâchoire, le numéro 726.

En quelle année a-t-il réellement été fabriqué ?`,
    consigne: "L'année, en quatre chiffres.",
    placeholder: 'une année',
  },
  solution: { reponses: ['1999'], resultat: '1999' },
  indices: [
    'Les trois entrées datées suffisent à établir un rythme. Combien de numéros par an ?',
    'Cent vingt numéros par an, à partir du n° 60 en mars 1994. Où tombe le 726 ?',
    '(726 − 60) ÷ 120 = 5,55 ans après mars 1994.',
  ],
  anomalie: {
    ou: 'La date du certificat, comparée à celle de la déclaration en préfecture.',
    texte: "Le certificat date la pièce de 1974 — vingt ans avant l'ouverture de l'atelier. Le certificat n'est pas seulement faux : il a été fabriqué par la même main que le masque.",
    reponses: ['le certificat', 'le certificat est faux', '1974', "l'atelier n'existait pas", 'atelier ouvert en 1994'],
  },
  recompense: { nom: '', precision: '', gag: true },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 3 · 12 septembre — Le carnet fermé                            */
/*  Serrure, puis Vigenère de clé MARAUDEUR. Le mois n'est jamais      */
/*  écrit : il est décrit.                                             */
/* ================================================================== */

const J3 = {
  slug: 'le-parchemin',
  titre: 'Le carnet fermé',
  genre: 'Cryptanalyse',
  type: 'serrure', ordre: 2, chrono_ref: 75,
  payload: {
    invite: `Adèle n'a pas écrit de la journée.

C'est Okoumé qui envoie la pièce à sa place. Et elle est mieux préparée que les siennes.

    un carnet qui ne s'ouvre pas est un carnet qui attend
    qu'on le lui demande correctement

    je suppose que vous savez comment on demande poliment à un parchemin

    elle vous ment sur un point. un seul. je ne vous dirai pas lequel,
    vous ne me croiriez pas et vous auriez raison

Le soir, Ruth :

    « jai retrouvé le cliché de 1999 dans le carton !! il y a 6 personnes
      dessus mais le registre de garde en liste 5 😭 »

— — —

DOSSIER 3 · pièce unique

Une page vierge, dans une chemise vide.
Au dos, à la plume :

    « Ce carnet ne s'ouvre pas.
      Il faut le lui demander correctement. »`,
    consigne: 'Quel mois le texte désigne-t-il ?',
    fermeture: 'Méfait accompli',
  },
  solution: {
    passe: 'Je jure solennellement que mes intentions sont mauvaises',
    revele: `XE DOCV UOV VE THYUGBV QSK CYOYC FG
LR BUOEHTQ SLCWHHY R XA MIYUKY VF OL
LYV IHWMNKS LHTLVZNVNN OI WYQMZN XH P YTALV`,
    reponses: ['septembre', 'le mois de septembre', 'sept'],
    resultat: 'SEPTEMBRE',
  },
  indices: [
    "L'analyse de fréquences ne donnera rien : la lettre la plus fréquente plafonne à 9,7 %, là où un E français en pèse 15. Ce n'est pas une substitution simple.",
    'Cherchez les groupes de lettres qui se répètent et mesurez les distances entre eux. Kasiski, 1863. La clé a neuf lettres.',
    "La clé est le mot que vous avez lu aujourd'hui sans y prêter attention : MARAUDEUR.",
  ],
  anomalie: {
    ou: "Sous le texte déchiffré, une ligne d'une autre encre.",
    texte: "« Si tu lis ceci, c'est que tu as ma clé. Alors tu sais déjà que je n'ai jamais résolu ces affaires. » Il n'écrit pas au lecteur. Il écrit à quelqu'un d'autre.",
    reponses: ['une autre encre', 'la derniere ligne', "il ecrit a quelqu'un", 'autre ecriture', "il n'a jamais resolu"],
  },
  animations: { mode: 'toutes', sequence: ['parchemin', 'tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 4 · 13 septembre — Le wagon qui n'a pas roulé                 */
/*  Le creux VISIBLE (5-8) est un vrai congé déclaré : c'est le leurre.*/
/*  La vraie période maquillée est le 12-19 : moyenne normale (96),    */
/*  écart-type impossible (0,5 contre 38,9 ailleurs).                  */
/* ================================================================== */

const RELEVES = [
  [1, 48377], [2, 48514], [3, 48682], [4, 48747], [5, 48783], [6, 48815],
  [7, 48834], [8, 48853], [9, 48996], [10, 49125], [11, 49201], [12, 49297],
  [13, 49394], [14, 49490], [15, 49587], [16, 49683], [17, 49780], [18, 49876],
  [19, 49973], [20, 50096], [21, 50250], [22, 50382], [23, 50457], [24, 50616],
  [25, 50675], [26, 50753], [27, 50857], [28, 50924], [29, 51086], [30, 51160],
];

const J4 = {
  slug: 'jours-creux',
  titre: "Le wagon qui n'a pas roulé",
  genre: 'Analyse de données',
  type: 'saisie', ordre: 3, chrono_ref: 55,
  payload: {
    enonce: `Vous remontez le fil de la veille. Il y a un horodatage sans message : Adèle a écrit le 12 à 09h04. Le message a été supprimé du canal avant que vous l'ouvriez.

Ce n'est pas une surveillance extérieure. Quelqu'un a la main sur le canal lui-même.

Balep, le vigile de nuit, vous propose un marché : il peut photographier le carton pendant sa ronde, contre un service.

    « moi je vois tout la nuit chef. mais faut voir hein. »

— — —

DOSSIER 4 · relevés du compteur général

Le bâtiment est réputé avoir fonctionné sans interruption tout le mois.
Index relevé chaque soir, en kWh :

${RELEVES.map(([j, v]) => `    ${String(j).padStart(2, ' ')} → ${v}`).join('\n')}

Une note au dossier signale une fermeture administrative du 5 au 8 :
congé collectif, déclaré, régulier.

Trouvez les jours où le bâtiment ne fonctionnait pas — et qu'on a voulu cacher.`,
    consigne: 'La période, en deux nombres.',
    placeholder: 'du .. au ..',
  },
  solution: {
    reponses: ['12 19', 'du 12 au 19', '12 au 19', '12-19', 'du 12 septembre au 19 septembre'],
    resultat: 'DU 12 AU 19',
  },
  indices: [
    "Un index ne dit rien. Ce sont les écarts d'un jour à l'autre qu'il faut regarder.",
    "Le creux du 5 au 8 est réel et déclaré : ce n'est pas lui. Cherchez une période dont la moyenne est parfaitement normale.",
    "Calculez l'écart-type des écarts journaliers, par tranches. Ailleurs il vaut environ 39. Sur huit jours consécutifs, il tombe à 0,5. Un compteur réel ne respire jamais aussi régulièrement.",
  ],
  anomalie: {
    ou: 'Les écarts de la période maquillée, un par un.',
    texte: "Les écarts fabriqués alternent 96, 97, 96, 97 — la signature d'un générateur, pas d'un bâtiment. Celui qui a maquillé ces relevés savait quelle moyenne imiter, mais pas qu'il fallait aussi imiter le désordre.",
    reponses: ['96 97', 'ils alternent', "l'alternance", 'trop regulier', 'un generateur', '96 et 97'],
  },
  recompense: { nom: '', precision: '', gag: false },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 5 · 14 septembre — Cinq voyageurs                             */
/*  Celui qui se contredit (Nze) est innocent. L'imposteur (Oyono)     */
/*  n'apporte AUCUNE information non déductible des quatre autres.     */
/* ================================================================== */

const J5 = {
  slug: 'imposteur',
  titre: 'Cinq voyageurs',
  genre: 'Déduction sociale',
  type: 'imposteur', ordre: 4, chrono_ref: 50,
  payload: {
    enonce: `Adèle, 07h02. Froide.

    « Pourquoi lui avez-vous parlé du carton 47 ?
      Je ne l'avais dit qu'à vous. »

Vous n'avez rien dit. Vous n'avez jamais répondu à Okoumé.

Vous comparez. Et vous comprenez : depuis trois jours, Okoumé écrit à Adèle en se faisant passer pour vous. Deux conversations existent. Une seule est vraie.

Vous n'avez pas seulement été surveillé. Vous avez été employé.

Et Ruth ne répond plus. Son dernier message date de 23h14, hier :

    « attends je crois quil y a quelquun »

— — —

DOSSIER 5 · cinq dépositions

Cinq personnes déclarent avoir participé à la même mission de relevé, une nuit de septembre. Quatre y étaient. La cinquième a appris son rôle.`,
    declarations: [
      "MENGUE — « On est partis à quatre heures dix. Il pleuvait sur la route du bas. J'ai porté la caisse verte, celle dont la poignée était cassée. Le gardien nous a ouvert sans rien demander. Je crois qu'il s'appelait Ondo, ou Ondja. »",
      "BEKALE — « Quatre heures et quelques. La route du bas était impraticable, on a pris l'autre. J'avais oublié mes gants, Mengue m'a prêté les siens. Le portail était déjà ouvert quand on est arrivés. »",
      "NZE — « Le départ était à quatre heures dix. Enfin, quatre heures et demie, je ne sais plus. Il pleuvait. La caisse verte pesait une tonne. J'ai laissé tomber un projecteur et personne ne m'a rien dit, ce qui m'a surpris. »",
      "OYONO — « Quatre heures dix, il pleuvait, on a pris la route du bas, Mengue portait la caisse verte à la poignée cassée, et le gardien a ouvert sans rien demander. »",
      "ABESSOLO — « Je me souviens surtout du froid. On a attendu vingt minutes devant le portail que quelqu'un retrouve la clé. Bekale jurait dans le noir. Je n'ai vu la caisse verte qu'au retour. »",
    ],
    consigne: "Laquelle de ces cinq personnes n'y était pas ?",
  },
  solution: {
    reponses: ['oyono', 'la quatrieme', '4', 'quatre'],
    resultat: 'OYONO',
    imposteur: 3,
  },
  indices: [
    "Un vrai souvenir est imparfait. Celui qui se contredit se souvient mal — ce n'est pas la même chose que mentir.",
    'Comparez ce que chaque déposition APPORTE. Quatre d\'entre elles contiennent au moins un détail que personne d\'autre ne donne.',
    "Une seule déposition ne contient rien qui ne soit déjà dans les autres. Elle n'a pas été vécue, elle a été lue.",
  ],
  anomalie: {
    ou: "Le message d'Adèle de ce jour-là, comparé à votre conclusion.",
    texte: "Adèle désigne Nze avec assurance, et elle se trompe. Ce n'est pas une erreur : Nze est la seule des cinq qui aurait pu la contredire.",
    reponses: ['elle se trompe', 'adele se trompe', 'le message est faux', 'nze', 'elle ment', 'adele ment'],
  },
  recompense: { nom: '', precision: '', gag: true },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 6 · 15 septembre — Le scellé forcé                            */
/*  hex → ROT13 → « ARRETE 561 DU 10 SEPTEMBRE ».                      */
/*  Le champ Artist est un leurre : le nom accusé la veille.           */
/* ================================================================== */

const J6 = {
  slug: 'le-scelle',
  titre: 'Le scellé forcé',
  genre: 'Forensique',
  type: 'saisie', ordre: 5, chrono_ref: 70,
  payload: {
    enonce: `Vous ne demandez plus la permission. Vous forcez le scellé et vous remontez au dossier personnel d'Okoumé.

    CONSEIL DE DISCIPLINE — 2019
    M. Okoumé, greffier, radié pour refus caractérisé
    d'exécuter l'ordre de destruction du carton 47.

Vous relisez trois fois. Il n'a jamais voulu détruire le dossier. Il a été radié pour avoir refusé de le faire.

Puis Mme Ondo, direction des archives, en-tête officiel, deux lignes :

    « Mlle Ruth Ekomi a été mise à pied à titre conservatoire le 14 septembre,
      à la suite d'un accès non autorisé au fonds 47. Nous vous saurions gré
      de cesser toute sollicitation. »

C'est vous qui lui aviez demandé de scanner le cliché.

Balep, le même soir : « la dame m'a demandé qui venait la nuit. j'ai dit. désolé chef. »

Okoumé, 03h50 :

    vous êtes allé trop loin maintenant
    si vous vous arrêtez là ils reprendront le dossier et le brûleront
    et elle sera tranquille
    si vous continuez vous la trouverez
    je ne vous aiderai plus mais je ne vous empêcherai plus
    choisissez vite il reste deux jours

Elle.

— — —

DOSSIER 6 · scellé numérique

Une photographie versée au dossier. On n'en a gardé que les métadonnées :

    Artist            : C. NZE
    DateTimeOriginal  : 1999:09:10 08:12:44
    ImageDescription  : 4e4545524752203536312051482031302046524347525a4f4552

Sur la chemise, une phrase :

    « La clé est dans l'image, pas sur l'image. »`,
    consigne: 'Le numéro du document.',
    placeholder: 'un nombre',
  },
  solution: {
    reponses: ['561', 'arrete 561', "l'arrete 561", 'arrete n 561'],
    resultat: '561',
  },
  indices: [
    "Le champ Artist est un nom. Un nom n'est pas une clé — et celui-là, vous l'avez déjà vu hier.",
    'ImageDescription est de l\'hexadécimal. Convertissez-le en texte : vous obtiendrez quelque chose de lisible mais faux.',
    'Ce que vous obtenez est décalé de treize lettres. ROT13.',
  ],
  anomalie: {
    ou: 'Le champ Artist.',
    texte: "Le leurre porte le nom qu'Adèle accusait la veille. Elle n'a pas seulement désigné le mauvais coupable : elle avait préparé la pièce qui devait le confirmer.",
    reponses: ['artist', 'le champ artist', 'c nze', 'nze', 'le leurre', "c'est un leurre"],
  },
  recompense: { nom: '', precision: '', gag: false },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 7 · 16 septembre — Qui tenait la clé                          */
/*  Grille : ABESSOLO 03h30 · OYONO 03h50 · MENGUE 04h10 (la clé)      */
/*           NZE 04h30 · BEKALE 04h50. Unique avec la 10e contrainte.  */
/* ================================================================== */

const J7 = {
  slug: 'quatre-heures-dix',
  titre: 'Qui tenait la clé',
  genre: 'Grille de déduction',
  type: 'grille', ordre: 6, chrono_ref: 60,
  payload: {
    enonce: `Il ne reste qu'une question : qui, la nuit du 16 au 17 septembre 1999, pouvait écrire dans le registre.

— — —

DOSSIER 7 · le registre de garde

Cinq personnes se sont relayées cette nuit-là, une par créneau de vingt minutes,
de 03h30 à 05h10. Une seule détenait la clé du registre.

À quelle heure exactement le registre a-t-il été ouvert ?`,
    categories: ['MENGUE', 'BEKALE', 'NZE', 'OYONO', 'ABESSOLO',
                 '03h30', '03h50', '04h10', '04h30', '04h50'],
    contraintes: [
      'Abessolo a pris le premier créneau ou le dernier.',
      'Bekale est arrivé exactement quarante minutes après Mengue.',
      "Nze n'a jamais eu la clé.",
      "La personne qui détenait la clé n'était ni la première ni la dernière.",
      'Oyono a précédé Nze, mais pas immédiatement.',
      "Mengue n'était pas là à 03h30.",
      'Le registre a été ouvert pendant le créneau de celui qui détenait la clé.',
      'Abessolo ne détenait pas la clé.',
      'Bekale a pris le dernier créneau de la nuit.',
      'Celui qui détenait la clé a pris son créneau après Oyono.',
    ],
    consigne: "L'heure d'ouverture du registre.",
  },
  solution: {
    reponses: ['04h10', '4h10', '04:10', '4:10', 'quatre heures dix'],
    resultat: '04H10',
  },
  indices: [
    'Commencez par Bekale : la neuvième contrainte le fixe, et la deuxième fixe alors Mengue.',
    'Abessolo ne peut plus qu\'être au premier créneau. Restent Nze et Oyono pour deux places.',
    "La clé n'est ni au premier ni au dernier créneau, ni chez Nze, ni chez Abessolo, et elle est après Oyono. Il ne reste qu'une personne.",
  ],
  anomalie: {
    ou: 'Les cinq noms, comparés à ceux du dossier 5.',
    texte: "Ce sont les cinq mêmes personnes qu'au dossier 5, dans une affaire censée n'avoir aucun rapport. Deux dossiers du fonds partagent leurs témoins.",
    reponses: ['les memes noms', 'ce sont les memes', 'les memes personnes', 'dossier 5', 'les memes temoins'],
  },
  recompense: { nom: '', precision: '', gag: false },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 8 · 17 septembre 06h00 — La convergence                       */
/* ================================================================== */

const J8 = {
  slug: 'l-enveloppe',
  titre: 'La convergence',
  genre: 'Le dernier matin',
  type: 'saisie', ordre: 7, chrono_ref: null,
  payload: {
    enonce: `ADÈLE MBENG tenait la clé du registre en 1999.

Elle n'a pas découvert cet acte il y a six mois en numérisant. Elle l'a écrit il y a vingt-sept ans. Elle a passé six mois à chercher quelqu'un capable de remonter jusqu'à elle — parce qu'une confession, on la croit ou on ne la croit pas ; une preuve, non.

    « Oui. Je vous ai fait travailler six jours pour arriver à moi.
      C'était le seul moyen que ça compte.
      Pour Ruth, je suis désolée. Je ne pensais pas qu'elle irait aussi vite.

      La maternité Sainte-Odile a été fermée par arrêté n° 561,
      du 12 au 19 septembre 1999. Huit jours. Un bâtiment
      administrativement mort.

      Un enfant y est né quand même. Je l'ai mis au monde moi-même,
      il n'y avait personne d'autre.

      Un enfant sans déclaration n'a pas de nom. Pas d'école, pas de
      papiers, pas de vie. Alors j'ai écrit le 10 — le dernier jour légal
      avant la fermeture.

      Et j'ai choisi le 10 pour une raison précise. Regardez la colonne
      « jour » du registre. Il fallait qu'elle reste vraie. »

— — —

Vos sept résultats :

    Dossier 1    VENDREDI
    Dossier 2    1999
    Dossier 3    SEPTEMBRE
    Dossier 4    DU 12 AU 19
    Dossier 5    OYONO
    Dossier 6    561
    Dossier 7    04H10

Un vendredi. En septembre 1999. Entre le 12 et le 19.`,
    consigne: 'La date, en huit chiffres.',
    placeholder: 'JJMMAAAA',
  },
  solution: {
    reponses: ['17091999', '17 09 1999', '17/09/1999', '17-09-1999'],
    resultat: '17 SEPTEMBRE 1999',
  },
  indices: [
    'Les vendredis de septembre 1999 sont les 3, 10, 17 et 24.',
    'Un seul tombe entre le 12 et le 19.',
  ],
  recompense: { nom: '', precision: '', gag: false },
  /* Le tampon, le huitième scellé, le chrono — puis le descellement, qui
     vient de son propre déclencheur (`verdict`), pas d'ici. */
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */

const DOSSIERS = [J1, J2, J3, J4, J5, J6, J7, J8];

const CONFIG = {
  titre: 'LE CARTON 47',
  debut: '2026-09-10',
  fin: '2026-09-17',
  fuseau: 'Africa/Libreville',
  heureOuverture: 6,
  heureVerdict: 6,

  /* L'habillage — modifiable depuis /admin, onglet « L'habillage ». */
  skin: 'grimoire',
  amorcage: true,
  surtitre: 'GREFFE DU CARTON 47',
  cote: '1709',
  intro: {
    titre: 'Huit jours dans un carton.',
    texte: [
      "Du 10 au 17 septembre, un dossier s'ouvre chaque jour. Une déposition, une pièce, une serrure — jamais deux fois le même genre d'énigme.",
      'Chaque dossier résolu relève un scellé. Huit scellés, et le dix-sept au soir, tout ce qui était fermé s\'ouvre en même temps.',
      "Personne ne sait qui tient le greffe. On l'appelle l'Archiviste. Il a résolu chaque dossier avant vous, en un temps qu'il ne révèle qu'une fois le vôtre déposé — jamais avant.",
      'Rien n\'oblige à faire vite. Mais le battre, ne serait-ce qu\'une fois, en dit long sur qui vous êtes.',
    ].join('\n'),
    bouton: 'Entrer dans le greffe',
  },
  attente: {
    titre: "Le dossier n'est pas encore versé.",
    texte: "Il s'ouvrira de lui-même. Rien à faire d'ici là, sinon y penser.",
  },
  piedFonds: 'CE QUI EST SCELLÉ LE RESTE JUSQU’AU DIX-SEPT.',

  programme: DOSSIERS.map((d) => d.slug),
  codeFinal: '17091999',
  paliers: [60, 120, 180],
  tentativesMax: 5,
  blocageMinutes: 10,
  tailleFonds: 47,
  seuilAnomalies: 4,
  titreVerdict: "L'acte rectifié",
  lettreFinale: `Adèle n'existe pas. Okoumé non plus. Ruth n'a jamais été renvoyée,
et je m'excuse pour la nuit où tu l'as cru.

Le carton 47 est vide, l'arrêté est faux, et le registre est de ma main.

La seule chose vraie de toute cette affaire, c'est que tu es né un vendredi
17 septembre 1999, que la mairie s'est trompée de sept jours, et que
quelqu'un a mis sept jours à te les rendre.

Bon anniversaire, bébé.
Ce soir. 17h00. Deux couverts.`,
  lettreFinaleAnomalies: `Tu avais compris depuis mardi. Tu as continué quand même.
C'est pour ça que c'est toi.

Adèle n'existe pas. Okoumé non plus. Ruth n'a jamais été renvoyée, et je
m'excuse pour la nuit où tu l'as cru. Le carton 47 est vide, l'arrêté est
faux, et le registre est de ma main.

La seule chose vraie, c'est que tu es né un vendredi 17 septembre 1999,
que la mairie s'est trompée de sept jours, et que quelqu'un a mis sept
jours à te les rendre.

Bon anniversaire, bébé.
Ce soir. 17h00. Deux couverts.`,
  refus: [
    'Dossier scellé. Consultation réservée.',
    "Ce dossier a été retiré du fonds le 3 juin 1997. Aucun motif n'est indiqué.",
    'Chemise vide.',
    "Vous n'avez pas terminé celui d'aujourd'hui.",
    'Réservé.',
    "Le dossier existe. Vous, pas encore.",
    'Consultation refusée : demande hors des heures de nuit.',
  ],
};

/* ================================================================== */

console.log(`\nPilote : ${pilote()}`);
if (pilote() !== 'supabase') {
  console.log("\x1b[33m⚠ Supabase n'est pas branché : tout part dans .data/fonds47.json.\x1b[0m");
}

for (const d of DOSSIERS) {
  await enregistrerDossier({ recompense: { nom: '', precision: '', gag: false }, ...d });
  const n = (d.solution?.reponses || []).length;
  const i = (d.indices || []).length;
  console.log(`\x1b[32m✓\x1b[0m jour ${d.ordre + 1} · ${d.titre}  \x1b[90m(${d.type}, ${n} formulation${n > 1 ? 's' : ''}, ${i} indice${i > 1 ? 's' : ''})\x1b[0m`);
}

await ecrireConfig(CONFIG);
console.log(`\x1b[32m✓\x1b[0m ${CONFIG.titre} — ${CONFIG.debut} → ${CONFIG.fin}, ${CONFIG.fuseau}, bascule à ${CONFIG.heureOuverture}h`);
console.log(`\x1b[32m✓\x1b[0m indices demandables à ${CONFIG.paliers.join(', ')} min après ouverture de la manche`);

console.log(`
\x1b[34mPour jouer aujourd'hui\x1b[0m
  npm run aujourdhui        puis  npm run dev
  npm run aujourdhui -- 5   pour sauter au jour 5

\x1b[34mCe qui t'attend dans /admin\x1b[0m
  · les 8 récompenses sont vides — les jours 2 et 5 portent le drapeau « gag »
  · les paliers d'indices se règlent dans Les règles
  · les deux lettres du 17 sont écrites, à relire et à signer autrement si tu veux
`);
