'use client';
/* Le moteur d'animations.
 *
 * Il ne décide de rien : il joue la séquence que le serveur lui donne,
 * calculée depuis le catalogue et les réglages du dossier. Une scène
 * absente du catalogue, désactivée depuis /admin, ou hors du mode du
 * dossier n'arrive tout simplement pas ici.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/* ---- Les scènes. Chaque clé du catalogue a son rendu ici. ---- */

function Tampon({ texte, ko }) {
  return (
    <div className={`sc-tampon ${ko ? 'ko' : ''}`}>
      <span>{texte || (ko ? 'REJETÉ' : 'RECEVABLE')}</span>
    </div>
  );
}

function Sceau({ n }) {
  return (
    <div className="sc-sceau">
      <div className="sc-cire"><span>{n ?? '·'}</span></div>
      <p>Scellé versé au dossier</p>
    </div>
  );
}

function Chrono({ minutes, ref: reference }) {
  const a = Number(minutes);
  const b = Number(reference);
  const ok = Number.isFinite(a) && Number.isFinite(b);
  const max = ok ? Math.max(a, b) : 1;
  return (
    <div className="sc-chrono">
      <p className="sc-chrono-t">Contre l'Archiviste</p>
      <div className="sc-barre"><i style={{ '--p': `${ok ? (a / max) * 100 : 0}%` }} className="moi" /><span>vous · {ok ? `${a} min` : '—'}</span></div>
      <div className="sc-barre"><i style={{ '--p': `${ok ? (b / max) * 100 : 0}%` }} className="lui" /><span>lui · {ok ? `${b} min` : '—'}</span></div>
      {ok && <p className="sc-verdict-chrono">{a < b ? 'Vous avez été plus rapide.' : a === b ? 'À la seconde près.' : `${a - b} minutes de plus.`}</p>}
    </div>
  );
}

function Recompense({ recompense }) {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOuvert(true), 700); return () => clearTimeout(t); }, []);
  if (!recompense?.nom) return null;
  return (
    <div className={`sc-carte ${ouvert ? 'ouverte' : ''}`}>
      <div className="sc-carte-dos"><span className="sc-carte-cire" /></div>
      <div className="sc-carte-face">
        <small>Ce qui vous revient</small>
        <strong>{recompense.nom}</strong>
        {recompense.precision && <p>{recompense.precision}</p>}
      </div>
    </div>
  );
}

function Anomalie({ texte }) {
  return (
    <div className="sc-anomalie">
      <small>Ne relève d'aucun dossier</small>
      <p>{texte}</p>
    </div>
  );
}

function Descellement({ n = 7 }) {
  return (
    <div className="sc-descellement">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
      <p>Les scellés sont levés</p>
    </div>
  );
}

function Machine({ texte, duree }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = String(texte || '');
    if (!t) return;
    const pas = Math.max(12, duree / t.length);
    const id = setInterval(() => setN((x) => (x >= t.length ? (clearInterval(id), x) : x + 1)), pas);
    return () => clearInterval(id);
  }, [texte, duree]);
  return <pre className="sc-machine">{String(texte || '').slice(0, n)}<i /></pre>;
}

const RENDUS = {
  demarrage: (p) => <Machine texte={p.titre || 'FONDS 47'} duree={p.duree * 0.6} />,
  ouverture_dossier: (p) => (
    <div className="sc-ouverture"><small>{p.date}</small><strong>{p.titre}</strong></div>
  ),
  tampon_ok: () => <Tampon />,
  tampon_ko: () => <Tampon ko />,
  sceau: (p) => <Sceau n={p.rang} />,
  chrono: (p) => <Chrono minutes={p.minutes} ref={p.chronoRef} />,
  recompense: (p) => <Recompense recompense={p.recompense} />,
  anomalie: (p) => <Anomalie texte={p.texte} />,
  indice: (p) => <Machine texte={p.texte} duree={p.duree} />,
  parchemin: (p) => <Machine texte={p.texte} duree={p.duree} />,
  descellement: (p) => <Descellement n={p.total} />,
  assemblage_ok: () => <div className="sc-balayage" />,
  verdict_acte: (p) => <Machine texte={p.texte} duree={p.duree} />,
};

/* ---- Le lecteur ---- */

export function Lecteur({ sequence, contexte, reglages, onFini }) {
  const [i, setI] = useState(0);
  const minuteur = useRef(null);
  const scene = sequence?.[i];

  const suivant = useCallback(() => {
    clearTimeout(minuteur.current);
    setI((x) => x + 1);
  }, []);

  useEffect(() => {
    if (!sequence?.length) { onFini?.(); return; }
    if (i >= sequence.length) { onFini?.(sequence.map((s) => s.cle)); return; }
    minuteur.current = setTimeout(suivant, sequence[i].duree);
    return () => clearTimeout(minuteur.current);
  }, [i, sequence, suivant, onFini]);

  /* Respecter la préférence système, si l'admin l'a demandé. */
  useEffect(() => {
    if (reglages?.respecterReducedMotion === false) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) onFini?.([]);
  }, [reglages, onFini]);

  if (!scene) return null;
  const rendu = RENDUS[scene.cle];
  if (!rendu) return null;

  return (
    <div
      className="sc-voile"
      role="presentation"
      onClick={reglages?.sautToujours === false ? undefined : suivant}
    >
      <div className="sc-scene" key={scene.cle} style={{ '--d': `${scene.duree}ms` }}>
        {rendu({ ...contexte, duree: scene.duree, ...scene.options })}
      </div>
      {reglages?.sautToujours !== false && (
        <button className="sc-saut" onClick={suivant}>passer</button>
      )}
    </div>
  );
}
