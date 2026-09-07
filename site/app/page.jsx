'use client';
/* Le jeu.
 *
 * Cette page ne contient aucun contenu : elle affiche ce que /api/etat
 * lui donne. Un onglet qui n'est pas ouvert n'est pas rendu — jamais grisé,
 * jamais verrouillé : un onglet grisé annonce qu'il y a quelque chose
 * derrière, et le mystère meurt là.
 */
import { useCallback, useEffect, useState } from 'react';
import { Manche } from './manches';
import { Lecteur } from './scenes';
import { sequencePour } from '@/lib/animations';

/* L'ordre de lecture des onglets, et leur nom. Le serveur décide
   lesquels sont ouverts ; il ne décide pas dans quel sens on les lit. */
const ORDRE = ['manche', 'enveloppe', 'invitation', 'tableau', 'fonds'];
const LIBELLES = {
  manche: 'La manche', enveloppe: "L'enveloppe", invitation: "L'invitation",
  tableau: 'Le tableau', fonds: 'Le fonds',
};

const api = async (url, corps, methode = 'POST') => {
  const r = await fetch(url, {
    method: methode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  return r.json().catch(() => ({}));
};

export default function Jeu() {
  const [d, setD] = useState(null);
  const [onglet, setOnglet] = useState(null);
  const [scenes, setScenes] = useState(null);
  const [ctx, setCtx] = useState({});

  const charger = useCallback(async () => {
    const r = await fetch('/api/etat', { cache: 'no-store' });
    if (!r.ok) { setD({ phase: 'ferme' }); return; }
    setD(await r.json());
  }, []);

  useEffect(() => { charger(); }, [charger]);

  /* Ouvrir la manche fait partir le chrono et l'horloge des indices. */
  useEffect(() => {
    if (d?.manche && !d.manche.resolu && d.manche.minutes === 0) {
      api('/api/ouvrir', { slug: d.manche.slug }).then(charger);
    }
  }, [d?.manche?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const jouer = useCallback((declencheur, contexte = {}) => {
    if (!d) return;
    const seq = sequencePour(declencheur, d.manche, d.catalogue || [], d.animations, d.vuesAnim);
    setCtx({ titre: d.titre, ...contexte });
    if (seq.length) setScenes(seq); else charger();
  }, [d, charger]);

  const finScenes = useCallback(async (vues) => {
    setScenes(null);
    if (vues?.length) await api('/api/ouvrir', { scenes: vues }, 'PATCH');
    charger();
  }, [charger]);

  if (!d) return <main className="wrap"><p className="chargement">…</p></main>;

  if (d.phase === 'ferme') {
    return <main className="wrap"><p className="chargement">Introuvable.</p></main>;
  }

  /* Avant l'ouverture : un sceau et un compte à rebours. */
  if (d.phase !== 'enquete') {
    return (
      <main className="wrap ecran-avant">
        <div className="sceau grand" />
        <h1>{d.titre}</h1>
        <Compte cible={d.ouverture} horloge={d.horloge} />
      </main>
    );
  }

  const repondre = async (saisie) => {
    const r = await api('/api/verify', { slug: d.manche.slug, saisie });
    if (r.ok && !r.deja) {
      jouer('reponse-juste', {
        recompense: r.recompense, minutes: r.minutes, chronoRef: r.chronoRef,
        rang: (d.scelles?.pris || 0) + 1, total: d.scelles?.total,
      });
    } else if (!r.ok) {
      jouer('reponse-fausse');
    } else charger();
  };

  const passe = async (saisie) => {
    const r = await api('/api/verify', { slug: d.manche.slug, quoi: 'passe', saisie });
    if (r.ok) jouer('serrure-ouverte', { texte: r.revele });
    else jouer('reponse-fausse');
  };

  const code = async (saisie) => {
    const r = await api('/api/verify', { quoi: 'code', saisie });
    if (r.ok) jouer('code-juste', { texte: saisie });
    else jouer('reponse-fausse');
  };

  const anomalie = async (saisie) => {
    const r = await api('/api/verify', { slug: d.manche.slug, quoi: 'anomalie', saisie });
    if (r.ok) jouer('anomalie', { texte: r.texte });
  };

  /* Le serveur dit lesquels sont ouverts ; l'ordre de lecture est ici.
     La manche du jour d'abord : c'est ce pour quoi il est venu. */
  const onglets = ORDRE.filter((o) => (d.onglets || []).includes(o));
  const actif = onglets.includes(onglet) ? onglet : onglets[0];

  return (
    <main className="wrap">
      <Bandeau d={d} />

      <nav className="onglets">
        {onglets.map((o) => (
          <button key={o} className={actif === o ? 'on' : ''} aria-current={actif === o}
            onClick={() => setOnglet(o)}>
            {LIBELLES[o] || o}
          </button>
        ))}
      </nav>

      {actif === 'manche' && (
        d.manche
          ? <Manche m={d.manche} onRepondre={repondre} onPasse={passe} onAnomalie={anomalie} />
          : <p className="veille">Le greffe ne verse rien aujourd'hui.</p>
      )}

      {actif === 'tableau' && <Tableau d={d} />}
      {actif === 'fonds' && <Fonds d={d} />}
      {actif === 'enveloppe' && <Enveloppe d={d} onCode={code} />}
      {actif === 'invitation' && <Invitation />}

      {scenes && (
        <Lecteur sequence={scenes} contexte={ctx} reglages={d.animations} onFini={finScenes} />
      )}
    </main>
  );
}

function Bandeau({ d }) {
  return (
    <header className="bandeau">
      <h1>{d.titre}</h1>
      <div className="planche">
        {Array.from({ length: d.scelles?.total || 0 }, (_, i) => (
          <span key={i} className={`sceau ${i < (d.scelles?.pris || 0) ? 'pris' : ''}`} />
        ))}
      </div>
      <small>jour {d.jour.index + 1} sur {d.jour.total}</small>
    </header>
  );
}

function Tableau({ d }) {
  return (
    <section className="board">
      <h2 className="board-titre">Ce qui est établi</h2>
      {!d.acquis.length && <p className="veille">Rien encore.</p>}
      <ul className="board-liste">
        {d.acquis.map((a) => (
          <li key={a.slug}>
            <strong>{a.resultat || '—'}</strong>
            <small>{a.titre} · {a.date}
              {a.minutes != null && a.chronoRef != null &&
                ` · ${a.minutes} min contre ${a.chronoRef}`}</small>
          </li>
        ))}
      </ul>

      {!!d.anomalies.length && (
        <>
          <h2 className="board-titre alerte">Ne relève d'aucun dossier</h2>
          <ul className="board-liste">
            {d.anomalies.map((a) => <li key={a.slug}><em>{a.texte}</em></li>)}
          </ul>
        </>
      )}
    </section>
  );
}

function Fonds({ d }) {
  const total = d.tailleFonds || 47;
  const pris = d.scelles?.pris || 0;
  return (
    <section className="fonds">
      <p className="fonds-t">{total} dossiers. Vous en avez ouvert <b>{pris}</b>.</p>
      <div className="fonds-grille">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`fonds-case ${i < pris ? 'pris' : ''}`}>
            {String(i + 1).padStart(2, '0')}
          </span>
        ))}
      </div>
    </section>
  );
}

