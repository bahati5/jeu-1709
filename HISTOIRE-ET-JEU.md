# LE FONDS 47

### Bible narrative + conception du jeu — **version 4**, 6 septembre 2026

*Remplace `DOSSIER-COMPLET.md`, le §6 du `PRD.md`, et les versions 2 et 3.*

---

## Ce qui change par rapport à la v3

Elle était trop facile et trop plate : sept affaires posées côte à côte, une révélation au bout. Un type qui a fait polytechnique les enchaîne en vingt minutes chacune et n'a aucune raison de s'attacher.

Trois corrections :

|                       | v3                                  | **v4**                                                                                                                                                    |
| --------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Difficulté** | Une couche : on résout, on valide  | **Double fond systématique.** Chaque dossier a une réponse évidente qui est fausse. La bonne exige de désobéir à ce que le dossier suggère         |
| **Structure**   | Sept histoires + une surprise au J8 | **Schéma narratif complet sur huit jours** : situation initiale, élément perturbateur, péripéties, trahison au milieu, dénouement, situation finale |
| **Densité**    | Une énigme par jour                | **Deux couches par jour.** L'affaire (obligatoire) + l'anomalie (facultative, pour qui lit bien). Il peut jouer à deux niveaux                           |

> **Le principe de difficulté :** on ne rend pas les énigmes plus dures en les rendant plus longues. On les rend plus dures en **rendant la mauvaise réponse attirante**.

---

## 1. Le schéma narratif

L'arc classique en cinq temps, étalé sur huit jours. La seconde couche de chaque dossier le fait avancer.

| Temps                            | Jours         | Ce qui se passe                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Situation initiale**     | J1 · 10 sept | Un fonds d'archives privé. 47 dossiers classés. Sept lui sont ouverts, un par jour. Un homme méthodique — « l'Archiviste » — les a tous résolus avant lui et a laissé ses temps. Le monde est stable et le jeu a des règles                                                                                                     |
| **Élément perturbateur** | J2 · 11 sept | Dans le dossier 2,**une pièce qui ne devrait pas y être** : une photographie annotée d'une autre main, datée *après* la clôture de l'affaire. Quelqu'un a rouvert le fonds                                                                                                                                                  |
| **Péripéties**           | J3 → J5      | Les anomalies s'accumulent. Une ligne d'encre différente sous le parchemin. Des données fabriquées par quelqu'un qui avait accès aux archives. Puis**la trahison** : au dossier 5, l'Archiviste désigne un coupable avec assurance — et il se trompe. Pas par erreur                                                          |
| **Dénouement**            | J6 → J7      | Le scellé s'ouvre sur le dossier personnel de l'Archiviste.**Il n'était pas enquêteur. Il était greffier.** Les sept affaires qu'il prétend avoir résolues, il les a classées lui-même sans jamais les résoudre. Au J7, une contrainte de la grille n'est obtenable qu'avec la réponse du dossier 1 : les sept sont liés |
| **Situation finale**       | J8 · 17 sept | La convergence. Les sept résultats décrivent le même instant. Puis la quatrième voix                                                                                                                                                                                                                                                  |

### Le mobile de l'Archiviste — la clé de l'histoire-cadre

Il avait **une** affaire qu'il n'a jamais pu clore. Alors il en a fabriqué sept autres autour d'elle : sept exercices dont chacun isole une des compétences nécessaires. Il ne cherchait pas à être résolu. Il cherchait à **former quelqu'un** qui, un jour, arriverait équipé devant la huitième.

C'est ce que le joueur comprend le 17 au matin, une seconde avant de comprendre autre chose.

---

## 2. Les deux couches

Chaque jour comporte deux niveaux. **C'est ce qui règle la difficulté sans jamais bloquer.**

### Couche A — l'affaire *(obligatoire)*

L'énigme du jour. Elle rend un résultat. Elle est nécessaire pour avancer. Prévue pour 40 à 70 minutes.

### Couche B — l'anomalie *(facultative)*

Une chose qui cloche dans le dossier lui-même, qu'aucune consigne ne signale. Un smart qui lit bien la trouve. Un smart pressé passe à côté et le jeu fonctionne pareil.

