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

/* Douze étincelles, déterministes : le serveur rend la même chose. */
const ETINCELLES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return {
    '--ex': `${Math.round(Math.cos(a) * 110)}px`,
    '--ey': `${Math.round(Math.sin(a) * 110)}px`,
    animation: `eclat .7s ${0.12 + (i % 4) * 0.05}s cubic-bezier(.2,.85,.25,1) both`,
  };
});

function Tampon({ texte, ko }) {
  if (ko) return <div className="sc-tampon ko">{texte || 'REJETÉ'}</div>;
  return (
    <div style={{ position: 'relative' }}>
      <div className="sc-tampon">{texte || 'VERSÉ'}</div>
      <div className="sc-etincelles" aria-hidden="true">
        {ETINCELLES.map((s, i) => <b key={i} style={s} />)}
      </div>
    </div>
  );
}

function Sceau({ n, total }) {
  const reste = Number.isFinite(total) && Number.isFinite(n) ? total - n : null;
  return (
    <div>
      <div className="sc-sceau">{n ?? '·'}</div>
      <p className="sc-sceau-t">Le scellé est relevé.</p>
      {reste != null && (
        <p className="sc-sceau-s">
          {reste > 0 ? `${reste} RESTE${reste > 1 ? 'NT' : ''}` : 'PLUS AUCUN NE TIENT'}
        </p>
      )}
    </div>
  );
}

function Chrono({ minutes, reference }) {
  const a = Number(minutes);
  const b = Number(reference);
  const ok = Number.isFinite(a) && Number.isFinite(b);
  const max = ok ? Math.max(a, b, 1) : 1;
  return (
    <div className="sc-chrono">
      <p className="sc-chrono-t">CONTRE L’ARCHIVISTE</p>
      <div className="sc-barre">
        <i className="moi" style={{ width: ok ? `${(a / max) * 100}%` : 0 }} />
        <span>VOUS · {ok ? `${a} min` : '—'}</span>
      </div>
      <div className="sc-barre">
        <i className="lui" style={{ width: ok ? `${(b / max) * 100}%` : 0 }} />
        <span className={ok && b >= a ? 'sombre' : ''}>L’ARCHIVISTE · {ok ? `${b} min` : '—'}</span>
      </div>
      {ok && (
        <p className="sc-chrono-v">
          {a < b ? `${b - a} minutes de mieux que lui.`
            : a === b ? 'À la minute près.'
              : `${a - b} minutes de plus que lui.`}
        </p>
      )}
    </div>
  );
}

function Recompense({ recompense, rang, total }) {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOuvert(true), 700); return () => clearTimeout(t); }, []);
  if (!recompense?.nom) return null;
  return (
    <div className={`sc-carte ${ouvert ? 'ouverte' : ''}`}>
      <div className="sc-carte-i">
        <div className="sc-dos"><b /></div>
        <div className="sc-face">
          <span className="eti">CE QUI VOUS REVIENT</span>
          <strong>{recompense.nom}</strong>
          {recompense.precision && <span className="pre">{recompense.precision}</span>}
          {rang != null && total != null && (
            <span className="pied">PIÈCE {String(rang).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* Un texte qui se tape, lettre à lettre. */
function useFrappe(texte, duree) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = String(texte || '');
    if (!t) return;
    const pas = Math.max(14, (duree * 0.72) / t.length);
    const id = setInterval(() => setN((x) => (x >= t.length ? (clearInterval(id), x) : x + 1)), pas);
    return () => clearInterval(id);
  }, [texte, duree]);
  return String(texte || '').slice(0, n);
}

function Indice({ texte, duree, rang, minutes }) {
  const vu = useFrappe(texte, duree);
  return (
    <div className="sc-indice">
      <div className="sc-indice-t">
        <span>INDICE {String(rang || 1).padStart(2, '0')}</span>
        {minutes != null && <span>DEMANDÉ À {minutes} MIN</span>}
      </div>
      <p>{vu}<i /></p>
    </div>
  );
}

function Parchemin({ texte, eti = 'L’ENCRE REVIENT' }) {
  const l = String(texte || '').split('\n');
  return (
    <div className="sc-parchemin">
      <div>
        <span className="eti">{eti}</span>
        {l.map((t, i) => (
          <span className="ligne" key={i} style={{ animationDelay: `${0.3 + i * 0.34}s` }}>
            {t || ' '}
          </span>
        ))}
      </div>
    </div>
  );
}

function Anomalie({ texte }) {
  return <Parchemin texte={texte} eti="NE RELÈVE D’AUCUN DOSSIER" />;
}

function Descellement({ n = 7 }) {
  return (
    <div className="sc-descellement">
      <div className="sc-desc-g">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} style={{ animation: `fend .8s ${i * 0.18}s cubic-bezier(.2,.85,.25,1) both` }} />
        ))}
      </div>
      <p className="sc-desc-t">Plus rien ne tient fermé.</p>
      <p className="sc-desc-s">{n} SCELLÉS LEVÉS</p>
    </div>
  );
}

