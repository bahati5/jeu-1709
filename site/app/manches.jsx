'use client';
/* Le rendu d'une manche, par type.
 *
 * Rien ici ne connaît le contenu du jeu : chaque composant reçoit le
 * `payload` que le serveur a bien voulu servir et l'affiche. Ajouter un
 * dossier ne touche pas ce fichier ; ajouter un TYPE, oui.
 */
import { useEffect, useRef, useState } from 'react';

const lignes = (t) => String(t || '').split('\n');

/* ---- Les briques communes ---- */

function Paras({ texte }) {
  if (!texte) return null;
  return lignes(texte).map((l, i) =>
    l.trim() === '' ? <br key={i} /> : <p className="f-para" key={i}>{l}</p>);
}

function Pieces({ noms }) {
  const liste = Array.isArray(noms) ? noms : noms ? [noms] : [];
  if (!liste.length) return null;
  return (
    <ul className="pieces">
      {liste.map((n) => {
        const image = /\.(png|jpe?g|gif|webp|avif)$/i.test(n);
        return (
          <li key={n}>
            {image
              ? <a href={`/api/media/${encodeURIComponent(n)}`} target="_blank" rel="noreferrer">
                  <img src={`/api/media/${encodeURIComponent(n)}`} alt={n} loading="lazy" />
                </a>
              : <a className="piece-f" href={`/api/media/${encodeURIComponent(n)}`} download>{n}</a>}
          </li>
        );
      })}
    </ul>
  );
}

/* Le dépôt : un champ, un bouton, une ligne de verdict. */
function Depot({ libelleChamp = 'VOTRE DÉPÔT', placeholder, bouton = 'Déposer',
                 onEnvoyer, bloque, verdict }) {
  const [v, setV] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async () => {
    if (!v.trim() || bloque || envoi) return;
    const garde = v;
    setEnvoi(true);
    try { await onEnvoyer(garde); setV(''); }
    finally { setEnvoi(false); }
  };

  return (
    <div className="depot">
      <label>{libelleChamp}</label>
      <div className="depot-l">
        <input className="champ" value={v} onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); envoyer(); } }}
          placeholder={placeholder || ''} disabled={bloque || envoi} autoComplete="off"
          autoCorrect="off" autoCapitalize="none" spellCheck={false}
          enterKeyHint="send" aria-label={libelleChamp} />
        <button type="button" className="deposer" onClick={envoyer}
          disabled={bloque || envoi || !v.trim()}>
          {envoi ? '…' : bouton}
        </button>
      </div>
      <p className="verdict">{envoi ? 'Le greffe examine…' : (verdict || '')}</p>
    </div>
  );
}

/* ---- Les types ---- */

function Note({ m }) {
  return (
    <>
      <Paras texte={m.payload.texte} />
      {m.payload.signature && (
        <p className="f-para" style={{ textAlign: 'right', fontStyle: 'italic' }}>{m.payload.signature}</p>
      )}
    </>
  );
}

function Saisie({ m }) {
  return (
    <>
      <Paras texte={m.payload.enonce} />
      <Pieces noms={m.payload.medias} />
    </>
  );
}

function Grille({ m }) {
  const cats = m.payload.categories || [];
  return (
    <>
      <Paras texte={m.payload.enonce} />
      {!!cats.length && (
        <div className="cats">{cats.map((c, i) => <span key={i}>{c}</span>)}</div>
      )}
      {!!(m.payload.contraintes || []).length && (
        <ol className="contraintes">
          {m.payload.contraintes.map((c, i) => <li key={i}>{c}</li>)}
        </ol>
      )}
    </>
  );
}

