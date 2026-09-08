# jeu-1709

Une enquête de sept jours, jouée sur téléphone, du 10 au 17 septembre.

**Rien du jeu n'est dans ce dépôt.** Aucun énoncé, aucune réponse, aucun indice,
aucune récompense. Le site ne connaît que huit *types de manche* ; tout le
contenu se saisit depuis `/admin` et vit dans Supabase.

> C'est ce qui rend ce dépôt sans risque : même en le lisant en entier, on
> n'apprend rien de l'enquête. Les seuls documents qui la révèlent sont dans
> `prive/`, qui n'est pas versionné.

---

## Le dossier

```
jeu-1709/
├─ site/              l'application Next.js
├─ prive/             la bible narrative et le déroulé du 17 — hors dépôt
├─ _corbeille/        ce que la refonte a remplacé — hors dépôt, à effacer
└─ mise-en-place.sh   range le dossier et l'accroche à git (rejouable)
```

---

## Démarrer

```bash
cd site
npm install
cp .env.example .env.local     # puis remplis les jetons
npm run dev                    # http://localhost:3000
```

Deux liens, deux jetons :

| Qui | Lien |
|---|---|
| Lui | `https://…/api/entrer?t=$JOUEUR_TOKEN` |
| Elle | `https://…/api/entrer?t=$ADMIN_TOKEN&vers=admin` |

Le lien pose un cookie httpOnly. En local l'accès joueur est ouvert ; le jeton
n'est exigé qu'en production. `/admin` reste fermé partout.

---

## Brancher Supabase

Sans Supabase, tout est écrit dans `site/.data/fonds47.json`. Parfait en local,
**inutilisable sur Vercel** : le système de fichiers y est éphémère et tout ce
qui est saisi dans l'admin disparaît au premier redémarrage, sans erreur.