function Ouverture({ date, titre }) {
  return (
    <div className="sc-ouverture">
      {date && <small>{date}</small>}
      <strong>{titre}</strong>
    </div>
  );
}

function Machine({ texte, duree }) {
  const vu = useFrappe(texte, duree);
  return <pre className="sc-machine">{vu}</pre>;
}

const RENDUS = {
  demarrage: (p) => <Machine texte={p.titre} duree={p.duree} />,
  ouverture_dossier: (p) => <Ouverture date={p.date} titre={p.titre} />,
  /* `tampon` et pas `texte` : le contexte porte déjà un `texte` (l'indice,
     le parchemin) et le tampon n'a rien à voir avec lui. */
  tampon_ok: (p) => <Tampon texte={p.tampon} />,
  tampon_ko: (p) => <Tampon texte={p.tampon} ko />,
  sceau: (p) => <Sceau n={p.rang} total={p.total} />,
  chrono: (p) => <Chrono minutes={p.minutes} reference={p.chronoRef} />,
  recompense: (p) => <Recompense recompense={p.recompense} rang={p.rang} total={p.total} />,
  anomalie: (p) => <Anomalie texte={p.texte} />,
  indice: (p) => <Indice texte={p.texte} duree={p.duree} rang={p.rang} minutes={p.minutes} />,
  parchemin: (p) => <Parchemin texte={p.texte} />,
  descellement: (p) => <Descellement n={p.total} />,
  assemblage_ok: () => <div className="sc-balayage" />,
  verdict_acte: (p) => <Parchemin texte={p.texte} eti="LE VERDICT" />,
};

/* ---- Le lecteur ---- */

export function Lecteur({ sequence, contexte, reglages, onFini }) {
  const [i, setI] = useState(0);
  const minuteur = useRef(null);
  const scene = sequence?.[i];

  /* Le doigt qui vient d'appuyer sur « Déposer » est encore posé quand le
     voile arrive dessous : sans ce délai, le même geste balaie la scène
     avant qu'elle n'ait commencé, et on a l'impression qu'il ne s'est rien
     passé. 400 ms suffisent, et ça ne se sent pas. */
  const ouvert = useRef(0);
  useEffect(() => { ouvert.current = Date.now(); }, [i]);

  const suivant = useCallback(() => {
    if (Date.now() - ouvert.current < 400) return;
    clearTimeout(minuteur.current);
    setI((x) => x + 1);
  }, []);

  /* Le minuteur, lui, n'est pas concerné par ce délai. */
  const forcer = useCallback(() => {
    clearTimeout(minuteur.current);
    setI((x) => x + 1);
  }, []);

  /* Par défaut la scène ne s'en va pas toute seule : il la regarde le temps
     qu'il veut et la ferme d'une croix. C'est réglable depuis /admin —
     décocher « Attendre que le joueur ferme » rend la minuterie. */
  const attend = reglages?.attendreLeJoueur !== false;

  useEffect(() => {
    if (!sequence?.length) { onFini?.(); return; }
    if (i >= sequence.length) { onFini?.(sequence.map((s) => s.cle)); return; }
    if (attend) return;
    minuteur.current = setTimeout(forcer, sequence[i].duree);
    return () => clearTimeout(minuteur.current);
  }, [i, sequence, forcer, onFini, attend]);

  /* Respecter la préférence système, si l'admin l'a demandé. */
  useEffect(() => {
    if (reglages?.respecterReducedMotion === false) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) onFini?.([]);
  }, [reglages, onFini]);

  const rendu = scene ? RENDUS[scene.cle] : null;
  const sortie = rendu ? rendu({ ...contexte, duree: scene.duree, ...scene.options }) : null;

  /* Une scène qui n'a rien à montrer — une récompense pas encore écrite,
     par exemple — ne doit pas manger deux secondes d'écran noir. */
  useEffect(() => {
    if (scene && !sortie) suivant();
  }, [scene, sortie, suivant]);

  if (!scene || !sortie) return null;

  return (
    <div
      className="sc-voile"
      role="presentation"
      onClick={reglages?.sautToujours === false ? undefined : suivant}
    >
      <button className="sc-fermer" type="button" aria-label="Fermer"
        onClick={(e) => { e.stopPropagation(); suivant(); }}>×</button>

      {sortie}

      {sequence.length > 1 && (
        <div className="sc-points" aria-hidden="true">
          {sequence.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}
        </div>
      )}

      {reglages?.sautToujours !== false && (
        <span className="sc-saut">
          {i + 1 < sequence.length ? 'TOUCHER POUR LA SUITE' : 'TOUCHER POUR FERMER'}
        </span>
      )}
    </div>
  );
}
