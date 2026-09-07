#!/usr/bin/env node
/* Peuple la base : la configuration et les huit jours.
 *
 *   node scripts/semer.mjs
 *
 * Ce script n'est PAS le jeu. C'est un chargement unique, pour t'éviter
 * de taper trente mille signes dans des formulaires. Une fois versé, tout
 * se modifie depuis /admin — et rien de tout ça ne vit dans le code de
 * l'application.
 *
 * Relançable : il écrase les huit dossiers listés ici, et rien d'autre.
 *
 * ÉTAT : le dossier 1 est fini. Les dossiers 2 à 8 sont des brouillons
 * JOUABLES — vraies mécaniques, vraies solutions, textes à durcir. Leur
 * titre porte « (brouillon) » pour que tu voies d'un coup d'œil ce qui
 * reste à écrire. Enlève la mention quand tu es contente du texte.
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
/*  JOUR 1 — Le camion des ordures                                     */
/*  Sept témoins, deux menteurs. Solution unique vérifiée sur les 147  */
/*  combinaisons : vendredi, menteurs n° 4 et 5.                       */
/* ================================================================== */

const reponsesJ1 = [];
for (const j of ['vendredi', 'le vendredi']) {
  for (const [a, b] of [['4', '5'], ['5', '4']]) {
    reponsesJ1.push(`${j} ${a} ${b}`, `${j} ${a} et ${b}`, `${a} ${b} ${j}`);
  }
}
/* Il peut nommer les menteurs au lieu de les numéroter — avec ou sans
   « et » entre les deux, dans un sens ou dans l'autre. Refuser une bonne
   réponse pour une conjonction coûte une soirée ; l'accepter ne coûte rien. */
for (const g of ['gardien', 'le gardien']) {
  for (const m of ['mve', 'soeur mve', 'sœur mvé', 'mvé', 'la soeur']) {
    for (const lien of [' ', ' et ']) {
      reponsesJ1.push(`vendredi ${g}${lien}${m}`, `vendredi ${m}${lien}${g}`);
    }
  }
}