> **Pourquoi c'est la bonne façon de le corser :** s'il attrape les sept anomalies, il arrive au 17 en ayant deviné qu'on lui ment depuis une semaine — et il a **un autre texte final**, qui le lui dit. S'il n'en attrape aucune, il a quand même joué sept affaires solides. La difficulté s'adapte à lui sans qu'on ait à la régler.

**Les anomalies se déposent au tableau,** dans une colonne à part intitulée *« Ne relève d'aucun dossier »*.

---

## 3. Les sept dossiers

| Jour                  | Dossier                              | Genre                    | Rend                | Réf.  | Le double fond                      |
| --------------------- | ------------------------------------ | ------------------------ | ------------------- | ------ | ----------------------------------- |
| **10**          | **1 · Le camion des ordures** | Logique, menteurs        | `VENDREDI`        | 35 min | La réponse évidente est*samedi* |
| **11**          | **2 · Le masque**             | Expertise, statistiques  | `1999`            | 55 min | Le certificat d'authenticité ment  |
| **12**          | **3 · Le parchemin**          | Cryptanalyse*(Potter)* | `SEPTEMBRE`       | 75 min | Le mois n'est jamais écrit         |
| **13**          | **4 · Les jours creux**       | Analyse de données      | `12 → 19`        | 55 min | Le creux visible n'est pas le bon   |
| **14**          | **5 · L'imposteur**           | Déduction sociale       | un**nom**     | 50 min | Celui qui se contredit est innocent |
| **15**          | **6 · Le scellé**            | Forensique, devops       | un**numéro** | 70 min | Le champ`Artist` est un leurre    |
| **16**          | **7 · Quatre heures dix**     | Grille, à la Cluedo     | une**heure**  | 60 min | Une contrainte vient du dossier 1   |
| **17 · 06h00** | **L'enveloppe**                | La convergence           | **sa date**   | —     | —                                  |

---

### DOSSIER 1 · « Le camion des ordures » — 10 septembre

**Situation initiale** · logique propositionnelle · **rend `VENDREDI`**

Un homme a quitté un immeuble un jour de la semaine dernière. Sept voisins témoignent. **Exactement deux mentent.**

> **1. Mme ONDO** — *« C'était un jour de passage du camion. »* (il passe le mardi et le vendredi)
> **2. M. BALEP** — *« C'était le lendemain du jour où j'ai touché ma paie. »* (payé le jeudi)
> **3. LA BOULANGÈRE** — *« Ma boutique était ouverte, il est passé devant. »* (fermée lundi et dimanche)
> **4. LE GARDIEN** — *« C'était deux jours après le marché. »* (marché le jeudi)
> **5. SŒUR MVÉ** — *« Au moins un des deux, Ondo ou Balep, ment. »*
> **6. M. TCHOUA** — *« C'était un jour ouvré. »*
> **7. AWA** — *« Ce n'était ni un mardi ni un mercredi. »*
>
> **Quel jour ? Et qui sont les deux menteurs ?**

**Solution unique : vendredi. Les menteurs sont le gardien et Sœur Mvé.**
*Vérifiée par force brute sur les 147 combinaisons (7 jours × 21 paires de menteurs). Aucune autre ne survit.*

> **Le double fond —** le gardien est le seul témoin **précis** : « deux jours après le marché » donne une date, pas une fourchette. C'est exactement pour ça qu'on le croit, et c'est lui qui ment. La déclaration 5 est le pivot : c'est une déclaration *sur les déclarations*, et il faut accepter qu'un témoin qui parle des autres puisse mentir sans que ceux-là mentent.

**Couche B — l'anomalie :** la fiche du gardien porte un numéro de dossier qui n'est pas celui-ci. Il appartient au **dossier 5**.

**Note de l'Archiviste :** *« Trente-cinq minutes. Vous en mettrez plus. Tout le monde en met plus, parce que tout le monde commence par croire celui qui donne un chiffre. »*

**Indices :** 1) *Combien de combinaisons faut-il tester ? Cent quarante-sept. C'est peu.* — 2) *La cinquième déclaration ne parle pas du jour. Traitez-la à part.* — 3) *Supposez que le gardien mente et voyez ce qui tient debout.*

