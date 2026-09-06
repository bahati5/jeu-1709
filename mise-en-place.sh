#!/usr/bin/env bash
#
#  Range le dossier et l'accroche à GitHub.
#
#  Rien n'est supprimé : tout ce qui sort va dans _corbeille/, que tu
#  effaceras toi-même quand tu seras sûre. Le script est rejouable.
#
#      cd ~/Documents/1709
#      bash mise-en-place.sh
#
set -euo pipefail

DEPOT="https://github.com/bahati5/jeu-1709.git"
cd "$(dirname "$0")"

bleu()  { printf '\033[34m%s\033[0m\n' "$*"; }
vert()  { printf '\033[32m  ✓\033[0m %s\n' "$*"; }
gris()  { printf '\033[90m    %s\033[0m\n' "$*"; }

mkdir -p _corbeille prive

ranger() {   # ranger <chemin> <raison>
  if [ -e "$1" ]; then
    mkdir -p "_corbeille/$(dirname "$1")"
    mv "$1" "_corbeille/$1"
    vert "$1 → _corbeille  ($2)"
  fi
}

garder_prive() {
  if [ -e "$1" ]; then
    mv "$1" "prive/$(basename "$1")"
    vert "$1 → prive/  (hors dépôt)"
  fi
}

# ------------------------------------------------------------------
bleu $'\n1. Les documents de l\'ancien jeu (l\'Affaire Essono)'
# ------------------------------------------------------------------
ranger "DOSSIER-COMPLET.md"     "remplacé par HISTOIRE-ET-JEU.md"
ranger "PRD.md"                 "remplacé par HISTOIRE-ET-JEU.md"
ranger "LISEZ-MOI.md"           "remplacé par README.md"
ranger "maquette.html"          "maquette de l'ancien jeu"
ranger "maquette 2.html"        "maquette de l'ancien jeu"
ranger "j2_journal_badges.csv"  "énigme de l'ancien jeu"
ranger "j2_matrice_trajets.csv" "énigme de l'ancien jeu"
ranger "j5_carnet_chiffre.txt"  "énigme de l'ancien jeu"
ranger "j5_CLE_ne_pas_lui_donner.txt" "clé de l'ancien jeu"
ranger ".DS_Store"              "fichier système"

# ------------------------------------------------------------------
bleu $'\n2. Le code remplacé par la refonte'
# ------------------------------------------------------------------
ranger "site/lib/stock.js"          "remplacé par lib/donnees.js"
ranger "site/lib/contenu.js"        "le contenu vit en base"
ranger "site/lib/registre.js"       "le contenu vit en base"
ranger "site/lib/registre-src.txt"  "le contenu vit en base"
ranger "site/app/ecrans.jsx"        "remplacé par manches.jsx + scenes.jsx"
ranger "site/app/api/jour"          "remplacé par /api/etat"
ranger "site/app/api/tuiles"        "remplacé par /api/media"
ranger "site/app/api/recompense"    "servie par /api/etat une fois gagnée"
ranger "site/scripts/generer-maquette.mjs"  "maquette de l'ancien jeu"
ranger "site/scripts/maquette-modele.html"  "maquette de l'ancien jeu"
ranger "site/scripts/generer-images.mjs"    "images de l'ancien jeu"
ranger "site/scripts/test-http.sh"          "testait les anciennes routes"
ranger "site/donnees"               "les fichiers passent par Supabase Storage"
ranger "site/medias"                "les fichiers passent par Supabase Storage"
ranger "site/tuiles"                "les fichiers passent par Supabase Storage"
ranger "site/CLAUDE.md"             "vide"
ranger "site/.gitignore"            "remplacé par celui de la racine"
ranger "site/README.md"             "fusionné dans le README de la racine"

# ------------------------------------------------------------------
bleu $'\n3. Les spoilers — hors du dépôt'
# ------------------------------------------------------------------
garder_prive "HISTOIRE-ET-JEU.md"
garder_prive "J17-LE-JOUR-J.md"
gris "Ils restent sur ton disque et sont sauvegardés dans le projet Claude."
gris "Pour les versionner quand même : retire la ligne prive/ du .gitignore."

# ------------------------------------------------------------------
bleu $'\n4. Git'
# ------------------------------------------------------------------
if [ ! -d .git ]; then
  git init -q -b main
  vert "dépôt initialisé sur la branche main"
else
  vert "dépôt déjà initialisé"
fi

if git remote | grep -qx origin; then
  git remote set-url origin "$DEPOT"; vert "origin mis à jour"
else
  git remote add origin "$DEPOT"; vert "origin ajouté"
fi

# Filet de sécurité : on refuse de continuer si un secret allait monter.
git add -A
# .env.example ne contient que des clés vides : c'est le modèle, il monte.
fuites=$(git diff --cached --name-only \
           | grep -E '(^|/)\.env($|\.)' \
           | grep -Ev '(^|/)\.env\.example$' || true)
if [ -n "$fuites" ]; then
  printf '\033[31m  ✗ un fichier .env est sur le point d\047être commité. Arrêt.\033[0m\n'
  printf '\033[31m    %s\033[0m\n' $fuites
  git reset -q; exit 1
fi
if git diff --cached --name-only | grep -q '^prive/'; then
  printf '\033[31m  ✗ prive/ est sur le point d\047être commité. Vérifie le .gitignore. Arrêt.\033[0m\n'
  git reset -q; exit 1
fi

git commit -qm "Refonte : contenu en base, admin d'édition, moteur d'animations

Le jeu ne vit plus dans le code. Le site ne connaît que huit types de
manche ; énoncés, réponses, indices, récompenses, animations et calendrier
se saisissent depuis /admin et vivent dans Supabase.

- lib/types.js       les huit types, avec liste blanche de ce qui part au client
- lib/donnees.js     accès aux données, Supabase ou fichier local
- lib/animations.js  catalogue de 13 scènes, séquence réglable par dossier
- lib/schema.sql     RLS activé sans policy : la clé publique ne lit rien
- app/manches.jsx    rendu par type, piloté par les données
- app/scenes.jsx     lecteur d'animations, toutes sautables
- scripts/verif-fuites.mjs    cherche les secrets de la base dans le bundle
- scripts/verif-supabase.mjs  vérifie que RLS tient vraiment
- scripts/test-temps.mjs      40 vérifications du calendrier

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01TReQU7TSUhfUg5DEce4Mox" \
  || vert "rien de neuf à commiter"

printf '\n'
bleu "Prêt."
gris "Il reste à pousser — et le dépôt doit être PRIVÉ :"
printf '\n    git push -u origin main\n\n'
gris "Si le dépôt n'existe pas encore : crée-le sur github.com/new,"
gris "nom « jeu-1709 », coche Private, et ne coche NI README NI .gitignore."
printf '\n'