/* Le dernier jour, une fois la manche close : l'acte à signer.
   Le code lui-même vit dans la config, et n'a jamais transité par ici. */
function Enveloppe({ d, onCode }) {
  const [v, setV] = useState('');
  if (d.codeOk) {
    return (
      <section className="ma enveloppe">
        <p className="ma-resolu">Acte enregistré.</p>
        <p className="ma-consigne">Le fonds est clos. Ce qui est établi reste au tableau.</p>
      </section>
    );
  }
  return (
    <section className="ma enveloppe">
      <header className="ma-tete">
        <small>Parquet — mairie centrale</small>
        <h2>L'acte de clôture</h2>
      </header>
      <p className="ma-consigne">Portez ici le code que le fonds vous a laissé.</p>
      <form className="ma-champ" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onCode(v); }}>
        <input value={v} onChange={(e) => setV(e.target.value)}
          placeholder="…" autoComplete="off" aria-label="Le code de clôture" />
        <button disabled={!v.trim()}>Signer</button>
      </form>
    </section>
  );
}

function Invitation() {
  return (
    <section className="board">
      <h2 className="board-titre">Ce qui vous attend</h2>
      <p className="veille">Le carton n'est pas encore gravé.</p>
    </section>
  );
}

function Compte({ cible, horloge }) {
  const [t, setT] = useState(cible - horloge);
  useEffect(() => {
    const id = setInterval(() => setT((x) => Math.max(0, x - 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(t / 1000);
  const deux = (n) => String(n).padStart(2, '0');
  return (
    <p className="compte">
      {Math.floor(s / 86400)}j {deux(Math.floor(s / 3600) % 24)}:{deux(Math.floor(s / 60) % 60)}:{deux(s % 60)}
    </p>
  );
}