---

### DOSSIER 2 · « Le masque » — 11 septembre

**Élément perturbateur** · expertise et statistiques · **rend `1999`**

Un masque vendu comme pièce ancienne, accompagné d'un **certificat d'authenticité daté de 1974**. Le fonds contient aussi le registre saisi chez le faussaire : trois cents entrées, numéros d'inventaire et dates.

**En quelle année ce masque a-t-il réellement été fabriqué ?**

Trois étapes, aucune facultative :

1. **La série.** Les numéros d'inventaire du faussaire progressent régulièrement dans le temps. Une interpolation donne une fourchette pour le numéro du masque
2. **Le contrôle.** La fourchette contient trois années candidates. Deux tombent avant l'ouverture de l'atelier, attestée par une facture au dossier
3. **Le chiffre.** Reste à trancher entre deux. Les montants du registre **suivent la loi de Benford** — sauf sur une plage, où le faussaire a inventé ses écritures. Le masque est dans cette plage

> **Le double fond —** le certificat est au dossier, signé, tamponné, et il donne 1974. Tout le dossier est construit pour qu'on le croie. **Le certificat est un faux, et il est fabriqué par le même homme que le masque.**

**Couche B — l'anomalie :** une photographie du masque est annotée au dos d'une écriture qui n'est pas celle du faussaire, et **datée de trois ans après la clôture du dossier**. Quelqu'un a rouvert cette affaire. *(C'est l'élément perturbateur de toute la semaine.)*

**Note de l'Archiviste :** *« Un faussaire ne se trahit jamais sur son objet. Il y a mis vingt ans de métier. Il se trahit sur sa comptabilité, où il n'en a mis aucun. »*

---

### DOSSIER 3 · « Le parchemin » — 12 septembre

**Péripétie 1** · cryptanalyse · **rend `SEPTEMBRE`** · **le jour Potterhead**

#### Acte 1 — la serrure

Une page vierge. Une phrase : *« Ce carnet ne s'ouvre pas. Il faut le lui demander correctement. »* Un champ de saisie.

**« Je jure solennellement que mes intentions sont mauvaises »** — l'encre apparaît alors ligne à ligne, comme sur la Carte du Maraudeur.
`Méfait accompli` referme le parchemin. Il l'essaiera. Que ça marche vaut un cadeau à soi seul.

#### Acte 2 — le chiffre

Ce qui apparaît n'est pas un texte. C'est ceci :

```
XE DOCV UOV VE THYUGBV QSK CYOYC FG
LR BUOEHTQ SLCWHHY R XA MIYUKY VF OL
LYV IHWMNKS LHTLVZNVNN OI WYQMZN XH P YTALV
```

> **Le double fond, et c'est le piège du jeu —** il va lancer une analyse de fréquences, comme au dossier précédent. **Elle ne donnera rien.** La lettre la plus fréquente plafonne à 9,7 %, là où un E français en pèse 15. *(Vérifié.)* Ce n'est pas une substitution : c'est un **chiffre de Vigenère**, et il faut soit Kasiski, soit la clé.
>
> **La clé est dans la couche Potter.** Elle est signée en toutes lettres dans l'objet qu'on vient de lui mettre entre les mains : `MARAUDEUR`.

#### Acte 3 — la devinette

Déchiffré, le texte donne :

> *« Le mois que je cherche est celui où la Balance succède à la Vierge, et où les enfants reprennent le chemin de l'école. »*

**Le mois n'est jamais écrit.** Il faut savoir que la Vierge cède à la Balance vers le 23, et que la rentrée est en septembre. Deux indices indépendants qui se recoupent sur un seul mois.

**Réponse :** `septembre`

**Couche B — l'anomalie :** sous le texte déchiffré, une dernière ligne d'une encre différente, en clair : *« Si tu lis ceci, c'est que tu as ma clé. Alors tu sais déjà que je n'ai jamais résolu ces affaires. »* — l'Archiviste s'adresse à quelqu'un. Pas au joueur.

**Note de l'Archiviste :** *« Soixante-quinze minutes. J'ai triché : je connaissais la clé. Vous aussi, depuis que vous avez ouvert le parchemin. Vous ne le savez pas encore, c'est tout. »*

