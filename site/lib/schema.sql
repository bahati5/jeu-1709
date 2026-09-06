-- ============================================================
--  LE FONDS 47 — schéma Supabase
--  À coller dans l'éditeur SQL de Supabase, une seule fois.
--
--  Règle de sécurité centrale : RLS activé PARTOUT, aucune policy.
--  Résultat : la clé `anon` ne peut RIEN lire. Seule la clé
--  `service_role`, qui ne vit que sur le serveur, traverse.
--  C'est ce qui empêche le joueur de lire les réponses au réseau.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- La configuration du jeu (une seule ligne) ----------
create table if not exists jeu_config (
  id          text primary key default 'principal',
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------- Les dossiers : le contenu du jeu ----------
-- Rien ici n'est écrit dans le code. Tout se saisit depuis /admin.
create table if not exists dossiers (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  ordre       int  not null default 0,
  actif       boolean not null default true,

  titre       text not null default '',
  genre       text not null default '',
  type        text not null,                        -- voir lib/types.js

  -- Ce qui peut être servi au joueur quand le dossier est ouvert
  payload     jsonb not null default '{}'::jsonb,

  -- Ce qui ne quitte JAMAIS le serveur
  solution    jsonb not null default '{}'::jsonb,

  indices     jsonb not null default '[]'::jsonb,
  animations  jsonb not null default '{}'::jsonb,   -- {sequence:[...], mode:'toutes'}
  recompense  jsonb not null default '{}'::jsonb,   -- {nom, precision, gag}
  anomalie    jsonb not null default '{}'::jsonb,   -- la seconde couche, facultative
  chrono_ref  int,                                  -- minutes — le temps de l'Archiviste

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists dossiers_ordre_idx on dossiers (ordre);

-- ---------- L'avancement du joueur (une seule ligne) ----------
create table if not exists etat_jeu (
  id          text primary key default 'principal',
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------- Le catalogue d'animations ----------
-- Les scènes sont implémentées dans le code ; leur activation,
-- leur durée et leur ordre se règlent ici depuis /admin.
create table if not exists animations (
  cle         text primary key,
  nom         text not null,
  description text not null default '',
  declencheur text not null default '',
  duree_ms    int  not null default 2000,
  actif       boolean not null default true,
  ordre       int  not null default 0,
  options     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------- Les médias ----------
-- Le fichier vit dans le bucket `fonds47`. Cette table dit à quel
-- dossier il appartient : servir un média d'un dossier non ouvert
-- renvoie 404.
create table if not exists medias (
  id            uuid primary key default gen_random_uuid(),
  nom           text unique not null,
  chemin        text not null,
  dossier_slug  text,
  mime          text not null default 'application/octet-stream',
  taille        int,
  created_at    timestamptz not null default now()
);

-- ---------- Verrouillage ----------
alter table jeu_config  enable row level security;
alter table dossiers    enable row level security;
alter table etat_jeu    enable row level security;
alter table animations  enable row level security;
alter table medias      enable row level security;
-- Aucune policy créée : `anon` et `authenticated` n'ont aucun accès.

-- ---------- Horodatage automatique ----------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists t_dossiers_touch on dossiers;
create trigger t_dossiers_touch before update on dossiers
  for each row execute function touch_updated_at();

drop trigger if exists t_config_touch on jeu_config;
create trigger t_config_touch before update on jeu_config
  for each row execute function touch_updated_at();

drop trigger if exists t_etat_touch on etat_jeu;
create trigger t_etat_touch before update on etat_jeu
  for each row execute function touch_updated_at();

-- ---------- Le bucket ----------
insert into storage.buckets (id, name, public)
values ('fonds47', 'fonds47', false)
on conflict (id) do nothing;
