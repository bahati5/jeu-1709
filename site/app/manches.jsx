'use client';
/* Le rendu d'une manche, par type.
 *
 * Rien ici ne connaît le contenu du jeu : chaque composant reçoit le
 * `payload` que le serveur a bien voulu servir et l'affiche. Ajouter un
 * dossier ne touche pas ce fichier ; ajouter un TYPE, oui.
 */
import { useState } from 'react';

const lignes = (t) => String(t || '').split('\n');

function Enonce({ texte }) {
  if (!texte) return null;
  return (
    <div className="ma-enonce">
      {lignes(texte).map((l, i) =>
        l.trim() === '' ? <br key={i} /> : <p key={i}>{l}</p>)}
    </div>
  );
}

function Pieces({ noms }) {
  const liste = Array.isArray(noms) ? noms : noms ? [noms] : [];
  if (!liste.length) return null;
  return (
    <ul className="ma-pieces">
      {liste.map((n) => {
        const image = /\.(png|jpe?g|gif|webp|avif)$/i.test(n);
        return (
          <li key={n}>
            {image
              ? <a href={`/api/media/${encodeURIComponent(n)}`} target="_blank" rel="noreferrer">
                  <img src={`/api/media/${encodeURIComponent(n)}`} alt={n} loading="lazy" />
                </a>
              : <a className="ma-fichier" href={`/api/media/${encodeURIComponent(n)}`} download>{n}</a>}
          </li>
        );
      })}
    </ul>
  );
}

function Champ({ placeholder, onEnvoyer, bloque, restant, libelle = 'Déposer' }) {
  const [v, setV] = useState('');
  return (
    <form className="ma-champ" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onEnvoyer(v); }}>
      <input value={v} onChange={(e) => setV(e.target.value)}
        placeholder={placeholder || 'Votre réponse'} disabled={bloque} autoComplete="off" />
      <button disabled={bloque || !v.trim()}>{libelle}</button>
      {restant != null && restant < 3 && !bloque &&
        <small className="ma-restant">{restant} tentative{restant > 1 ? 's' : ''} avant blocage</small>}
    </form>
  );
}

/* ---- Les types ---- */

function Note({ m }) {
  return (
    <article className={`ma-note ${m.payload.ton || 'neutre'}`}>
      <Enonce texte={m.payload.texte} />
      {m.payload.signature && <p className="ma-signature">{m.payload.signature}</p>}
    </article>
  );
}

function Saisie({ m, onRepondre }) {
  return (
    <>
      <Enonce texte={m.payload.enonce} />
      <Pieces noms={m.payload.medias} />
      {m.payload.consigne && <p className="ma-consigne">{m.payload.consigne}</p>}
      {!m.resolu && <Champ placeholder={m.payload.placeholder} onEnvoyer={onRepondre}
        bloque={!!m.bloqueJusqu} restant={m.tentativesRestantes} />}
    </>
  );
}