**Indices :** 1) *Comptez les distances entre les groupes de lettres qui se répètent. Kasiski, 1863.* — 2) *La clé a neuf lettres et vous l'avez déjà lue aujourd'hui.* — 3) *`MARAUDEUR`.*

---

### DOSSIER 4 · « Les jours creux » — 13 septembre

**Péripétie 2** · analyse de données · **rend `du 12 au 19`**

Un fichier : `consommation.csv`. Relevés quotidiens d'un bâtiment sur trois mois — électricité, eau, passages de badge, livraisons. Le bâtiment est réputé avoir fonctionné sans interruption.

**Trouve les jours où il ne fonctionnait pas.**

> **Le double fond —** il y a un creux évident dans les données, sur quatre jours, en plein milieu. C'est un pont de fête. Il est réel, il est documenté, et **ce n'est pas la réponse.**
>
> La vraie période creuse a été **maquillée** : quelqu'un a remplacé les relevés par des valeurs fabriquées. Deux signatures indépendantes la trahissent, il en suffit d'une :
>
> - **Les différences premières s'effondrent.** Un compteur réel respire ; sur ces huit jours il avance d'un pas trop régulier
> - **Les derniers chiffres sont uniformes.** Les relevés réels s'accumulent sur certaines terminaisons ; les valeurs fabriquées sont trop bien réparties — elles sortent d'un générateur pseudo-aléatoire

**Réponse :** `du 12 au 19` — **huit jours.**

> **Son terrain.** Il ouvrira le CSV dans pandas, et le moment où il verra la variance des différences premières s'écraser sur une plage précise vaut à lui seul la journée.

**Couche B — l'anomalie :** l'export du CSV porte un horodatage **postérieur** à la clôture du dossier, et un nom d'utilisateur. Le même que celui de l'annotation du dossier 2.

**Note de l'Archiviste :** *« Le pont de la Toussaint est un cadeau que je vous fais. Prenez-le, perdez vingt minutes dessus, revenez. »*

---

### DOSSIER 5 · « L'imposteur » — 14 septembre

**La trahison — le climax** · déduction sociale · **rend un `NOM`** · **le jeu du feu de camp**

Cinq personnes déclarent avoir participé à la même mission. Quatre y étaient. **La cinquième a appris son rôle.** Chacune livre cinq souvenirs : vingt-cinq déclarations.

> **Le double fond, et c'est le meilleur du jeu —** l'un des cinq se contredit ouvertement : une heure qui ne colle pas, un nom mal orthographié. C'est le suspect designé, et **il est innocent** : les vrais souvenirs sont imparfaits, c'est leur signature.
>
> Le critère est l'inverse de l'intuition. Les quatre vrais témoignages **apportent chacun une information que les autres n'ont pas** : ils décrivent la même scène depuis quatre endroits différents. L'imposteur, lui, n'apporte **rien qui ne soit déjà déductible des quatre autres.** Il a lu leurs déclarations avant d'écrire la sienne.
>
> C'est un critère d'**information**, pas de cohérence. Un homme qui a fait polytechnique le verra formulé comme ça et sourira.

#### Et l'Archiviste ment ici

Sa note du jour désigne le contradictoire, avec assurance, avec un raisonnement séduisant. **S'il le suit, sa réponse est enregistrée comme hypothèse, puis réfutée le lendemain matin** — et le J6 s'ouvre sur une note différente, plus froide.

> C'est le point de bascule de la semaine : la voix qui l'accompagne depuis cinq jours vient de lui mentir, et il n'a aucun moyen de savoir si c'est une erreur ou une manœuvre. *(C'en est une : la personne accusée est la seule qui aurait pu dénoncer l'Archiviste.)*

**Couche B — l'anomalie :** le cinquième témoin porte le numéro de fiche trouvé au **dossier 1**, sur la fiche du gardien. Les deux affaires partagent une personne. Elles ne devraient pas.

---

### DOSSIER 6 · « Le scellé » — 15 septembre

**Révélation** · forensique numérique · **rend un `NUMÉRO`**

Une photo `piece_06.jpg`, un fichier `depot.b64`, une phrase : *« La clé est dans l'image, pas sur l'image. »*