1. Créer un projet sur [supabase.com](https://supabase.com)
2. **SQL Editor** → coller **tout** `site/lib/schema.sql` → *Run*
3. **Settings → API Keys** → copier l'URL du projet et la clé **secrète**
   (`sb_secret_…`, ou l'ancienne `service_role` qui commence par `eyJ` —
   les deux fonctionnent, Supabase retire les anciennes fin 2026)
4. Les poser dans `site/.env.local` :

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_BUCKET=fonds47
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # facultatif, sert au test de sécurité
```

```bash
npm run supabase     # vérifie la connexion ET que RLS tient vraiment
```

> ### La règle de sécurité centrale
>
> RLS est activé sur les cinq tables et **aucune policy n'est créée** : la clé
> publique ne lit rien. Seule la clé secrète, qui ne vit que sur le serveur,
> traverse. Elle contourne RLS — si elle atteint le navigateur, les réponses
> des sept dossiers sont lisibles en trente secondes.
>
> **Jamais de `NEXT_PUBLIC_` sur une clé Supabase. Le front ne parle qu'à `/api/*`.**
>
> `npm run supabase` teste ça pour de vrai : il se connecte avec la clé publique
> et essaie de lire les cinq tables. Le supposer ne suffit pas.

---

## Tout se règle depuis `/admin`

| Onglet | Ce qu'on y fait |
|---|---|
| **Les dossiers** | Créer, éditer, dupliquer, supprimer une manche. Un formulaire par type. Énoncés, réponses acceptées, indices, récompense, anomalie, chrono de référence |
| **Le programme** | Quel dossier tombe quel jour, ou aucun. Changer les dates : le nombre de lignes suit |
| **Quand ça commence** | Dates, fuseau, heure de bascule, heure du verdict |
| **L'habillage** | La direction visuelle (deux skins), le sur-titre, la cote, l'écran d'accès, l'introduction, l'écran d'attente, la ligne sous la grille des 47 |
| **Les animations** | Activer/désactiver chaque scène, régler sa durée. Le choix des scènes d'un dossier se fait dans son éditeur |
| **Les médias** | Téléverser les fichiers, les rattacher à un dossier. Un média rattaché renvoie 404 tant que son dossier n'est pas ouvert |
| **Les règles** | Code final, paliers d'indices, tentatives, blocage, les deux lettres du dernier jour, les notes de refus |
| **La partie** | Débloquer, reverrouiller, lever un blocage, remettre à zéro. Le filet de sécurité, utilisable depuis un téléphone |

**Ajouter un dossier ne demande aucun déploiement.** Le premier jour, seul le
dossier du jour 1 doit exister : les suivants s'écrivent pendant la semaine.

---

## Les deux habillages

Le même jeu, deux directions. Ça se change dans `/admin` → **L'habillage**, et
c'est immédiat : recharger la page du jeu suffit, rien à redéployer.

| | **Le Grimoire** *(par défaut)* | **La Chambre 47** |
|---|---|---|
| Fond | nuit violacée, flaque de lumière dorée | vert sombre, presque noir |
| Titres | Cormorant Garamond, gravé | Special Elite, machine à écrire |
| Texte | Spectral | Lora |
| Formes | arches, onglets en pastilles | angles droits, onglets carrés |
| Ce que ça raconte | un registre ancien qu'on rouvre | un bureau d'archives des années 60 |

Le papier déchiré, la cire, les scellés et les treize scènes sont les mêmes des
deux côtés : seules les couleurs, les fontes et les courbures changent.

L'introduction, l'écran d'attente et le sur-titre se saisissent dans le même
onglet. **Titre d'introduction vide = pas d'écran d'introduction** : le jeu
s'ouvre directement sur la manche.

---

## Les huit types de manche

| Type | Ce que c'est |
|---|---|
| `note` | Une lettre, une note de marge. Pas d'énigme |
| `saisie` | Énoncé + champ de réponse. Le cas général |
| `fichier` | Un ou plusieurs fichiers à décortiquer + une réponse |
| `grille` | Catégories, contraintes, une seule configuration possible |
| `imposteur` | Des déclarations, une seule est fabriquée. Il désigne laquelle |
| `serrure` | Un texte qu'une phrase de passe révèle, ligne à ligne |
| `assemblage` | Un taquin. Reconstitué, un champ de code apparaît |
| `anomalie` | La seconde couche. Rien ne la signale ; elle se dépose au tableau |

Ajouter un **type** demande du code (`site/lib/types.js` + son rendu dans
`site/app/manches.jsx`). Ajouter un **dossier** ne demande qu'un formulaire.

---

## Les animations

Catalogue dans `site/lib/animations.js` (13 scènes), rendu dans
`site/app/scenes.jsx`. La table `animations` porte l'activation, la durée et
l'ordre — modifiables depuis l'admin sans redéployer.

Par dossier : un **mode** (toutes / courte / aucune) et, au choix, la
**séquence exacte** des scènes. Réglages globaux : saut toujours possible, et
version raccourcie à partir de la Nième fois — sans quoi la même scène de cire
fondue devient insupportable au troisième jour.

---

## Les commandes qui comptent

```bash
cd site
npm run dev                    # http://localhost:3000
npm run build                  # compile
npm run verif                  # ✓ aucune chaîne secrète dans le bundle client
npm run supabase               # ✓ connexion, tables, bucket, et RLS testé pour de vrai
node scripts/test-temps.mjs    # 40 vérifications du calendrier
```

`npm run verif` tire les secrets **de la base** — pas d'une liste écrite à la
main qui se périmerait au premier dossier ajouté — et les cherche dans tout ce
que Next sert au navigateur. **À relancer avant chaque déploiement.**

Il attrape aussi les textes d'exemple : ne jamais mettre de vrai contenu du jeu
dans un `placeholder` de l'admin — le chunk JS de `/admin` est servi à qui
connaît son URL.

---

## Répéter une autre date

`SIM_DATE` fige l'horloge du serveur. **Ignoré si `NODE_ENV=production`** : la
simulation ne peut pas servir à tricher en ligne.

```bash
SIM_DATE=2026-09-17T06:30:00+01:00 npm run dev
```

---

## Ce qui est garanti

| Règle | Où |
|---|---|
| Aucune réponse au client | `lib/types.js → versClient`, liste blanche stricte |
| Une réponse glissée dans `payload` est écartée avant la base | `lib/donnees.js → assainir` |
| Un dossier qui n'est pas celui du jour n'existe pas — 404, jamais 403 | `app/api/verify` |
| Un indice non ouvert n'est pas servi | `app/api/etat` |
| Une récompense non gagnée n'existe pas | `app/api/etat` |
| Les médias ne sont pas dans `/public` | `app/api/media/[nom]` |
| Un média d'un dossier fermé renvoie 404 | idem |
| Les indices comptent depuis l'ouverture de la manche, pas depuis l'aube | `lib/temps.js → indicesDepuis` |
| Une anomalie se signale à tout moment, même trois jours après | `app/api/verify` |
| Un onglet fermé n'est pas rendu — jamais grisé | `lib/temps.js → ongletsOuverts` |
| Le décalage horaire est calculé, jamais supposé | `lib/temps.js → instant` |
| Pas de source maps en production | `next.config.mjs` |

---

## Déployer

```bash
cd site && vercel --prod
```

Dans les réglages Vercel :

1. **Root Directory : `site`** — le dépôt a le code dans un sous-dossier
2. Coller toutes les variables de `.env.example` (**sans** `SIM_DATE`)
3. **Protéger les preview deployments par mot de passe** — chaque push génère
   une URL publique avec le build complet. C'est la fuite la plus facile à oublier
4. Lancer `npm run verif` avant chaque mise en ligne

---

## Le dépôt doit rester privé

Le code ne révèle rien, mais le nom du dépôt et son historique suffisent à
gâcher la surprise. `prive/` et `.env*` sont ignorés ; le script de mise en
place refuse de commiter s'ils passaient malgré tout.