function Grille({ m, onRepondre }) {
  const cats = m.payload.categories || [];
  return (
    <>
      <Enonce texte={m.payload.enonce} />
      {!!cats.length && (
        <div className="ma-grille-cats">
          {cats.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      )}
      {!!(m.payload.contraintes || []).length && (
        <ol className="ma-contraintes">
          {m.payload.contraintes.map((c, i) => <li key={i}>{c}</li>)}
        </ol>
      )}
      {m.payload.consigne && <p className="ma-consigne">{m.payload.consigne}</p>}
      {!m.resolu && <Champ onEnvoyer={onRepondre} bloque={!!m.bloqueJusqu} restant={m.tentativesRestantes} />}
    </>
  );
}

function Imposteur({ m, onRepondre }) {
  const [sel, setSel] = useState(null);
  const decl = m.payload.declarations || [];
  return (
    <>
      <Enonce texte={m.payload.enonce} />
      <ul className="ma-declarations">
        {decl.map((t, i) => (
          <li key={i}>
            <button type="button" className={sel === i ? 'on' : ''}
              onClick={() => setSel(i)} disabled={m.resolu}>
              <span className="ma-num">{i + 1}</span>{t}
            </button>
          </li>
        ))}
      </ul>
      {m.payload.consigne && <p className="ma-consigne">{m.payload.consigne}</p>}
      {!m.resolu && (
        <div className="ma-champ">
          <button disabled={sel == null || !!m.bloqueJusqu}
            onClick={() => onRepondre(decl[sel])}>Désigner</button>
        </div>
      )}
    </>
  );
}

function Serrure({ m, onPasse, onRepondre }) {
  if (!m.ouverte) {
    return (
      <>
        <Enonce texte={m.payload.invite} />
        <Champ placeholder="…" onEnvoyer={onPasse} libelle="Demander" />
      </>
    );
  }
  return (
    <>
      <pre className="ma-revele">{m.payload.revele}</pre>
      {m.payload.consigne && <p className="ma-consigne">{m.payload.consigne}</p>}
      {!m.resolu && <Champ onEnvoyer={onRepondre} bloque={!!m.bloqueJusqu} restant={m.tentativesRestantes} />}
    </>
  );
}

function Assemblage({ m, onRepondre }) {
  const c = m.payload.colonnes || 4, l = m.payload.lignes || 2;
  const [ordre, setOrdre] = useState(() =>
    [...Array(c * l).keys()].sort(() => Math.random() - 0.5));
  const [sel, setSel] = useState(null);
  const fait = ordre.every((v, i) => v === i);

  const clic = (i) => {
    if (sel == null) return setSel(i);
    const n = [...ordre];
    [n[sel], n[i]] = [n[i], n[sel]];
    setOrdre(n); setSel(null);
  };

  return (
    <>
      <Enonce texte={m.payload.enonce} />
      <div className="ma-taquin" style={{ '--c': c, '--l': l }}>
        {ordre.map((v, i) => (
          <button key={i} type="button" className={sel === i ? 'on' : ''} onClick={() => clic(i)}
            style={{
              backgroundImage: `url(/api/media/${encodeURIComponent(m.payload.media || '')})`,
              backgroundSize: `${c * 100}% ${l * 100}%`,
              backgroundPosition: `${(v % c) * (100 / (c - 1 || 1))}% ${Math.floor(v / c) * (100 / (l - 1 || 1))}%`,
            }} />
        ))}
      </div>
      {fait && !m.resolu && (
        <>
          {m.payload.consigne && <p className="ma-consigne">{m.payload.consigne}</p>}
          <Champ onEnvoyer={onRepondre} bloque={!!m.bloqueJusqu} restant={m.tentativesRestantes} />
        </>
      )}
    </>
  );
}

const PAR_TYPE = {
  note: Note,
  saisie: Saisie,
  fichier: Saisie,     // même rendu : énoncé + pièces + champ
  grille: Grille,
  imposteur: Imposteur,
  serrure: Serrure,
  assemblage: Assemblage,
};

export function Manche({ m, onRepondre, onPasse, onAnomalie }) {
  if (!m) return null;
  const Rendu = PAR_TYPE[m.type];
  const [anomalie, setAnomalie] = useState('');

  return (
    <section className="ma">
      <header className="ma-tete">
        <small>{m.genre}</small>
        <h2>{m.titre}</h2>
        {m.chronoRef != null && (
          <p className="ma-ref">L'Archiviste : {m.chronoRef} min
            {m.minutes != null && <span> · vous : {m.minutes} min</span>}</p>
        )}
      </header>

      {Rendu
        ? <Rendu m={m} onRepondre={onRepondre} onPasse={onPasse} />
        : <p className="ma-consigne">Type de manche inconnu.</p>}

      {m.bloqueJusqu && (
        <p className="ma-bloque">
          Trop de tentatives. Rouvrez dans {Math.max(1, Math.ceil((m.bloqueJusqu - Date.now()) / 60000))} min.
        </p>
      )}

      {m.resolu && <p className="ma-resolu">Dossier clos.</p>}

      {!!(m.indices || []).length && (
        <details className="ma-indices">
          <summary>{m.indices.length} indice{m.indices.length > 1 ? 's' : ''} disponible{m.indices.length > 1 ? 's' : ''}</summary>
          <ol>{m.indices.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </details>
      )}
      {!m.resolu && m.prochainIndice != null && (
        <p className="ma-prochain">
          Prochain indice à {m.prochainIndice} min d'ouverture{m.minutes != null ? ` (${m.minutes} écoulées)` : ''}.
        </p>
      )}

      {/* La seconde couche : aucune consigne ne la signale. */}
      <form className="ma-anomalie" onSubmit={(e) => { e.preventDefault(); if (anomalie.trim()) { onAnomalie(anomalie); setAnomalie(''); } }}>
        <input value={anomalie} onChange={(e) => setAnomalie(e.target.value)}
          placeholder="Signaler autre chose" aria-label="Signaler autre chose" />
      </form>
    </section>
  );
}