La chaîne, quatre maillons : `exiftool` → hexadécimal → ROT13 → `base64 -d` → `unzip -P`.

> **Le double fond —** le champ `Artist` de l'EXIF porte un nom en clair. C'est un leurre, et il est là depuis le début du jeu : c'est le nom que l'Archiviste a accusé la veille. Le vrai mot de passe est dans `ImageDescription`, en ROT13 hexadécimal.

**Dedans, deux fichiers.** Le premier porte le numéro attendu. Le second n'était pas annoncé : **le dossier personnel de l'Archiviste.**

Il n'était pas enquêteur. **Il était greffier.** Les sept affaires qu'il prétend avoir résolues, il les a **classées** — une signature au bas d'un formulaire, jamais une déduction. Ses temps de référence sont des inventions.

> **Ce que ça retourne —** depuis six jours, il court après le chrono d'un homme qui n'a jamais joué. Et il les a tous battus sans le savoir.

**Note de l'Archiviste :** *« Vous avez ouvert le mauvais fichier. Je m'y attendais, sinon je ne l'aurais pas mis là. »*

---

### DOSSIER 7 · « Quatre heures dix » — 16 septembre

**Dénouement** · grille de déduction · **rend une `HEURE`** · **le Cluedo / Mystères de Pékin**

Six personnes, six fonctions, six créneaux, six lieux, six objets. **Quinze contraintes.** Une seule configuration possible.

Personne n'est mort : la question est **à quelle heure exactement la chose a eu lieu.**

> **Le double fond —** avec les quinze contraintes fournies, la grille a **deux** solutions. Il va la remplir, buter, et se croire mauvais.
>
> La seizième contrainte n'est pas dans le dossier. Elle est dans **sa réponse du dossier 1** : le jour de la semaine. L'une des deux configurations exige un jour de fermeture. Elle tombe.
>
> **C'est le premier lien explicite entre deux dossiers**, et il arrive la veille du 17. À partir de cette seconde, il sait que les sept affaires ne sont pas indépendantes — et il lui reste une nuit pour se demander ce que ça veut dire.

---

## 4. Le 17 septembre — la convergence

### 06h00 · L'enveloppe

Notification. Les sept scellés se descellent en cascade. L'enveloppe s'ouvre sur **un acte de naissance** : toutes les colonnes remplies, **la date manquante.**

> *« Sept dossiers. Vous ne m'avez jamais demandé pourquoi ceux-là.
> Je vous ai laissé croire qu'ils n'avaient rien en commun.
> Relisez vos sept résultats. Ils décrivent tous le même instant. »*

| Dossier 1 | **vendredi** |
| Dossier 2 | **1999** |
| Dossier 3 | **septembre** |
| Dossier 4 | **du 12 au 19** |
| Dossier 5 | un nom — la sage-femme |
| Dossier 6 | un numéro d'acte |
| Dossier 7 | une heure — **04h10** |

**Un vendredi. En septembre 1999. Entre le 12 et le 19.**

Les vendredis de septembre 1999 sont les **3, 10, 17 et 24**. Un seul tombe dans la fenêtre.

> ## 17 septembre 1999
>
> *Solution unique — vérifiée par script.*

Il tape `17091999`. Ce n'est pas un code qu'on lui donne : **c'est une date qu'il vient de démontrer.** Et c'est la sienne.

### Puis la quatrième voix

L'acte rectifié s'affiche. Puis un feuillet sans en-tête, autre typographie :

> *L'Archiviste n'existe pas. Les sept affaires non plus. Le fonds, les temps, la trahison du cinquième jour : tout est de ma main.
> La seule chose vraie de ces quarante-sept dossiers, c'est que tu es né un vendredi 17 septembre 1999 à quatre heures dix, que la mairie s'est trompée de sept jours, et que quelqu'un a mis sept jours à te les rendre.
> Bon anniversaire. — Ce soir, 17h00. Deux couverts.*

**Deux versions de ce texte**, selon qu'il a relevé les anomalies ou non. S'il en a trouvé au moins quatre, il reçoit celle qui commence par : *« Tu avais compris depuis mardi. Tu as continué quand même. C'est pour ça que c'est toi. »*

