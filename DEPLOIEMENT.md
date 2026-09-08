# Mettre LE CARTON 47 en ligne

De zéro à un lien qu'il peut ouvrir sur son téléphone. Trois étapes, une
demi-heure la première fois.

> **L'ordre compte.** Supabase d'abord, le seed ensuite, Vercel en dernier.
> Déployer avant d'avoir branché Supabase produit un site qui perd tout ce
> que tu écris dans `/admin` au premier redémarrage.

---

## 0 · Ce qu'il faut avoir sous la main

| | |
|---|---|
| Node | 20 ou plus — `node -v` |
| Un compte | [supabase.com](https://supabase.com) — gratuit |
| Un compte | [vercel.com](https://vercel.com) — gratuit |
| Le dépôt | `github.com/bahati5/jeu-1709` — **privé**, il contient les réponses |

Le dépôt a deux niveaux : la racine (`1709/`) et l'application (`1709/site/`).
Toutes les commandes ci-dessous se lancent **depuis `site/`**.

```bash
cd ~/Documents/1709/site
npm install
```

---

## 1 · Supabase — la base qui garde tout

### 1.1 Créer le projet

Sur [supabase.com](https://supabase.com) → **New project**.

- **Name** : `jeu-1709` (ou ce que tu veux)
- **Database password** : génère-le et garde-le, tu n'en auras pas besoin ici
- **Region** : la plus proche de Libreville — *West EU (Paris)* ou *West EU (Ireland)*

Deux minutes de provisionnement.

### 1.2 Créer les tables

**SQL Editor** → **New query** → colle **tout** le contenu de
`site/lib/schema.sql` → **Run**.

Ça crée cinq tables (`jeu_config`, `dossiers`, `etat_jeu`, `animations`,
`medias`), le bucket privé `fonds47`, et surtout : **RLS activé partout,
aucune policy**.

> **Pourquoi aucune policy.** RLS sans policy = personne ne lit rien. Seule
> la clé `service_role`, qui ne vit que sur le serveur, traverse. C'est ce
> qui fait que même en ouvrant les outils réseau de son navigateur, il ne
> peut pas lire les réponses. Ne crée pas de policy « pour que ça marche » :
> ça marche déjà, et ça casserait exactement la garantie qui compte.

### 1.3 Récupérer les deux valeurs

**Project Settings** → **API** :

| Ce qu'il te faut | Où | À quoi ça ressemble |
|---|---|---|
| `SUPABASE_URL` | *Project URL* | `https://abcdefgh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *Project API keys* → **`service_role` / secret**, clique *Reveal* | `sb_secret_…` ou un long JWT `eyJ…` |
| `SUPABASE_PUBLISHABLE_KEY` *(facultatif)* | *Project API keys* → **`anon` / publishable** | `sb_publishable_…` ou `eyJ…` |

> ⚠️ **La `service_role` est la clé qui ouvre tout.** Elle ne doit jamais
> être préfixée `NEXT_PUBLIC_`, jamais apparaître dans le code, jamais être
> commitée. Si tu la colles quelque part par erreur (un chat, un ticket, une
> capture), va dans Supabase → API → **Reset** et refais l'étape.
>
> La `publishable` n'est pas secrète : elle ne sert qu'à `npm run supabase`,
> qui essaie vraiment de lire les tables avec elle pour prouver que RLS tient.

---

## 2 · Les fichiers d'environnement

### 2.1 Les deux jetons

Il n'y a ni compte ni mot de passe : deux liens, deux cookies. Génère-les :

```bash
node -e "console.log('JOUEUR_TOKEN=' + require('crypto').randomBytes(24).toString('hex'))"
node -e "console.log('ADMIN_TOKEN='  + require('crypto').randomBytes(24).toString('hex'))"
```

48 caractères chacun. Si un jeton est refusé plus tard, c'est presque
toujours une copie tronquée : recompte.

### 2.2 Écrire `.env.local`

```bash
cp .env.example .env.local
```

Ouvre `.env.local` et remplis :

```
JOUEUR_TOKEN=…
ADMIN_TOKEN=…

SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_…
SUPABASE_BUCKET=fonds47

SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

Laisse `SIM_DATE` commenté. Il ne sert qu'à répéter, et il est de toute
façon ignoré en production.

`.env.local` est dans `.gitignore` et `mise-en-place.sh` refuse de commiter
si un `.env` se glisse dans l'index. Seul `.env.example` part sur GitHub.

### 2.3 Vérifier que la base répond

```bash
npm run supabase
```

Ce que tu dois lire :

```
✓ clé service_role reconnue
✓ les 5 tables existent
✓ le bucket fonds47 est privé
✓ la clé publishable ne lit RIEN — RLS tient
```

Si le dernier point échoue, une policy a été créée quelque part : supprime-la.

---

## 3 · Le seed — verser les huit dossiers

```bash
npm run semer
```

Ça écrit dans Supabase :

- les **8 dossiers** (énoncés, réponses acceptées, indices, anomalies, chronos) ;
- la **configuration** : titre, dates `2026-09-10 → 2026-09-17`, fuseau
  `Africa/Libreville`, bascule à 6h, paliers d'indices `60 / 120 / 180`,
  code final, les deux lettres du 17 ;
- **l'habillage** : skin *Le Grimoire*, sur-titre, cote, texte d'introduction,
  écran d'attente ;
- le **catalogue des 13 scènes**.

Le seed est **rejouable** : il écrase les dossiers du même slug. Mais il
réécrit aussi la configuration — donc si tu as déjà réglé des choses dans
`/admin`, ne le relance pas.

### Ce que le seed ne remplit pas

**Les 8 récompenses sont vides**, volontairement : c'est à toi de les écrire,
elles sont personnelles. Les jours 2 et 5 portent le drapeau *gag*.

`/admin` → **Les dossiers** → un dossier → *Ce qui vous revient*.

### Contrôler que tout tient

```bash
npm run enigmes    # chaque énigme a UNE solution, et la base l'accepte
npm run temps      # 40 vérifications de calendrier
npm run build
npm run verif      # cherche les réponses dans le bundle servi au navigateur
```

Les quatre doivent passer. `npm run verif` est le plus important : il prend
les chaînes secrètes **dans la base** et les cherche dans ce qui est
réellement envoyé au navigateur.

> **Le piège à connaître.** N'écris jamais de vrai contenu de jeu dans un
> `placeholder` du formulaire `/admin` : le chunk JS de `/admin` est servi
> publiquement. `npm run verif` attrape ce cas — c'est déjà arrivé.

### Jouer en local

```bash
npm run aujourdhui        # décale les dates pour que ce soit le jour 1 aujourd'hui
npm run aujourdhui -- 5   # …ou le jour 5
npm run dev
```

Puis `http://localhost:3000`. La **barre de répétition** en bas à droite
n'apparaît qu'avec le cookie admin : sauter de jour, rejouer une manche,
ouvrir les indices sans attendre, rejouer les scènes une à une, voir la
réponse. Il ne l'aura jamais — elle est liée au cookie, pas à un réglage,
donc il n'y a rien à penser à éteindre avant de lui envoyer le lien.

Pour remettre les vraies dates :

```bash
npm run aujourdhui -- --restaurer
```

---

## 4 · Vercel — mettre en ligne

### 4.1 Pousser sur GitHub

Le dépôt doit être **privé** : `prive/` contient le dossier de conduite avec
toutes les réponses.

```bash
cd ~/Documents/1709
git add -A
git commit -m "Le design appliqué : deux habillages pilotés depuis la console"
git push
```

Si c'est le tout premier envoi, `./mise-en-place.sh` fait le ménage, le
`git init`, le remote et le premier commit — et **s'arrête** si un `.env`
allait partir.

### 4.2 Importer le projet

Sur [vercel.com](https://vercel.com) → **Add New** → **Project** → choisis
`jeu-1709`.

| Réglage | Valeur |
|---|---|
| **Root Directory** | `site` ⚠️ **le réglage qu'on oublie** |
| Framework Preset | Next.js *(détecté)* |
| Build Command | *(laisser vide)* |
| Output Directory | *(laisser vide)* |
| Install Command | *(laisser vide)* |

### 4.3 Les variables d'environnement

**Avant** de cliquer Deploy — *Environment Variables*, cinq lignes,
sur **Production** *et* **Preview** :

```
JOUEUR_TOKEN                = …
ADMIN_TOKEN                 = …
SUPABASE_URL                = https://abcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY   = sb_secret_…
SUPABASE_BUCKET             = fonds47
```

**Ne mets pas `SIM_DATE`.** Il est ignoré en production, mais autant ne pas
l'avoir là.

**Ne mets aucun `NEXT_PUBLIC_`.** Tout ce qui porte ce préfixe est visible
dans le navigateur.

### 4.4 Déployer

**Deploy**. Deux minutes. Tu obtiens `https://jeu-1709.vercel.app`.

### 4.5 Les deux liens

```
Pour lui   https://jeu-1709.vercel.app/api/entrer?t=LE_JOUEUR_TOKEN
Pour toi   https://jeu-1709.vercel.app/api/entrer?t=LE_ADMIN_TOKEN&vers=admin
```

Ouvre les deux **sur ton téléphone** avant de lui envoyer le sien. Le cookie
tient 40 jours : il clique une fois, et ensuite `jeu-1709.vercel.app` suffit.

Dis-lui d'**ajouter le site à son écran d'accueil** (Safari → Partager →
Sur l'écran d'accueil). Le manifeste est là, ça s'ouvre en plein écran, ça
ressemble à une app.

---

## 5 · Une fois en ligne — la liste de contrôle

- [ ] Le lien joueur ouvre le jeu, l'écran d'accès puis l'introduction
- [ ] Le lien admin ouvre `/admin` et la base est marquée **reliée**
- [ ] Une modification faite dans `/admin` **survit à un redéploiement**
      *(c'est le test qui prouve que Supabase est branché)*
- [ ] Un dossier futur renvoie **404**, pas 403
- [ ] `npm run verif` passe sur le build de production
- [ ] Les 8 récompenses sont écrites
- [ ] Le dépôt GitHub est **privé**

---

## Pendant la semaine

Tout se change depuis `/admin`, **depuis ton téléphone**, sans redéployer :

| Il faut… | Onglet |
|---|---|
| écrire ou corriger une énigme | Les dossiers |
| changer quel dossier tombe quel jour | Le programme |
| décaler les dates | Quand ça commence |
| changer le skin, l'intro, le sur-titre | L'habillage |
| ouvrir les indices plus tôt | Les règles → paliers |
| le débloquer s'il est coincé | La partie |

Le filet de sécurité est dans **La partie** : débloquer le jour, lever un
blocage après trop de tentatives, voir la réponse, tout remettre à zéro.

---

## Quand ça coince

| Symptôme | Cause presque certaine |
|---|---|
| « Jeton refusé » avec un jeton de 47 caractères | copie tronquée, ou un `>>` a soudé deux lignes dans `.env.local` |
| Le site s'ouvre mais `/admin` renvoie 404 | pas le bon jeton, ou `&vers=admin` oublié |
| Les modifications d'`/admin` disparaissent | Supabase pas branché sur Vercel — les fichiers y sont éphémères |
| `npm run verif` sort en erreur 1 | une réponse est partie dans le bundle : regarde le fichier qu'il nomme |
| La clé publishable arrive à lire les tables | une policy RLS a été créée — supprime-la |
| Build Vercel : « No Next.js version detected » | **Root Directory** n'est pas réglé sur `site` |
| Les fontes s'affichent en Times | Google Fonts bloqué par le réseau — ce n'est pas le site |

---

## Le calendrier

| | |
|---|---|
| Premier jour | **10 septembre 2026**, 6h (Libreville) |
| Dernier jour | **17 septembre 2026** |
| Verdict | le 17 à 6h — les scellés tombent, la lettre s'ouvre |
| Bascule | 6h du matin, fuseau `Africa/Libreville` |

Un jour futur n'existe pas : `404`, jamais `403`. Un onglet pas encore ouvert
n'est pas grisé — il n'est pas affiché du tout. Un onglet grisé annonce qu'il
y a quelque chose derrière, et le mystère meurt là.
