'use client';
/* Le jeu.
 *
 * Cette page ne contient aucun contenu : elle affiche ce que /api/etat
 * lui donne. Un onglet qui n'est pas ouvert n'est pas rendu — jamais grisé,
 * jamais verrouillé : un onglet grisé annonce qu'il y a quelque chose
 * derrière, et le mystère meurt là.
 *
 * L'habillage (skin, surtitre, cote, introduction, écran d'attente) vient
 * lui aussi de la base : rien de tout ça n'est écrit dans ce fichier.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Manche } from './manches';
import { Lecteur } from './scenes';
import { sequencePour } from '@/lib/animations';

const api = async (url, corps, methode = 'POST') => {
  const r = await fetch(url, {
    method: methode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  return r.json().catch(() => ({}));
};

/* Une mémoire de session, tolérante : un navigateur qui la refuse ne
   casse rien, l'écran se rejoue simplement au chargement suivant. */
const vu = {
  lire(cle) { try { return sessionStorage.getItem(cle) === '1'; } catch { return false; } },
  poser(cle) { try { sessionStorage.setItem(cle, '1'); } catch { /* tant pis */ } },
};

/* Les poussières d'or. Déterministes : le serveur et le client doivent
   rendre exactement la même chose, sinon React proteste. */
const MOTES = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 2654435761) % 1000 / 1000;
  const b = (i * 40503 + 977) % 1000 / 1000;
  return {
    left: `${(a * 96 + 2).toFixed(2)}%`,
    top: `${(b * 92 + 4).toFixed(2)}%`,
    opacity: 0.12 + a * 0.3,
    animationDelay: `${(b * 9).toFixed(2)}s, ${(a * 4).toFixed(2)}s`,
    animationDuration: `${(8 + b * 7).toFixed(1)}s, ${(3 + a * 3).toFixed(1)}s`,
  };
});

const NOMS_ONGLETS = {
  manche: 'La manche', tableau: 'Le tableau', fonds: 'Le fonds',
  enveloppe: "L'enveloppe", invitation: "L'invitation",
};
/* L'ordre d'affichage. Ce que le serveur n'a pas ouvert n'apparaît pas. */
const ORDRE_ONGLETS = ['manche', 'tableau', 'fonds', 'enveloppe', 'invitation'];