Puis **l'énigme bonus courte** (`17h 2`), seule à débloquer l'invitation — volontairement floue : établissement caviardé, menu évasif, heure et nombre de couverts seulement.

---

## 5. Les clins d'œil

| Référence                            | Où                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Harry Potter**                 | Le dossier 3 en entier.`Je jure solennellement…` / `Méfait accompli`. **Et la clé du Vigenère est `MARAUDEUR`** — la couche Potter n'est pas décorative, elle est la solution |
| **Le dossier 9¾**               | Parmi les 47 : ouvrable, vide, une note —*« Réservé. »*                                                                                                                                  |
| **Far Cry**                      | Le chrono contre l'Archiviste. Sept avant-postes, un score, un rival bavard. Et la découverte au J6 que le rival n'a jamais joué                                                              |
| **Cluedo / Mystères de Pékin** | Le dossier 7 en grille pure, et le tableau, qui est un plateau                                                                                                                                  |
| **Les 39 dossiers verrouillés** | Il essaiera de les ouvrir. Chacun renvoie**une note de refus différente**, que tu écris toi-même dans l'admin. C'est le meilleur endroit du jeu pour cacher des blagues privées       |

---

## 6. Le tableau

Page persistante, visible dès le premier jour :

- **Les sept résultats acquis**, en clair, dans une colonne. Ils ont l'air d'un inventaire absurde — c'est voulu
- **Les sept scellés** de l'enveloppe, face cachée
- **« Ne relève d'aucun dossier »** — la colonne des anomalies. Vide au J1. C'est elle qui fait peur
- **Le chrono** de chaque dossier : son temps contre celui de l'Archiviste
- **Les notes de marge**, archivées, relisibles — et **relues autrement** après le J6

**Ne le fais pas en dernier.**

---

## 7. Rien en dur — le modèle de données

Le site ne connaît que des **types de manche**. Dossiers, énoncés, réponses, indices, notes, anomalies, chronos et récompenses sont des données saisies dans `/admin`.

### Les huit types de manche

| Type           | Ce que tu saisis                                         | Ce que le site fait                                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `note`       | Texte, signature, jour                                   | Affiche une note de marge. Pas d'énigme                                 |
| `saisie`     | Énoncé, pièces jointes, réponses acceptées, indices | Champ de réponse, vérification serveur                                 |
| `fichier`    | Fichiers, énoncé, réponses                            | Sert les fichiers derrière le verrou de date                            |
| `grille`     | Lignes, colonnes, contraintes, solution                  | Grille de déduction cliquable                                           |
| `imposteur`  | N déclarations, laquelle est fausse                     | Il désigne. L'erreur reste au tableau                                   |
| `assemblage` | Image, découpe, code final                              | Taquin, puis champ de code                                               |
| `serrure`    | Phrase de passe, texte à révéler                      | Le parchemin, révélation ligne à ligne                                |
| `anomalie`   | Un texte, un déclencheur, un dossier d'origine          | Se dépose au tableau si repérée.**Facultatif par construction** |

### Ce que tu règles, et où

| Réglable                                                                       | Écran d'admin                       |
| ------------------------------------------------------------------------------- | ------------------------------------ |
| Dates de début et de verdict, heure de bascule                                 | *Quand ça commence*               |
| Quel dossier tombe quel jour, ou aucun                                          | *Le programme* — glisser-déposer |
| **Le contenu de chaque dossier** : énoncé, fichiers, réponses, indices | *Les dossiers*                     |
| **Les notes de l'Archiviste**, leur jour, **laquelle ment**         | *La voix*                          |
| **Les anomalies** et le seuil qui change le texte final                   | *La seconde couche*                |
| **Les temps de référence** — modifiables en cours de partie            | *Les chronos*                      |
| **Les 39 notes de refus** des dossiers verrouillés                       | *Le fonds*                         |
| Ce qu'il gagne à chaque victoire                                               | *Ce qu'il gagne*                   |
| Paliers d'indices, tentatives, blocage, code final                              | *Les règles*                      |
| Débloquer, reverrouiller, corriger une réponse en direct                      | *Le programme*                     |
| Prévisualiser un jour comme s'il y était                                      | *Répétition*                     |