const J1 = {
  slug: 'camion-ordures',
  titre: 'Le camion des ordures',
  genre: 'Logique — sept témoins, deux menteurs',
  type: 'saisie', ordre: 0, chrono_ref: 35,
  payload: {
    enonce: `Note de marge, encre bleue :

« Je commence par celui-là. Trente-cinq minutes pour moi, et je connaissais le tour. Vous en mettrez plus. Tout le monde en met plus, parce que tout le monde commence par croire celui qui donne un chiffre. »

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
    placeholder: 'le jour, puis les deux numéros — ex. « lundi 2 6 »',
  },
  solution: { reponses: reponsesJ1, resultat: 'VENDREDI' },
  indices: [
    "Sept jours, vingt et une paires de menteurs possibles : cent quarante-sept combinaisons. C'est peu. Rien n'interdit de les parcourir une à une.",
    "La cinquième déposition ne parle pas du jour. Elle parle des autres dépositions. Traite-la à part : elle peut être fausse sans qu'aucune de celles qu'elle vise le soit.",
    "Suppose un instant que le gardien dise vrai, et compte combien de personnes deviennent menteuses. Tu verras que c'est beaucoup trop.",
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
/*  JOUR 2 — Le masque                                                 */
/*  Interpolation sur le registre du faussaire. L'atelier ouvre en     */
/*  1994 au n° 60, et progresse de 120 numéros par an. Le masque porte */
/*  le n° 726 : (726-60)/120 = 5,55 ans après mars 1994 → fin 1999.    */
/*  Le certificat annonce 1974 : c'est le piège, et il est daté d'un   */
/*  atelier qui n'existait pas encore.                                 */
/* ================================================================== */

const J2 = {
  slug: 'le-masque',
  titre: 'Le masque (brouillon)',
  genre: 'Expertise — interpolation',
  type: 'saisie', ordre: 1, chrono_ref: 55,
  payload: {
    enonce: `Note de marge :

« Un faussaire ne se trahit jamais sur son objet. Il y a mis vingt ans de métier. Il se trahit sur sa comptabilité, où il n'en a mis aucun. »

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
    "Les trois entrées datées suffisent à établir un rythme. Combien de numéros par an ?",
    "Cent vingt numéros par an, à partir du n° 60 en mars 1994. Où tombe le 726 ?",
    "(726 − 60) ÷ 120 = 5,55 ans après mars 1994.",
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
/*  JOUR 3 — Le parchemin                                              */
/*  Serrure Potter, puis Vigenère de clé MARAUDEUR. Le texte clair ne  */
/*  nomme jamais le mois : il le décrit.                               */
/* ================================================================== */

const J3 = {
  slug: 'le-parchemin',
  titre: 'Le parchemin',
  genre: 'Cryptanalyse',
  type: 'serrure', ordre: 2, chrono_ref: 75,
  payload: {
    invite: `DOSSIER 3 · pièce unique

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
    "Cherche les groupes de lettres qui se répètent et mesure les distances entre eux. Kasiski, 1863. La clé a neuf lettres.",
    "La clé est le mot que tu as lu aujourd'hui sans y prêter attention : MARAUDEUR.",
  ],
  anomalie: {
    ou: "Sous le texte déchiffré, une ligne d'une autre encre.",
    texte: "« Si tu lis ceci, c'est que tu as ma clé. Alors tu sais déjà que je n'ai jamais résolu ces affaires. » L'Archiviste n'écrit pas au lecteur. Il écrit à quelqu'un d'autre.",
    reponses: ["une autre encre", "la derniere ligne", "il ecrit a quelqu'un", "il n'a jamais resolu les affaires", "autre ecriture"],
  },
  animations: { mode: 'toutes', sequence: ['parchemin', 'tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 4 — Les jours creux                                           */
/*  Le creux VISIBLE (5 au 8) est un vrai pont, documenté : c'est le   */
/*  leurre. La vraie période maquillée est le 12 au 19, dont la        */
/*  moyenne est parfaitement normale (96) mais l'écart-type            */
/*  impossible (0,5 contre 38,9 ailleurs).                             */
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
  titre: 'Les jours creux (brouillon)',
  genre: 'Analyse de données',
  type: 'saisie', ordre: 3, chrono_ref: 55,
  payload: {
    enonce: `Note de marge :

« Le pont est un cadeau que je vous fais. Prenez-le, perdez vingt minutes dessus, revenez. »

— — —

DOSSIER 4 · relevés du compteur général

Le bâtiment est réputé avoir fonctionné sans interruption tout le mois.
Index relevé chaque soir, en kWh :

${RELEVES.map(([j, v]) => `    ${String(j).padStart(2, ' ')} → ${v}`).join('\n')}

Une note au dossier signale une fermeture administrative du 5 au 8 :
congé collectif, déclaré, régulier.

Trouve les jours où le bâtiment ne fonctionnait pas — et qu'on a voulu cacher.`,
    consigne: 'La période, en deux nombres. Ex. « du 3 au 6 ».',
    placeholder: 'du .. au ..',
  },
  solution: {
    reponses: ['12 19', 'du 12 au 19', '12 au 19', '12-19', 'du 12 septembre au 19 septembre'],
    resultat: 'DU 12 AU 19',
  },
  indices: [
    "Un index ne dit rien. Ce sont les écarts d'un jour à l'autre qu'il faut regarder.",
    "Le creux du 5 au 8 est réel et déclaré : ce n'est pas lui. Cherche une période dont la moyenne est parfaitement normale.",
    "Calcule l'écart-type des écarts journaliers, par tranches. Ailleurs il vaut environ 39. Sur huit jours consécutifs, il tombe à 0,5. Un compteur réel ne respire jamais aussi régulièrement.",
  ],
  anomalie: {
    ou: "Les écarts de la période maquillée, un par un.",
    texte: "Les écarts fabriqués alternent 96, 97, 96, 97 — la signature d'un générateur, pas d'un bâtiment. Celui qui a maquillé ces relevés savait quelle moyenne imiter, mais pas qu'il fallait aussi imiter le désordre.",
    reponses: ['96 97', 'ils alternent', "l'alternance", 'trop regulier', 'un generateur', '96 et 97'],
  },
  recompense: { nom: '', precision: '', gag: false },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 5 — L'imposteur                                               */
/*  Celui qui se contredit est innocent : un vrai souvenir est         */
/*  imparfait. L'imposteur est celui dont les déclarations n'apportent */
/*  AUCUNE information que les quatre autres ne donnent déjà.          */
/*  Et la note de l'Archiviste, ce jour-là, désigne le mauvais.        */
/* ================================================================== */

const J5 = {
  slug: 'imposteur',
  titre: "L'imposteur (brouillon)",
  genre: 'Déduction sociale',
  type: 'imposteur', ordre: 4, chrono_ref: 50,
  payload: {
    enonce: `Note de marge :

« Celui-là est facile. Le troisième se contredit deux fois en cinq lignes — je l'ai donné au parquet en dix minutes. Ne perdez pas votre soirée là-dessus. »

— — —

DOSSIER 5 · cinq dépositions

Cinq personnes déclarent avoir participé à la même mission de relevé, une nuit de septembre.
Quatre y étaient. La cinquième a appris son rôle.`,
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
    "Compare ce que chaque déposition APPORTE. Quatre d'entre elles contiennent au moins un détail que personne d'autre ne donne.",
    "Une seule déposition ne contient rien qui ne soit déjà dans les autres. Elle n'a pas été vécue, elle a été lue.",
  ],
  anomalie: {
    ou: "La note de l'Archiviste, comparée à ta conclusion.",
    texte: "L'Archiviste désigne Nze avec assurance, et il se trompe. Ce n'est pas une erreur : Nze est la seule des cinq qui aurait pu le contredire.",
    reponses: ["l'archiviste se trompe", 'il se trompe', 'la note est fausse', 'nze', "l'archiviste ment", 'il ment'],
  },
  recompense: { nom: '', precision: '', gag: true },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 6 — Le scellé                                                 */
/*  hex → ROT13 → « ARRETE 561 DU 10 SEPTEMBRE ».                      */
/*  Le champ Artist est un leurre : c'est le nom que l'Archiviste a    */
/*  accusé la veille.                                                  */
/* ================================================================== */

const J6 = {
  slug: 'le-scelle',
  titre: 'Le scellé (brouillon)',
  genre: 'Forensique',
  type: 'saisie', ordre: 5, chrono_ref: 70,
  payload: {
    enonce: `DOSSIER 6 · scellé numérique

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
    "Le champ Artist est un nom. Un nom n'est pas une clé — et celui-là, tu l'as déjà vu hier.",
    "ImageDescription est de l'hexadécimal. Convertis-le en texte : tu obtiendras quelque chose de lisible mais faux.",
    "Ce que tu obtiens est décalé de treize lettres. ROT13.",
  ],
  anomalie: {
    ou: 'Le champ Artist.',
    texte: "Le leurre porte le nom que l'Archiviste accusait la veille. Il n'a pas seulement désigné le mauvais coupable : il a préparé la pièce qui devait le confirmer.",
    reponses: ['artist', 'le champ artist', 'c nze', 'nze', 'le leurre', "c'est un leurre"],
  },
  recompense: { nom: '', precision: '', gag: false },
  animations: { mode: 'toutes', sequence: ['tampon_ok', 'sceau', 'chrono', 'recompense'] },
};

/* ================================================================== */
/*  JOUR 7 — Quatre heures dix                                         */
/*  Grille de déduction. Cinq personnes, cinq créneaux.                */
/* ================================================================== */

const J7 = {
  slug: 'quatre-heures-dix',
  titre: 'Quatre heures dix (brouillon)',
  genre: 'Grille de déduction',
  type: 'grille', ordre: 6, chrono_ref: 60,
  payload: {
    enonce: `DOSSIER 7 · le registre de garde

Cinq personnes se sont relayées cette nuit-là, une par créneau de vingt minutes,
de 03h30 à 05h10. Une seule détenait la clé du registre.

À quelle heure exactement le registre a-t-il été ouvert ?`,
    categories: ['MENGUE', 'BEKALE', 'NZE', 'OYONO', 'ABESSOLO',
                 '03h30', '03h50', '04h10', '04h30', '04h50'],
    contraintes: [
      'Abessolo a pris le premier créneau ou le dernier.',
      "Bekale est arrivé exactement quarante minutes après Mengue.",
      "Nze n'a jamais eu la clé.",
      "La personne qui détenait la clé n'était ni la première ni la dernière.",
      'Oyono a précédé Nze, mais pas immédiatement.',
      "Mengue n'était pas là à 03h30.",
      "Le registre a été ouvert pendant le créneau de celui qui détenait la clé.",
      'Abessolo ne détenait pas la clé.',
      "Bekale a pris le dernier créneau de la nuit.",
      "Celui qui détenait la clé a pris son créneau après Oyono.",
    ],
    consigne: "L'heure d'ouverture du registre.",
  },
  solution: {
    reponses: ['04h10', '4h10', '04:10', '4:10', 'quatre heures dix'],
    resultat: '04H10',
  },
  indices: [
    "Commence par Bekale : la neuvième contrainte le fixe, et la deuxième fixe alors Mengue.",
    "Abessolo ne peut plus qu'être au premier créneau. Restent Nze et Oyono pour deux places.",
    "La clé n'est ni au premier ni au dernier créneau, ni chez Nze, ni chez Abessolo. Il ne reste qu'une personne.",
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
/*  JOUR 8 — L'enveloppe                                               */
/*  La convergence. Les sept résultats décrivent le même instant.      */
/*  À remplacer par un `assemblage` quand l'image sera prête.          */
/* ================================================================== */

const J8 = {
  slug: 'l-enveloppe',
  titre: "L'enveloppe",
  genre: 'La convergence',
  type: 'saisie', ordre: 7, chrono_ref: null,
  payload: {
    enonce: `« Sept dossiers. Vous ne m'avez jamais demandé pourquoi ceux-là.
Je vous ai laissé croire qu'ils n'avaient rien en commun.
Relisez vos sept résultats. Ils décrivent tous le même instant. »

— — —

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
    "Les vendredis de septembre 1999 sont les 3, 10, 17 et 24.",
    "Un seul tombe entre le 12 et le 19.",
  ],
  recompense: { nom: '', precision: '', gag: false },
  animations: { mode: 'toutes', sequence: ['descellement', 'tampon_ok', 'verdict_acte', 'recompense'] },
};

/* ================================================================== */

const DOSSIERS = [J1, J2, J3, J4, J5, J6, J7, J8];

const CONFIG = {
  titre: 'LE FONDS 47',
  debut: '2026-09-10',
  fin: '2026-09-17',
  fuseau: 'Africa/Libreville',
  heureOuverture: 6,
  heureVerdict: 6,
  programme: DOSSIERS.map((d) => d.slug),
  codeFinal: '17091999',
  paliers: [60, 120, 180],
  tentativesMax: 5,
  blocageMinutes: 10,
  tailleFonds: 47,
  seuilAnomalies: 4,
  titreVerdict: 'Les sept scellés sont levés',
  lettreFinale: `L'Archiviste n'existe pas. Les sept affaires non plus.
Le fonds, les temps de référence, la trahison du cinquième jour : tout est de ma main.

La seule chose vraie de ces quarante-sept dossiers, c'est que tu es né un vendredi
17 septembre 1999, que la mairie s'est trompée de sept jours, et que quelqu'un a mis
sept jours à te les rendre.

Bon anniversaire. — Ce soir, 17h00. Deux couverts.`,
  lettreFinaleAnomalies: `Tu avais compris depuis mardi. Tu as continué quand même.
C'est pour ça que c'est toi.

L'Archiviste n'existe pas. Les sept affaires non plus. Tout est de ma main.
La seule chose vraie, c'est que tu es né un vendredi 17 septembre 1999, que la mairie
s'est trompée de sept jours, et que quelqu'un a mis sept jours à te les rendre.

Bon anniversaire. — Ce soir, 17h00. Deux couverts.`,
  refus: [
    'Dossier scellé. Consultation réservée.',
    "Ce dossier a été retiré du fonds le 3 juin 1997. Aucun motif n'est indiqué.",
    'Chemise vide.',
    "Vous n'avez pas ouvert celui d'aujourd'hui.",
    'Réservé.',
    'Le dossier existe. Vous, pas encore.',
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
  console.log(`\x1b[32m✓\x1b[0m jour ${d.ordre + 1} · ${d.titre}  \x1b[90m(${d.type}, ${n} formulation${n > 1 ? 's' : ''})\x1b[0m`);
}

await ecrireConfig(CONFIG);
console.log(`\x1b[32m✓\x1b[0m configuration : ${CONFIG.debut} → ${CONFIG.fin}, ${CONFIG.fuseau}, bascule à ${CONFIG.heureOuverture}h`);

console.log(`
\x1b[34mPour parcourir la semaine\x1b[0m
  SIM_DATE=2026-09-10T09:00:00+01:00 npm run dev     # jour 1
  SIM_DATE=2026-09-14T09:00:00+01:00 npm run dev     # jour 5, l'imposteur
  SIM_DATE=2026-09-17T07:00:00+01:00 npm run dev     # la convergence

\x1b[34mCe qui t'attend dans /admin\x1b[0m
  · les récompenses sont TOUTES vides — c'est à toi de les écrire
  · les dossiers 2 à 7 portent « (brouillon) » : mécaniques justes, textes à durcir
  · le dossier 8 est une saisie ; passe-le en « assemblage » quand l'image sera prête
`);