export default function Jeu() {
  const [d, setD] = useState(null);
  const [onglet, setOnglet] = useState('manche');
  const [scenes, setScenes] = useState(null);
  const [ctx, setCtx] = useState({});
  /* L'entrée est une suite d'étapes, pas trois booléens qui se croisent :
     attente → amorçage → introduction → scènes d'ouverture → jeu.
     Deux effets qui se posaient des booléens dans la même passe lisaient
     les anciennes valeurs : les scènes d'ouverture partaient pendant
     l'amorçage et se terminaient sans que personne ne les voie. */
  const [etape, setEtape] = useState('attente');

  const charger = useCallback(async () => {
    const r = await fetch('/api/etat', { cache: 'no-store' });
    if (!r.ok) { setD({ phase: 'ferme' }); return; }
    setD(await r.json());
  }, []);

  useEffect(() => { charger(); }, [charger]);

  /* Le premier onglet ouvert, si « la manche » ne l'est pas : sinon
     l'écran reste vide sans raison visible. */
  useEffect(() => {
    if (!d || d.phase === 'ferme') return;
    const ouverts = ORDRE_ONGLETS.filter((o) => (d.onglets || []).includes(o));
    if (ouverts.length && !ouverts.includes(onglet)) setOnglet(ouverts[0]);
  }, [d?.onglets?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  /* La première étape, décidée une seule fois, quand l'état arrive. */
  useEffect(() => {
    if (!d || etape !== 'attente') return;
    if (d.phase === 'ferme') { setEtape('jeu'); return; }
    if (d.amorcage && !vu.lire('amorce')) { setEtape('amorcage'); return; }
    if (d.intro?.titre && !vu.lire('intro')) { setEtape('intro'); return; }
    setEtape('ouverture');
  }, [d, etape]);

  /* L'amorçage se referme tout seul. */
  useEffect(() => {
    if (etape !== 'amorcage') return;
    const t = setTimeout(() => finirAmorcage(), 3000);
    return () => clearTimeout(t);
  }, [etape]); // eslint-disable-line react-hooks/exhaustive-deps

  const finirAmorcage = useCallback(() => {
    vu.poser('amorce');
    setEtape(d?.intro?.titre && !vu.lire('intro') ? 'intro' : 'ouverture');
  }, [d?.intro?.titre]); // eslint-disable-line react-hooks/exhaustive-deps

  const finirIntro = useCallback(() => { vu.poser('intro'); setEtape('ouverture'); }, []);

  /* Ouvrir la manche fait partir le chrono et l'horloge des indices. */
  useEffect(() => {
    if (d?.manche && !d.manche.resolu && d.manche.minutes === 0) {
      api('/api/ouvrir', { slug: d.manche.slug }).then(charger);
    }
  }, [d?.manche?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const jouer = useCallback((declencheur, contexte = {}) => {
    if (!d) return;
    const seq = sequencePour(declencheur, d.manche, d.catalogue || [], d.animations, d.vuesAnim)
      /* Une scène sans matière ne se joue pas : une récompense qu'elle n'a
         pas encore écrite ne doit pas devenir deux secondes d'écran noir. */
      .filter((s) => {
        if (s.cle === 'recompense') return Boolean(contexte.recompense?.nom);
        if (['indice', 'parchemin', 'anomalie', 'verdict_acte'].includes(s.cle)) {
          return Boolean(contexte.texte);
        }
        return true;
      });
    setCtx({ titre: d.titre, date: d.jour?.date, ...contexte });
    if (seq.length) setScenes(seq); else charger();
  }, [d, charger]);

  /* Les scènes d'ouverture. Elles partent DANS LE MÊME LOT que le premier
     affichage du dossier : le voile est déjà là quand la page se peint,
     au lieu de voir le dossier, puis le voile, puis le dossier.

     Le « une seule fois » vient du serveur, pas du navigateur :
     `minutes === 0` veut dire que le dossier vient d'être ouvert. Une
     mémoire de session, elle, ne se vide jamais dans une app posée sur
     l'écran d'accueil — l'animation ne se rejouait donc plus jamais. */
  useEffect(() => {
    if (etape !== 'ouverture' || !d) return;
    if (d.phase !== 'enquete') { setEtape('jeu'); return; }

    const cat = d.catalogue || [];
    const seq = [
      ...sequencePour('chargement', d.manche, cat, d.animations, d.vuesAnim),
      ...(d.manche && !d.manche.resolu && (d.manche.minutes ?? 0) === 0
        ? sequencePour('jour', d.manche, cat, d.animations, d.vuesAnim)
        : []),
    ];
    setCtx({ titre: d.titre, date: d.jour?.date });
    if (seq.length) setScenes(seq);
    setEtape('jeu');
  }, [etape, d]);

  const finScenes = useCallback(async (vues) => {
    setScenes(null);
    if (vues?.length) await api('/api/ouvrir', { scenes: vues }, 'PATCH');
    charger();
  }, [charger]);

  const skin = `sk ${d?.skin === 'chambre' ? 'chambre' : ''} ${d?.papierNet ? 'papier-net' : ''}`;

  if (!d) return <div className="sk"><Decor /><div className="colonne"><p className="chargement">…</p></div></div>;

  if (d.phase === 'ferme') {
    return <div className={skin}><Decor /><div className="colonne"><p className="chargement">INTROUVABLE</p></div></div>;
  }

  const repondre = async (saisie) => {
    const r = await api('/api/verify', { slug: d.manche.slug, saisie });
    if (r.ok && !r.deja) {
      /* Le dernier jour, le descellement vient après le tampon : c'est la
         scène qui dit que tout ce qui était fermé s'ouvre. */
      const rang = (d.scelles?.pris || 0) + 1;
      const total = d.scelles?.total;
      const cat = d.catalogue || [];
      const suite = [
        ...sequencePour('reponse-juste', d.manche, cat, d.animations, d.vuesAnim)
          .filter((x) => x.cle !== 'recompense' || Boolean(r.recompense?.nom)),
        ...(d.jour?.dernier
          ? sequencePour('verdict', d.manche, cat, d.animations, d.vuesAnim)
          : []),
      ];
      setCtx({
        titre: d.titre, date: d.jour?.date,
        recompense: r.recompense, minutes: r.minutes, chronoRef: r.chronoRef,
        rang, total,
      });
      if (suite.length) setScenes(suite); else charger();
    } else if (!r.ok) {
      jouer('reponse-fausse');
    } else charger();
    return r;
  };

  const passe = async (saisie) => {
    const r = await api('/api/verify', { slug: d.manche.slug, quoi: 'passe', saisie });
    if (r.ok) jouer('serrure-ouverte', { texte: r.revele });
    else jouer('reponse-fausse');
    return r;
  };

  const indice = async () => {
    const r = await api('/api/indice', { slug: d.manche.slug });
    if (r.ok) jouer('indice', { texte: r.texte, rang: r.rang, minutes: d.manche.minutes });
    return r;
  };

  const assemblage = () => jouer('assemblage');

  /* Le code du dernier jour. La lettre arrive avec la réponse : la scène
     la tape ligne à ligne, l'onglet la garde ensuite. */
  const code = async (saisie) => {
    const r = await api('/api/verify', { quoi: 'code', saisie });
    if (r.ok) jouer('code-juste', { texte: r.texte });
    else jouer('reponse-fausse');
    return r;
  };

  const anomalie = async (saisie) => {
    const r = await api('/api/verify', { slug: d.manche.slug, quoi: 'anomalie', saisie });
    if (r.ok) jouer('anomalie', { texte: r.texte });
    return r;
  };

  return (
    <div className={skin}>
      <Decor />

      <div className="colonne">
        {etape === 'intro' && d.phase !== 'ferme'
          ? <Intro intro={d.intro} surtitre={d.surtitre} onFini={finirIntro} />
          : d.phase !== 'enquete'
            ? <Attente d={d} />
            : etape !== 'jeu' ? null : (
              <div className="jeu">
                <Tete d={d} />
                <Scelles d={d} />

                {onglet === 'manche' && (
                  d.manche
                    ? <Manche m={d.manche} onRepondre={repondre} onPasse={passe}
                        onAnomalie={anomalie} onIndice={indice} onAssemble={assemblage}
                        textesAnomalie={d.anomalie} />
                    : <p className="veille">Le greffe ne verse rien aujourd'hui.</p>
                )}
                {onglet === 'tableau' && <Tableau d={d} />}
                {onglet === 'fonds' && <Fonds d={d} />}
                {onglet === 'enveloppe' && <Enveloppe d={d} onCode={code} />}
                {onglet === 'invitation' && <Invitation d={d} />}

                <nav className="onglets">
                  {ORDRE_ONGLETS.filter((o) => (d.onglets || []).includes(o)).map((o) => (
                    <button key={o} type="button" className={onglet === o ? 'on' : ''}
                      onClick={() => setOnglet(o)}>{NOMS_ONGLETS[o] || o}</button>
                  ))}
                </nav>
              </div>
            )}
      </div>

      {etape === 'amorcage' && <Amorcage titre={d.titre} onFini={finirAmorcage} />}

      {scenes && (
        <Lecteur sequence={scenes} contexte={ctx} reglages={d.animations} onFini={finScenes} />
      )}

      {d.repetition && etape === 'jeu' && (
        <Repetition d={d} recharger={charger} jouerScene={(cle) => {
          const a = (d.catalogue || []).find((x) => x.cle === cle);
          setCtx({
            titre: d.titre, date: d.jour?.date, texte: 'Répétition — texte de démonstration.',
            recompense: { nom: 'Une récompense', precision: 'pour voir la carte se retourner' },
            minutes: 22, chronoRef: 35, rang: 3, total: d.scelles?.total || 8,
          });
          setScenes([{ cle, nom: a?.nom || cle, duree: a?.duree_ms || 2600, courte: false, options: {} }]);
        }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  L'ambiance                                                         */
/* ------------------------------------------------------------------ */

function Decor() {
  return (
    <>
      <div className="fond" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="motes" aria-hidden="true">
        {MOTES.map((s, i) => <b key={i} style={s} />)}
      </div>
    </>
  );
}

/* L'amorçage : le nom qui se tape, la barre qui se charge. */
function Amorcage({ titre, onFini }) {
  return (
    <div className="boot" onClick={onFini} role="presentation">
      <div>
        <div className="boot-nom">{titre}</div>
        <div className="boot-barre"><i /></div>
        <div className="boot-pied">ACCÈS AUTORISÉ — TOUCHEZ POUR ENTRER</div>
      </div>
    </div>
  );
}

/* L'introduction — son texte se saisit depuis la console. */
function Intro({ intro, surtitre, onFini }) {
  const paras = String(intro?.texte || '').split('\n').filter((l) => l.trim());
  return (
    <section className="intro">
      {surtitre && <p className="surtitre">{surtitre}</p>}
      <h1 className="titre">{intro.titre}</h1>
      {paras.map((p, i) => <p className="corps" key={i}>{p}</p>)}
      <button type="button" className="bouton" onClick={onFini}>{intro.bouton || 'Entrer'}</button>
    </section>
  );
}

/* Avant l'ouverture : un sceau de cire, un compte à rebours, rien d'autre. */
function Attente({ d }) {
  return (
    <section className="attente">
      {/* Ce qui est gravé dans la cire : la cote, saisie dans la console. */}
      <div className="cire">{d.cote || ''}</div>
      {d.surtitre && <p className="surtitre">{d.surtitre}</p>}
      <h2 className="titre">{d.attente?.titre || d.titre}</h2>
      {d.attente?.texte && <p>{d.attente.texte}</p>}
      <Compte cible={d.ouverture} horloge={d.horloge} />
    </section>
  );
}

function Compte({ cible, horloge }) {
  const [t, setT] = useState(Math.max(0, (cible || 0) - (horloge || 0)));
  useEffect(() => {
    const id = setInterval(() => setT((x) => Math.max(0, x - 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(t / 1000);
  const deux = (n) => String(n).padStart(2, '0');
  const cases = [
    [String(Math.floor(s / 86400)), 'JOURS'],
    [deux(Math.floor(s / 3600) % 24), 'HEURES'],
    [deux(Math.floor(s / 60) % 60), 'MINUTES'],
    [deux(s % 60), 'SECONDES'],
  ];
  return (
    <div className="compte">
      {cases.map(([v, l]) => <span key={l}>{v}<em>{l}</em></span>)}
    </div>
  );
}

function Tete({ d }) {
  return (
    <header className="tete">
      <div className="tete-g">
        {d.surtitre && <span>{d.surtitre}</span>}
        <h1>{d.titre}</h1>
      </div>
      <div className="tete-d">
        {d.cote && <b>{d.cote}</b>}
        <span>JOUR {d.jour.index + 1}/{d.jour.total}</span>
      </div>
    </header>
  );
}

function Scelles({ d }) {
  const total = d.scelles?.total || 0;
  const pris = d.scelles?.pris || 0;
  return (
    <div className="scelles">
      <p className="scelles-t"><span>SCELLÉS RELEVÉS</span><b>{pris} / {total}</b></p>
      <div className="scelles-g"
        style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(total, 1), 8)}, 1fr)` }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`sceau-c ${i < pris ? 'pris' : ''}`}>{i + 1}</span>
        ))}
      </div>
      <div className="jauge"><i style={{ width: total ? `${(pris / total) * 100}%` : '0%' }} /></div>
    </div>
  );
}

function Tableau({ d }) {
  return (
    <section className="board">
      <h2>CE QUI EST ÉTABLI</h2>
      {!d.acquis.length && <p className="veille">Rien encore.</p>}
      <div className="acquis">
        {d.acquis.map((a) => (
          <div className="fiche" key={a.slug}>
            <span className="trombone" aria-hidden="true" />
            <strong>{a.resultat || '—'}</strong>
            <small>
              {a.titre} · {a.date}
              {a.minutes != null && a.chronoRef != null && ` · ${a.minutes} min contre ${a.chronoRef}`}
            </small>
          </div>
        ))}
      </div>

      {!!d.anomalies.length && (
        <>
          <h2 className="alerte">NE RELÈVE D'AUCUN DOSSIER</h2>
          <div className="anos">
            {d.anomalies.map((a) => <p key={a.slug}>{a.texte}</p>)}
          </div>
        </>
      )}
    </section>
  );
}

/* L'enveloppe du dernier jour. Scellée tant que le code n'est pas juste —
   et scellée pour de vrai : la lettre ne quitte pas le serveur avant. */
function Enveloppe({ d, onCode }) {
  const v = d.verdict || {};
  const [code, setCode] = useState('');
  const [refus, setRefus] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!code.trim() || envoi) return;
    setEnvoi(true); setRefus('');
    try {
      const r = await onCode(code.trim());
      if (r?.ok) setCode(''); else setRefus('Ce n’est pas cette date-là.');
    } finally { setEnvoi(false); }
  };

  if (v.codeOk) {
    return (
      <section className="lettre">
        <h2>{v.titre}</h2>
        <article className="lettre-p">
          {String(v.lettre || '').split('\n').map((l, i) =>
            l.trim() === '' ? <br key={i} /> : <p key={i}>{l}</p>)}
        </article>
        {v.anomaliesTrouvees > 0 && (
          <p className="lettre-pied">
            {v.anomaliesTrouvees} anomalie{v.anomaliesTrouvees > 1 ? 's' : ''} relevée
            {v.anomaliesTrouvees > 1 ? 's' : ''}
            {v.complete ? ' — vous aviez tout vu.' : '.'}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="enveloppe">
      <div className="env-cire" aria-hidden="true" />
      <h2>{v.titre}</h2>
      {v.invite && <p className="env-invite">{v.invite}</p>}
      <form className="env-form" onSubmit={envoyer}>
        <input className="champ" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder={v.placeholder || ''} inputMode="numeric" autoComplete="off"
          autoCorrect="off" spellCheck={false} enterKeyHint="send"
          aria-label="Le code" disabled={envoi} />
        <button className="deposer" disabled={!code.trim() || envoi}>
          {envoi ? '…' : 'Ouvrir'}
        </button>
      </form>
      {refus && <p className="env-refus">{refus}</p>}
    </section>
  );
}

/* Ce qui vient après la lettre — elle l'ouvre depuis la console quand
   elle veut, onglet « La partie ». */
function Invitation({ d }) {
  const i = d.invitation || {};
  return (
    <section className="lettre">
      {i.titre && <h2>{i.titre}</h2>}
      <article className="lettre-p">
        {String(i.texte || '').split('\n').map((l, k) =>
          l.trim() === '' ? <br key={k} /> : <p key={k}>{l}</p>)}
      </article>
    </section>
  );
}

function Fonds({ d }) {
  const total = d.tailleFonds || 8;
  const pris = d.scelles?.pris || 0;
  return (
    <section className="fonds">
      <h2>LE FONDS</h2>
      <p className="fonds-i">{total} dossiers. Vous en avez ouvert {pris}.</p>
      <div className="fonds-g">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`fonds-c ${i < pris ? 'ouvert' : ''}`}>
            {String(i + 1).padStart(2, '0')}
          </span>
        ))}
      </div>
      {d.piedFonds && <p className="fonds-p">{d.piedFonds}</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  La barre de répétition — n'existe que pour le cookie admin         */
/* ------------------------------------------------------------------ */

function Repetition({ d, recharger, jouerScene }) {
  const [ouvert, setOuvert] = useState(true);
  const [reponse, setReponse] = useState(null);
  const [rapide, setRapide] = useState((d.paliers?.[0] ?? 60) === 0);

  const act = async (corps) => {
    const r = await api('/api/repetition', corps);
    await recharger();
    return r;
  };

  const jour = (d.jour?.index ?? 0) + 1;
  const total = d.jour?.total ?? 8;

  if (!ouvert) {
    return <button className="rep-poignee" onClick={() => setOuvert(true)}>répétition</button>;
  }

  return (
    <aside className="rep">
      <div className="rep-tete">
        <strong>{d.essai ? 'Banc d’essai' : 'Répétition'}</strong>
        <button onClick={() => setOuvert(false)} aria-label="replier">−</button>
      </div>

      {!d.essai && (
        <p className="rep-hors">
          Hors banc d’essai : le jour et les paliers ne bougent pas.
          Ouvre-le depuis <a href="/admin">la console</a>.
        </p>
      )}

      <div className="rep-ligne">
        <button disabled={!d.essai || jour <= 1} onClick={() => act({ action: 'jour', jour: jour - 1 })}>◀</button>
        <span className="rep-jour">jour {jour} / {total}</span>
        <button disabled={!d.essai || jour >= total} onClick={() => act({ action: 'jour', jour: jour + 1 })}>▶</button>
      </div>
      <div className="rep-ligne rep-sauts">
        {Array.from({ length: total }, (_, i) => (
          <button key={i} className={jour === i + 1 ? 'on' : ''} disabled={!d.essai}
            onClick={() => act({ action: 'jour', jour: i + 1 })}>{i + 1}</button>
        ))}
      </div>

      <div className="rep-ligne">
        <label className="rep-case">
          <input type="checkbox" checked={rapide} disabled={!d.essai}
            onChange={async (e) => {
              setRapide(e.target.checked);
              await act({ action: 'paliers', zero: e.target.checked });
            }} />
          Indices sans attendre
        </label>
      </div>

      <div className="rep-ligne">
        <button onClick={() => act({ action: 'manche.raz' })}>Rejouer ce jour</button>
        <button onClick={() => act({ action: 'scenes.oublier' })}>Scènes en entier</button>
      </div>

      <div className="rep-ligne">
        <button onClick={async () => setReponse(await act({ action: 'reponse' }))}>Voir la réponse</button>
        <button className="rep-danger" onClick={async () => {
          if (confirm('Tout remettre à zéro ?')) await act({ action: 'raz' });
        }}>Tout à zéro</button>
      </div>

      {reponse?.ok && (
        <div className="rep-reponse">
          {reponse.passe && <p><span>passe</span> {reponse.passe}</p>}
          <p><span>réponse</span> {reponse.reponse}</p>
          {reponse.anomalie && <p><span>anomalie</span> {reponse.anomalie}</p>}
        </div>
      )}

      <div className="rep-ligne rep-scenes">
        <span className="rep-titre">Jouer une scène</span>
        {(d.catalogue || []).map((a) => (
          <button key={a.cle} onClick={() => jouerScene(a.cle)} title={a.nom}>{a.cle}</button>
        ))}
      </div>
    </aside>
  );
}