function Imposteur({ m, sel, setSel }) {
  const decl = m.payload.declarations || [];
  return (
    <>
      <Paras texte={m.payload.enonce} />
      <ul className="decls">
        {decl.map((t, i) => (
          <li key={i}>
            <button type="button" className={sel === i ? 'on' : ''}
              onClick={() => setSel(i)} disabled={m.resolu}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span>{t}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Serrure({ m, onPasse, verdict }) {
  if (!m.ouverte) {
    return (
      <>
        <Paras texte={m.payload.invite} />
        <div className="serrure">
          <div className="serrure-o">§</div>
          <p>{m.payload.fermeture || 'LA PAGE NE S’OUVRE QU’À LA PHRASE JUSTE'}</p>
        </div>
        <Depot libelleChamp="LA PHRASE" bouton="Demander" onEnvoyer={onPasse} verdict={verdict} />
      </>
    );
  }
  return <pre className="revele">{m.payload.revele}</pre>;
}

function Assemblage({ m, ordre, setOrdre, sel, setSel, fait }) {
  const c = m.payload.colonnes || 4, l = m.payload.lignes || 2;
  const clic = (i) => {
    if (m.resolu) return;
    if (sel == null) return setSel(i);
    const n = [...ordre];
    [n[sel], n[i]] = [n[i], n[sel]];
    setOrdre(n); setSel(null);
  };
  const media = m.payload.media || '';
  return (
    <>
      <Paras texte={m.payload.enonce} />
      <div className={`taquin ${fait ? 'fini' : ''}`}
        style={{ gridTemplateColumns: `repeat(${c}, 1fr)` }}>
        {ordre.map((v, i) => (
          <button key={i} type="button" className={sel === i ? 'on' : ''} onClick={() => clic(i)}
            aria-label={`fragment ${i + 1}`}
            style={{
              backgroundImage: media ? `url(/api/media/${encodeURIComponent(media)})` : 'none',
              backgroundSize: `${c * 100}% ${l * 100}%`,
              backgroundPosition: `${(v % c) * (100 / (c - 1 || 1))}% ${Math.floor(v / c) * (100 / (l - 1 || 1))}%`,
            }} />
        ))}
      </div>
      <p className="taquin-etat">
        {fait ? 'LA PIÈCE EST RECONSTITUÉE' : 'TOUCHEZ DEUX FRAGMENTS POUR LES ÉCHANGER'}
      </p>
    </>
  );
}

const PAR_TYPE = {
  note: Note,
  saisie: Saisie,
  fichier: Saisie,     // même rendu : énoncé + pièces
  grille: Grille,
  imposteur: Imposteur,
  serrure: Serrure,
  assemblage: Assemblage,
};

/* ------------------------------------------------------------------ */

export function Manche({ m, onRepondre, onPasse, onAnomalie, onIndice, onAssemble }) {
  const [anomalie, setAnomalie] = useState('');
  const [envoiAno, setEnvoiAno] = useState(false);
  const [verdict, setVerdict] = useState('');
  const [verdictPasse, setVerdictPasse] = useState('');
  const [sel, setSel] = useState(null);
  const c = m?.payload?.colonnes || 4, l = m?.payload?.lignes || 2;
  const [ordre, setOrdre] = useState(() =>
    [...Array(c * l).keys()].sort(() => Math.random() - 0.5));

  if (!m) return null;
  const Rendu = PAR_TYPE[m.type];
  const fait = ordre.every((v, i) => v === i);

  /* Le taquin vient d'être reconstitué : la scène « assemblage » se joue,
     une fois, avant que le champ de réponse n'apparaisse. */
  const dejaVu = useRef(false);
  useEffect(() => {
    if (m.type !== 'assemblage' || !fait || m.resolu || dejaVu.current) return;
    dejaVu.current = true;
    onAssemble?.();
  }, [fait, m.type, m.resolu, onAssemble]);

  /* Le champ n'apparaît que quand la manche attend une réponse. */
  const aChamp = m.aResoudre && !m.resolu
    && !(m.type === 'serrure' && !m.ouverte)
    && !(m.type === 'assemblage' && !fait)
    && m.type !== 'imposteur';

  const deposer = async (saisie) => {
    const r = await onRepondre(saisie);
    if (r?.ok) setVerdict('');
    else if (r?.bloqueJusqu) setVerdict('Trop de tentatives. Le greffe ferme un moment.');
    else setVerdict(r?.restant != null
      ? `Ce n’est pas ça. ${r.restant} tentative${r.restant > 1 ? 's' : ''} avant blocage.`
      : 'Ce n’est pas ça.');
  };

  const demanderPasse = async (saisie) => {
    const r = await onPasse(saisie);
    setVerdictPasse(r?.ok ? '' : 'La page reste fermée.');
  };

  return (
    <article className="feuille">
      <div className="pli pli1" aria-hidden="true" />
      <div className="pli pli2" aria-hidden="true" />
      <div className="pli pli3" aria-hidden="true" />

      <div className="dedans">
        <div className="f-tete">
          <small className="f-genre">{m.genre}</small>
          {/* Le temps de l'Archiviste ne se révèle qu'une fois le dépôt fait :
              c'est la promesse de l'introduction, elle se tient ici. */}
          <small className="f-chrono">
            {m.resolu && m.chronoRef != null
              ? `L’ARCHIVISTE · ${m.chronoRef} MIN${m.minutes != null ? ` — VOUS · ${m.minutes} MIN` : ''}`
              : m.minutes != null ? `VOUS · ${m.minutes} MIN` : ''}
          </small>
        </div>
        <h2 className="f-titre">{m.titre}</h2>

        {Rendu
          ? <Rendu m={m} onPasse={demanderPasse} verdict={verdictPasse}
              sel={sel} setSel={setSel} ordre={ordre} setOrdre={setOrdre} fait={fait} />
          : <p className="f-para">Type de manche inconnu.</p>}

        {m.payload.consigne && !m.resolu && (aChamp || m.type === 'imposteur') && (
          <p className="f-consigne">{m.payload.consigne}</p>
        )}

        {m.type === 'imposteur' && !m.resolu && (
          <div className="depot">
            <label>VOTRE DÉSIGNATION</label>
            <div className="depot-l">
              <button type="button" className="deposer" disabled={sel == null || !!m.bloqueJusqu}
                onClick={() => deposer((m.payload.declarations || [])[sel])}>Désigner</button>
            </div>
            <p className="verdict">{verdict}</p>
          </div>
        )}

        {aChamp && (
          <Depot placeholder={m.payload.placeholder} onEnvoyer={deposer}
            bloque={!!m.bloqueJusqu} verdict={verdict} />
        )}

        {m.bloqueJusqu && (
          <p className="verdict">
            Rouvrez dans {Math.max(1, Math.ceil((m.bloqueJusqu - Date.now()) / 60000))} min.
          </p>
        )}

        {m.resolu && <div className="clos">DOSSIER CLOS</div>}

        <Indices m={m} onDemander={onIndice} />

        {/* La seconde couche : aucune consigne ne la signale, mais il faut
            bien pouvoir la valider — sur un téléphone, un champ sans bouton
            ne se soumet pas. */}
        <form className="anomalie" onSubmit={async (e) => {
          e.preventDefault();
          const t = anomalie.trim();
          if (!t || envoiAno) return;
          setEnvoiAno(true);
          try { await onAnomalie(t); setAnomalie(''); }
          finally { setEnvoiAno(false); }
        }}>
          <div className="anomalie-l">
            <input value={anomalie} onChange={(e) => setAnomalie(e.target.value)}
              placeholder="Signaler autre chose" aria-label="Signaler autre chose"
              autoComplete="off" autoCorrect="off" autoCapitalize="none"
              spellCheck={false} enterKeyHint="send" disabled={envoiAno} />
            <button className="anomalie-b" disabled={!anomalie.trim() || envoiAno}>
              {envoiAno ? '…' : 'Signaler'}
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

/* Les indices ne tombent pas : il les demande.
   Le palier rend le bouton actif ; tant qu'il n'a pas cliqué, le texte
   n'a jamais quitté le serveur. */
function Indices({ m, onDemander }) {
  const [refus, setRefus] = useState(null);
  const pris = m.indices || [];
  const reste = (m.indicesTotal || 0) - pris.length;

  if (!m.indicesTotal) return null;

  const demander = async () => {
    const r = await onDemander();
    setRefus(r?.ok ? null : r);
  };

  return (
    <section className="indices">
      {pris.map((t, i) => (
        <div className="item" key={i}>
          <span>{String(i + 1).padStart(2, '0')}</span>
          <span>{t}</span>
        </div>
      ))}

      {!m.resolu && reste > 0 && (
        <div className="indices-pied">
          <button type="button" className="demander"
            disabled={!m.peutDemander} onClick={demander}>
            {pris.length ? 'ENCORE UN INDICE' : 'DEMANDER UN INDICE'}
          </button>
          <small>
            {refus?.pasEncore && refus.restant != null
              ? `Encore ${refus.restant} min.`
              : m.peutDemander
                ? `${m.indicesDisponibles - pris.length} disponible${m.indicesDisponibles - pris.length > 1 ? 's' : ''} · ${reste} en tout`
                : m.prochainIndice != null
                  ? `Le prochain s’ouvre à ${m.prochainIndice} min${m.minutes != null ? ` — ${m.minutes} écoulées` : ''}`
                  : `${reste} indice${reste > 1 ? 's' : ''} en réserve`}
          </small>
        </div>
      )}

      {!m.resolu && reste === 0 && pris.length > 0 && (
        <div className="indices-pied"><small>Plus rien à demander. À vous.</small></div>
      )}
    </section>
  );
}