> **La règle :** ajouter un dossier ne doit demander aucun déploiement. S'il manque quelque chose, on ajoute un **type**, jamais une énigme.

---

## 8. Les récompenses

Cinq vraies, deux gags. Les gags doivent être **très** bien emballés — toute la blague est là. Aucun écran ne liste jamais ce qu'il va gagner : la seule apparition d'un cadeau est l'instant de la victoire.

| J1 · 10 | Vrai — son déjeuner apporté au bureau, préparé par toi |
| J2 · 11 | **Gag** — une chaussette. Une seule. Certificat d'authenticité, tampon, numéro de série *(et le dossier du jour porte sur un faux certificat : la blague est double)* |
| J3 · 12 | Vrai — son snack préféré glissé dans son sac le matin |
| J4 · 13 | Vrai — un vocal de toi, écoutable le soir uniquement |
| J5 · 14 | **Gag** — un bon « pour absolument rien du tout », signé, tamponné, conditions générales au dos |
| J6 · 15 | Vrai — un des gadgets, livré en avance |
| J7 · 16 | Vrai — l'acte rectifié, imprimé sur beau papier |

*(Champs vides au départ dans l'admin : c'est toi qui les écris.)*

---

## 9. Anti-triche

Il est dev-devops. Il ouvrira les devtools. **Une seule fuite tue les sept jours.**

1. Aucune réponse ne part au client — vérification dans `/api/verify`, comparaison normalisée
2. Les jours futurs **n'existent pas** : `404`, jamais `403`
3. Scellés et médias hors de `/public` — route handler avec vérification d'heure
4. Une récompense non gagnée renvoie 404
5. Pas de source maps en production
6. Rate-limit : 5 tentatives, puis 10 minutes
7. Preview deployments Vercel protégés par mot de passe
8. Le contenu saisi dans l'admin reste côté serveur. `/api/etat` ne renvoie jamais un dossier non ouvert
9. **La clé du Vigenère et le mot de passe du zip ne sont jamais dans le bundle** — le parchemin est déchiffré côté serveur après validation de la phrase de passe

> **Le point faible assumé :** les sept résultats sont visibles au tableau dès le J1. Il peut deviner la convergence avant le 17. **C'est acceptable** — il lui manquera toujours au moins deux des quatre contraintes de date, et deviner le mécanisme le 16 au soir ne lui donne pas le 17 : il faut encore les quatre réponses.

---

## 10. À trancher — aujourd'hui

- [ ] **Le twist te va-t-il ?** C'est le cœur. Si tu n'y crois pas, on change maintenant, pas mardi
- [ ] **La photo perso** — trois options : en faire l'objet du dossier 2 à la place du masque, une récompense du J4, ou la garder pour la table du 17
- [ ] **L'heure de naissance** — le dossier 7 rend `04h10`. Si tu connais sa vraie heure de naissance, on met la vraie : la ligne finale devient exacte
- [ ] Le titre affiché : `LE FONDS 47` / `LES SEPT SCELLÉS` / `DOSSIER 412`
- [ ] Confirmer qu'aucun personnage inventé ne recoupe sa vraie famille

## 11. Le planning — il reste 4 jours

| Quand                         | Quoi                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dimanche 6**          | Validation de cette bible                                                                                                                                               |
| **Lun 7 – mar 8**      | Refonte : modèle de données, admin d'édition des dossiers, le tableau, le chrono, la seconde couche                                                                  |
| **Mar 8**               | Génération des artefacts :`consommation.csv` avec sa vraie signature de PRNG, le registre du faussaire calibré sur Benford, le parchemin, le scellé, les 7 sceaux |
| **Mer 9**               | Parcours complet de bout en bout sur ton téléphone, en te mettant à sa place.**Et vérification par script de l'unicité des sept solutions**                  |
| **Mer 9 au soir**       | Mise en ligne. Le lien part le 10 au matin                                                                                                                              |
| **Filet de sécurité** | Si le site n'est pas prêt : les sept dossiers en PDF, un par jour, par message. La convergence du 17 fonctionne pareil                                                 |
