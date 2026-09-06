#!/usr/bin/env bash
#
#  Pourquoi git veut-il commiter un .env — et la clé est-elle déjà
#  dans l'historique ?
#
#      cd ~/Documents/1709
#      bash git-diagnostic.sh
#
#  Ce script ne réécrit jamais l'historique et ne pousse rien.
#  Il désuit les .env (opération sans danger, le fichier reste sur ton
#  disque) et s'arrête net si l'historique est contaminé.
#
set -uo pipefail
cd "$(dirname "$0")"

titre() { printf '\n\033[34m%s\033[0m\n' "$*"; }
vert()  { printf '\033[32m  ✓\033[0m %s\n' "$*"; }
rouge() { printf '\033[31m  ✗\033[0m %s\n' "$*"; }
gris()  { printf '\033[90m    %s\033[0m\n' "$*"; }

[ -d .git ] || { rouge "pas de dépôt git ici"; exit 1; }

# ------------------------------------------------------------------
titre "1. L'état du dépôt"
# ------------------------------------------------------------------
NB=$(git rev-list --all --count 2>/dev/null || echo 0)
gris "branche courante : $(git branch --show-current 2>/dev/null || echo '(aucune)')"
gris "commits existants : $NB"
gris "remote : $(git remote get-url origin 2>/dev/null || echo '(aucun)')"
if [ "$NB" -gt 0 ]; then
  gris "premier commit : $(git log --all --reverse --format='%ad — %s' --date=short 2>/dev/null | head -1)"
fi

# ------------------------------------------------------------------
titre "2. Le motif du .gitignore couvre-t-il les .env ?"
# ------------------------------------------------------------------
# --no-index : on teste le MOTIF, pas le suivi. Sans ça, git répond
# « pas ignoré » pour tout fichier déjà suivi, ce qui accuse à tort
# le .gitignore alors que le problème est le suivi.
for f in site/.env.local site/.env .env.local; do
  [ -e "$f" ] || continue
  if git check-ignore -q --no-index "$f" 2>/dev/null; then
    vert "$f : le motif le couvre bien"
  else
    rouge "$f : aucun motif du .gitignore ne le couvre"
  fi
done

# ------------------------------------------------------------------
titre "3. Un .env est-il SUIVI en ce moment ?"
# ------------------------------------------------------------------
SUIVIS=$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)
if [ -n "$SUIVIS" ]; then
  rouge "oui — et c'est pour ça que le .gitignore ne sert à rien :"
  gris "un fichier déjà suivi échappe au .gitignore."
  echo "$SUIVIS" | while read -r f; do gris "  $f"; done
  echo
  gris "Je le désuis. Le fichier RESTE sur ton disque, il sort juste de git."
  echo "$SUIVIS" | while read -r f; do git rm --cached -q "$f" 2>/dev/null && vert "désuivi : $f"; done
else
  vert "aucun .env suivi actuellement"
fi

# ------------------------------------------------------------------
titre "4. Un .env est-il déjà dans l'HISTORIQUE ?"
# ------------------------------------------------------------------
CONTAMINE=""
if [ "$NB" -gt 0 ]; then
  CONTAMINE=$(git log --all --pretty=format: --name-only 2>/dev/null \
              | sort -u | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)
fi

if [ -z "$CONTAMINE" ]; then
  vert "non — l'historique est propre"
  titre "Prêt"
  gris "Relance la mise en place, puis pousse :"
  printf '\n    bash mise-en-place.sh\n    git push -u origin main\n\n'
  exit 0
fi

# ------------------------------------------------------------------
rouge "OUI — un .env est dans l'historique :"
echo "$CONTAMINE" | while read -r f; do gris "  $f"; done
titre "Ce que ça veut dire"
gris "Pousser tel quel publierait tes jetons et ta clé Supabase dans"
gris "l'historique GitHub, où ils resteraient même après suppression."
gris "Le dépôt n'a jamais été poussé, donc l'historique local n'a de"
gris "valeur que pour toi."
titre "Deux options"
printf '\n'
printf '  A · Repartir d\047un historique neuf — recommandé, une commande\n'
printf '      \033[90mTu perds l\047historique local (des essais), rien d\047autre.\033[0m\n'
printf '\n      rm -rf .git && bash mise-en-place.sh\n'
printf '\n'
printf '  B · Garder l\047historique et le réécrire\n'
printf '      \033[90mPlus long, et il faut installer git-filter-repo.\033[0m\n'
printf '\n      brew install git-filter-repo\n'
printf '      git filter-repo --path site/.env.local --invert-paths --force\n'
printf '\n'
titre "Dans les deux cas, ensuite"
gris "Les valeurs ont existé sur ton disque en clair : change-les."
gris "  · ADMIN_TOKEN et JOUEUR_TOKEN : invente-les à nouveau"
gris "  · Supabase → Settings → API Keys → révoquer et recréer la clé secrète"
gris "Tant que le dépôt n'est pas poussé, le risque est théorique — mais"
gris "ces jetons ouvrent /admin, donc autant les renouveler maintenant."
printf '\n'
exit 1
