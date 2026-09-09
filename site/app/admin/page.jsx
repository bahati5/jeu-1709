'use client';
/* La console.
 *
 * Tout ce que le jeu contient se saisit ici. Aucun énoncé, aucune réponse,
 * aucune récompense n'existe dans le code : cette page est la seule source.
 * Elle doit rester utilisable sur un téléphone, à 23h, en panique.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

const poster = async (corps) => {
  const r = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  return r.json();
};

/* La base ne répond pas. Dire quoi, et quoi faire. */
function Panne({ d, reessayer }) {
  return (
    <main className="adm">
      <header className="adm-tete">
        <h1>La console</h1>
        <div className="adm-etat">
          <span className="adm-pastille attention">● BASE INJOIGNABLE</span>
        </div>
      </header>
      <p className="adm-alerte">{d.panne.message}</p>
      <p className="adm-aide">
        Projet visé : <code>{d.panne.url}</code>
        {d.panne.brut && <> · réponse de Supabase : <code>{d.panne.brut}</code></>}
      </p>
      <p className="adm-aide">
        Les variables se changent dans Vercel → Settings → Environment Variables.
        Une variable modifiée ne s'applique qu'au <strong>déploiement suivant</strong> :
        pense à redéployer.
      </p>
      <button className="adm-primaire" onClick={reessayer}>Réessayer</button>
    </main>
  );
}

/* La porte. Un mot de passe, rien d'autre : une seule personne s'en sert. */
function Connexion({ onEntre }) {
  const [mdp, setMdp] = useState('');
  const [refus, setRefus] = useState('');
  const [attend, setAttend] = useState(false);

  const entrer = async (e) => {
    e.preventDefault();
    if (!mdp || attend) return;
    setAttend(true); setRefus('');
    const r = await fetch('/api/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mdp }),
    }).then((x) => x.json()).catch(() => ({}));
    setAttend(false);
    if (r.ok) { setMdp(''); onEntre(); return; }
    setMdp('');
    setRefus(r.pasConfigure
      ? "ADMIN_MDP n'est pas configuré. Ajoute-le dans .env.local (ou dans Vercel) et relance."
      : 'Ce n’est pas le bon.');
  };

  return (
    <main className="adm adm-porte">
      <form className="adm-connexion" onSubmit={entrer}>
        <h1>La console</h1>
        <p>Réservée au greffe.</p>
        <input type="password" value={mdp} onChange={(e) => setMdp(e.target.value)}
          placeholder="mot de passe" autoFocus autoComplete="current-password"
          aria-label="mot de passe" />
        <button className="adm-primaire" disabled={!mdp || attend}>
          {attend ? '…' : 'Entrer'}
        </button>
        {refus && <p className="adm-refus">{refus}</p>}
      </form>
    </main>
  );
}

const DOSSIER_VIDE = {
  slug: '', titre: '', genre: '', type: 'saisie', actif: true, ordre: 0,
  payload: {}, solution: { reponses: [], resultat: '' }, indices: [],
  animations: { mode: 'toutes', sequence: [] },
  recompense: { nom: '', precision: '', gag: false },
  anomalie: { texte: '', ou: '', reponses: [] },
  chrono_ref: null,
};

export default function Console() {
  const [d, setD] = useState(null);
  const [ferme, setFerme] = useState(false);
  const [err, setErr] = useState('');
  const [onglet, setOnglet] = useState('dossiers');
  const [edite, setEdite] = useState(null);
  const [msg, setMsg] = useState('');

  const charger = useCallback(async () => {
    const r = await fetch('/api/admin', { cache: 'no-store' });
    if (r.status === 404) { setFerme(true); setD(null); return; }
    if (!r.ok) { setErr('La console ne répond pas.'); return; }
    setFerme(false);
    setD(await r.json());
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2200); };

  if (ferme) return <Connexion onEntre={charger} />;
  if (d?.panne) return <Panne d={d} reessayer={charger} />;
  if (err) return <main className="adm"><p className="adm-err">{err}</p></main>;
  if (!d) return <main className="adm"><p>…</p></main>;

  const onglets = [
    ['dossiers', 'Les dossiers'],
    ['programme', 'Le programme'],
    ['quand', 'Quand ça commence'],
    ['habillage', "L'habillage"],
    ['anim', 'Les animations'],
    ['medias', 'Les médias'],
    ['regles', 'Les règles'],
    ['partie', 'La partie'],
    ['essai', "Le banc d'essai"],
  ];

  return (
    <main className="adm">
      <header className="adm-tete">
        <h1>{d.config.titre || 'Console'}</h1>
        <div className="adm-etat">
          <button className="adm-sortir" onClick={async () => {
            await fetch('/api/connexion', { method: 'DELETE' });
            setFerme(true); setD(null);
          }}>Se déconnecter</button>
          <span className={`adm-pastille ${d.pilote === 'supabase' ? 'ok' : 'attention'}`}>
            {d.pilote === 'supabase' ? 'Supabase' : 'fichier local'}
          </span>
          <span>{d.temps.phase}</span>
          {d.temps.jour && <span>jour {d.temps.jour.index + 1} · {d.temps.jour.date}</span>}
        </div>
      </header>

      {d.pilote !== 'supabase' && (
        <p className="adm-alerte">
          Pas de Supabase branché : tout est écrit dans <code>.data/fonds47.json</code>.
          Parfait en local, <strong>effacé à chaque redémarrage sur Vercel</strong>.
          Pose <code>SUPABASE_URL</code> et <code>SUPABASE_SERVICE_ROLE_KEY</code> avant la mise en ligne.
        </p>
      )}

      <nav className="adm-nav">
        {onglets.map(([k, l]) => (
          <button key={k} className={onglet === k ? 'on' : ''} onClick={() => setOnglet(k)}>{l}</button>
        ))}
      </nav>

      {d.etat?.essai?.actif && (
        <p className="adm-essai">
          <strong>Banc d'essai en cours.</strong> Les dates et les paliers de la vraie
          partie sont mis de côté. <em>Ne lui envoie pas le lien maintenant.</em>
          <button onClick={() => setOnglet('essai')}>En sortir</button>
        </p>
      )}

      {msg && <p className="adm-msg">{msg}</p>}

      {onglet === 'dossiers' && (
        <Dossiers d={d} recharger={charger} flash={flash} edite={edite} setEdite={setEdite} />
      )}
      {onglet === 'programme' && <Programme d={d} recharger={charger} flash={flash} />}
      {onglet === 'quand' && <Quand d={d} recharger={charger} flash={flash} />}
      {onglet === 'habillage' && <Habillage d={d} recharger={charger} flash={flash} />}
      {onglet === 'anim' && <Animations d={d} recharger={charger} flash={flash} />}
      {onglet === 'medias' && <Medias d={d} recharger={charger} flash={flash} />}
      {onglet === 'regles' && <Regles d={d} recharger={charger} flash={flash} />}
      {onglet === 'partie' && <Partie d={d} recharger={charger} flash={flash} />}
      {onglet === 'essai' && <Essai d={d} recharger={charger} flash={flash} />}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Les dossiers                                                       */
/* ------------------------------------------------------------------ */

function Dossiers({ d, recharger, flash, edite, setEdite }) {
  const nouveau = () => setEdite({ ...DOSSIER_VIDE, ordre: d.dossiers.length });

  return (
    <section>
      {!edite && (
        <>
          <div className="adm-barre">
            <button className="adm-primaire" onClick={nouveau}>+ Nouveau dossier</button>
            <span className="adm-compte">{d.dossiers.length} dossier{d.dossiers.length > 1 ? 's' : ''}</span>
          </div>

          {!d.dossiers.length && (
            <p className="adm-vide">
              Aucun dossier. Le jeu est vide — c'est normal, rien n'est écrit dans le code.
              Crée le premier : il apparaîtra dans le programme et le joueur le verra le jour où tu l'y places.
            </p>
          )}

          <ul className="adm-liste">
            {d.dossiers.map((x, i) => (
              <li key={x.slug}>
                <div className="adm-ligne">
                  <span className="adm-rang">{i + 1}</span>
                  <div className="adm-ident">
                    <strong>{x.titre || x.slug}</strong>
                    <small>{x.slug} · {d.types.find((t) => t.cle === x.type)?.nom || x.type}
                      {x.chrono_ref ? ` · réf. ${x.chrono_ref} min` : ''}
                      {x.actif === false ? ' · inactif' : ''}</small>
                  </div>
                  <div className="adm-actions">
                    <button onClick={() => setEdite(x)}>Éditer</button>
                    <button onClick={async () => { await poster({ action: 'dossier.dupliquer', slug: x.slug }); recharger(); flash('Dupliqué'); }}>Dupliquer</button>
                    <button className="adm-danger" onClick={async () => {
                      if (!confirm(`Supprimer « ${x.titre || x.slug} » ?`)) return;
                      await poster({ action: 'dossier.supprimer', slug: x.slug }); recharger(); flash('Supprimé');
                    }}>Suppr.</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {edite && (
        <Editeur
          d={d}
          valeur={edite}
          fermer={() => setEdite(null)}
          enregistrer={async (v) => {
            const r = await poster({ action: 'dossier.enregistrer', dossier: v });
            if (r.erreur) { flash('Erreur : ' + r.erreur); return; }
            await recharger(); setEdite(null); flash('Enregistré');
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  L'éditeur : un formulaire par type                                 */
/* ------------------------------------------------------------------ */

function Editeur({ d, valeur, fermer, enregistrer }) {
  const [v, setV] = useState(valeur);
  const champs = d.champs[v.type] || [];
  const maj = (p) => setV((x) => ({ ...x, ...p }));
  const majP = (k, val) => setV((x) => ({ ...x, payload: { ...x.payload, [k]: val } }));
  const majS = (k, val) => setV((x) => ({ ...x, solution: { ...x.solution, [k]: val } }));

  const type = d.types.find((t) => t.cle === v.type);
  const scenesParDecl = useMemo(() => {
    const g = {};
    for (const s of d.scenes) (g[s.declencheur] ||= []).push(s);
    return g;
  }, [d.scenes]);

  return (
    <section className="adm-editeur">
      <div className="adm-barre">
        <button onClick={fermer}>← Retour</button>
        <button className="adm-primaire" onClick={() => enregistrer(v)}>Enregistrer</button>
      </div>

      <div className="adm-grille">
        <label>Identifiant
          <input value={v.slug} onChange={(e) => maj({ slug: e.target.value })} placeholder="identifiant-court" />
        </label>
        <label>Titre
          <input value={v.titre} onChange={(e) => maj({ titre: e.target.value })} placeholder="Titre affiché" />
        </label>
        <label>Genre
          <input value={v.genre} onChange={(e) => maj({ genre: e.target.value })} placeholder="Genre de la manche" />
        </label>
        <label>Type
          <select value={v.type} onChange={(e) => maj({ type: e.target.value, payload: {} })}>
            {d.types.map((t) => <option key={t.cle} value={t.cle}>{t.nom}</option>)}
          </select>
        </label>
        <label>Chrono de référence (min)
          <input type="number" value={v.chrono_ref ?? ''} onChange={(e) => maj({ chrono_ref: e.target.value })} placeholder="minutes" />
        </label>
        <label className="adm-case">
          <input type="checkbox" checked={v.actif !== false} onChange={(e) => maj({ actif: e.target.checked })} />
          Actif
        </label>
      </div>

      {type && <p className="adm-aide">{type.resume}</p>}

      <h3>Le contenu</h3>
      {champs.map((c) => (
        <label key={c.cle} className="adm-bloc">
          {c.libelle}{c.requis && <em> — requis</em>}
          {c.forme === 'texte-long'
            ? <textarea rows={c.cle === 'enonce' || c.cle === 'texte' ? 10 : 4}
                value={v.payload[c.cle] || ''} onChange={(e) => majP(c.cle, e.target.value)} />
            : c.forme === 'nombre'
              ? <input type="number" value={v.payload[c.cle] ?? c.defaut ?? ''} onChange={(e) => majP(c.cle, Number(e.target.value))} />
              : c.forme === 'choix'
                ? <select value={v.payload[c.cle] || c.options[0]} onChange={(e) => majP(c.cle, e.target.value)}>
                    {c.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                : c.forme === 'medias' || c.forme === 'media'
                  ? <SelecteurMedias d={d} multiple={c.forme === 'medias'}
                      valeur={v.payload[c.cle]} onChange={(x) => majP(c.cle, x)} />
                  : c.forme === 'liste' || c.forme === 'categories' || c.forme === 'declarations'
                    ? <ListeLignes valeur={v.payload[c.cle] || []} onChange={(x) => majP(c.cle, x)} />
                    : <input value={v.payload[c.cle] || ''} onChange={(e) => majP(c.cle, e.target.value)} />}
        </label>
      ))}

      {v.type === 'serrure' && (
        <>
          <label className="adm-bloc">Phrase de passe <em>— ne quitte jamais le serveur</em>
            <input value={v.solution.passe || ''} onChange={(e) => majS('passe', e.target.value)}
              placeholder="la phrase exacte à taper" />
          </label>
          <label className="adm-bloc">Le texte révélé
            <textarea rows={8} value={v.solution.revele || ''} onChange={(e) => majS('revele', e.target.value)} />
          </label>
        </>
      )}

      {type?.aResoudre && (
        <>
          <h3>La solution <em>— jamais servie au navigateur</em></h3>
          <label className="adm-bloc">Réponses acceptées <em>— une par ligne</em>
            <textarea rows={4}
              value={(v.solution.reponses || []).join('\n')}
              onChange={(e) => majS('reponses', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              placeholder={'une formulation par ligne'} />
          </label>
          <label className="adm-bloc">Ce que le dossier rend au tableau
            <input value={v.solution.resultat || ''} onChange={(e) => majS('resultat', e.target.value)} placeholder="ce qui s'affiche au tableau" />
          </label>
        </>
      )}

      <h3>Les indices</h3>
      <ListeLignes valeur={v.indices} onChange={(x) => maj({ indices: x })}
        placeholder="Un indice par ligne, du plus doux au plus explicite" />

      <h3>La seconde couche <em>— facultative</em></h3>
      <div className="adm-grille">
        <label className="adm-bloc">Ce qui se dépose au tableau
          <textarea rows={3} value={v.anomalie?.texte || ''}
            onChange={(e) => maj({ anomalie: { ...v.anomalie, texte: e.target.value } })} />
        </label>
        <label className="adm-bloc">Réponses acceptées <em>— une par ligne</em>
          <textarea rows={3} value={(v.anomalie?.reponses || []).join('\n')}
            onChange={(e) => maj({ anomalie: { ...v.anomalie, reponses: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) } })} />
        </label>
      </div>

      <h3>La récompense <em>— n'existe qu'à l'instant de la victoire</em></h3>
      {!v.recompense?.nom && (
        <p className="adm-alerte">
          <strong>Sans nom, la carte cachetée ne se joue pas.</strong> C'est
          voulu — une carte vide ferait deux secondes d'écran noir au moment
          où il vient de gagner. Écris un nom ici et la scène apparaît, elle
          n'a rien d'autre à activer.
        </p>
      )}
      <div className="adm-grille">
        <label>Nom
          <input value={v.recompense?.nom || ''} onChange={(e) => maj({ recompense: { ...v.recompense, nom: e.target.value } })} />
        </label>
        <label>Précision
          <input value={v.recompense?.precision || ''} onChange={(e) => maj({ recompense: { ...v.recompense, precision: e.target.value } })} />
        </label>
        <label className="adm-case">
          <input type="checkbox" checked={!!v.recompense?.gag}
            onChange={(e) => maj({ recompense: { ...v.recompense, gag: e.target.checked } })} />
          C'est un gag
        </label>
      </div>

      <h3>Les animations de ce dossier</h3>
      <label className="adm-bloc">Mode
        <select value={v.animations?.mode || 'toutes'}
          onChange={(e) => maj({ animations: { ...v.animations, mode: e.target.value } })}>
          <option value="toutes">Toutes celles du catalogue</option>
          <option value="courte">Version courte</option>
          <option value="aucune">Aucune</option>
        </select>
      </label>
      <p className="adm-aide">
        Coche les scènes à jouer. Si tu n'en coches aucune, ce sont toutes les scènes
        actives du catalogue qui jouent, dans l'ordre du catalogue.
      </p>
      {Object.entries(scenesParDecl).map(([decl, scenes]) => (
        <div key={decl} className="adm-decl">
          <h4>{decl}</h4>
          {scenes.map((s) => {
            const seq = v.animations?.sequence || [];
            const coche = seq.includes(s.cle);
            return (
              <label key={s.cle} className="adm-case">
                <input type="checkbox" checked={coche} onChange={(e) => {
                  const next = e.target.checked ? [...seq, s.cle] : seq.filter((x) => x !== s.cle);
                  maj({ animations: { ...v.animations, sequence: next } });
                }} />
                {s.nom}
              </label>
            );
          })}
        </div>
      ))}

      <div className="adm-barre">
        <button onClick={fermer}>Annuler</button>
        <button className="adm-primaire" onClick={() => enregistrer(v)}>Enregistrer</button>
      </div>
    </section>
  );
}

function ListeLignes({ valeur, onChange, placeholder }) {
  return (
    <textarea rows={Math.max(3, (valeur || []).length + 1)} placeholder={placeholder}
      value={(valeur || []).join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
  );
}

function SelecteurMedias({ d, multiple, valeur, onChange }) {
  const sel = multiple ? (Array.isArray(valeur) ? valeur : []) : (valeur ? [valeur] : []);
  const bascule = (nom) => {
    if (!multiple) return onChange(sel[0] === nom ? '' : nom);
    onChange(sel.includes(nom) ? sel.filter((x) => x !== nom) : [...sel, nom]);
  };
  if (!d.medias.length) return <p className="adm-aide">Aucun média. Téléverse-les dans l'onglet « Les médias ».</p>;
  return (
    <div className="adm-medias">
      {d.medias.map((m) => (
        <label key={m.nom} className={`adm-media ${sel.includes(m.nom) ? 'on' : ''}`}>
          <input type={multiple ? 'checkbox' : 'radio'} checked={sel.includes(m.nom)} onChange={() => bascule(m.nom)} />
          <span>{m.nom}</span>
        </label>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Le programme                                                       */
/* ------------------------------------------------------------------ */

function Programme({ d, recharger, flash }) {
  const [prog, setProg] = useState(d.config.programme);
  const jours = d.temps.jours;

  const poser = (i, slug) => {
    const p = [...prog];
    /* Un dossier ne peut pas tomber deux fois. */
    for (let k = 0; k < p.length; k++) if (p[k] === slug && k !== i) p[k] = null;
    p[i] = slug || null;
    setProg(p);
  };

  return (
    <section>
      <p className="adm-aide">
        Un dossier par jour, ou aucun. Change les dates dans « Quand ça commence » et
        le nombre de lignes suit. Le joueur ne voit jamais qu'un jour à la fois.
      </p>
      <ul className="adm-liste">
        {jours.map((j, i) => (
          <li key={j.date}>
            <div className="adm-ligne">
              <span className="adm-rang">J{i + 1}</span>
              <div className="adm-ident">
                <strong>{j.date}</strong>
                <small>{j.dernier ? 'dernier jour — le verdict' : `ouvre à ${new Date(j.ouvre).toISOString().slice(11, 16)} UTC`}</small>
              </div>
              <select value={prog[i] || ''} onChange={(e) => poser(i, e.target.value)}>
                <option value="">— aucune manche —</option>
                {d.dossiers.map((x) => <option key={x.slug} value={x.slug}>{x.titre || x.slug}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>
      <button className="adm-primaire" onClick={async () => {
        await poster({ action: 'config', config: { programme: prog } }); recharger(); flash('Programme enregistré');
      }}>Enregistrer le programme</button>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/* Le banc d'essai : jouer les huit jours d'affilée, en ligne, puis tout
   remettre exactement comme c'était avant de lui envoyer le lien. */
function Essai({ d, recharger, flash }) {
  const [reponse, setReponse] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [certaine, setCertaine] = useState(false);
  const essai = d.etat?.essai?.actif ? d.etat.essai : null;
  const jours = d.temps?.jours || [];
  const jour = (d.temps?.jour?.index ?? 0) + 1;
  const total = jours.length || 8;

  /* Une action qui échoue doit se voir. Avant, un cookie expiré renvoyait
     404 et le bouton ne faisait rien, en silence. */
  const act = async (corps) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch('/api/repetition', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
      });
      if (!r.ok) {
        setErreur(r.status === 404
          ? 'La console ne te reconnaît plus. Recharge la page et retape le mot de passe.'
          : `Le serveur a répondu ${r.status}. Rien n'a été changé.`);
        return {};
      }
      const j = await r.json().catch(() => ({}));
      await recharger();
      return j;
    } catch {
      setErreur("Pas de réseau — rien n'a été changé.");
      return {};
    } finally {
      setOccupe(false);
    }
  };

  if (!essai) {
    return (
      <section>
        <h3>Le banc d'essai</h3>
        <p className="adm-aide">
          Pour jouer les huit énigmes d'affilée sur le site en ligne, depuis ton
          téléphone, sans attendre huit jours ni les paliers d'indices.
        </p>
        <p className="adm-aide">
          En entrant, les dates et les paliers d'aujourd'hui sont <strong>mis de côté</strong>,
          la partie est remise à zéro, et tu es placée au jour 1 avec les indices
          disponibles tout de suite. En sortant, tout est remis{' '}
          <strong>exactement</strong> comme c'est maintenant : mêmes dates,
          mêmes paliers, partie vierge.
        </p>
        <p className="adm-aide">
          <em>À faire avant de lui envoyer le lien</em> — et le bouton de sortie est
          là pour ça, tu ne peux pas l'oublier : un bandeau rouge reste en haut de
          la console tant que le banc d'essai tourne.
        </p>
        <div className="adm-barre">
          <button className="adm-primaire" disabled={occupe} onClick={async () => {
            await act({ action: 'essai.debut' }); flash('Banc d’essai ouvert — jour 1');
          }}>Ouvrir le banc d'essai</button>
        </div>
        <h4>Ce qui sera mis de côté</h4>
        <p className="adm-aide">
          Du <code>{d.config.debut}</code> au <code>{d.config.fin}</code>, bascule à{' '}
          <code>{d.config.heureOuverture}h</code>, indices à{' '}
          <code>{(d.config.paliers || []).join(', ') || '—'}</code> min.
        </p>
      </section>
    );
  }

  const c = essai.config || {};
  return (
    <section>
      <h3>Le banc d'essai <em>— en cours</em></h3>

      <h4>Le jour</h4>
      <div className="adm-jours">
        {Array.from({ length: total }, (_, i) => (
          <button key={i} className={jour === i + 1 ? 'adm-primaire' : ''} disabled={occupe}
            onClick={() => act({ action: 'jour', jour: i + 1 })}>{i + 1}</button>
        ))}
      </div>
      <p className="adm-aide">
        Jour {jour} sur {total}
        {jours[jour - 1]?.dossier && <> · <code>{jours[jour - 1].dossier}</code></>}
      </p>

      <h4>La manche</h4>
      <div className="adm-barre">
        <button disabled={occupe} onClick={async () => { await act({ action: 'manche.raz' }); flash('Manche remise à zéro'); }}>
          Rejouer ce jour
        </button>
        <button disabled={occupe} onClick={async () => { await act({ action: 'scenes.oublier' }); flash('Scènes en entier'); }}>
          Rejouer les scènes en entier
        </button>
        <button disabled={occupe} onClick={async () => setReponse(await act({ action: 'reponse' }))}>
          Voir la réponse du jour
        </button>
      </div>

      {reponse?.ok && (
        <div className="adm-reponse">
          {reponse.passe && <p><span>phrase de passe</span> {reponse.passe}</p>}
          <p><span>réponse</span> {reponse.reponse}</p>
          {reponse.anomalie && <p><span>anomalie</span> {reponse.anomalie}</p>}
        </div>
      )}

      <h4>Les indices</h4>
      <div className="adm-barre">
        <button disabled={occupe} onClick={async () => { await act({ action: 'paliers', zero: true }); flash('Indices demandables tout de suite'); }}>
          Sans attendre
        </button>
        <button disabled={occupe} onClick={async () => { await act({ action: 'paliers', zero: false }); flash('Paliers rétablis'); }}>
          Rétablir tes paliers
        </button>
        <span className="adm-compte">actuellement : {(d.config.paliers || []).join(', ')} min</span>
      </div>

      <h3>En sortir</h3>
      <p className="adm-aide">
        Remet le calendrier du <code>{c.debut}</code> au <code>{c.fin}</code>, bascule à{' '}
        <code>{c.heureOuverture}h</code>, indices à <code>{(c.paliers || []).join(', ')}</code> min,
        et efface toute la partie d'essai. C'est ce qu'il faut faire juste avant
        de lui envoyer le lien.
      </p>
      {/* Pas de boîte système ici : dans une app posée sur l'écran d'accueil,
          `confirm()` peut ne jamais s'afficher — et le bouton ne fait alors
          rien, sans rien dire. Deux boutons, on voit ce qui se passe. */}
      {!certaine ? (
        <div className="adm-barre">
          <button className="adm-danger" disabled={occupe}
            onClick={() => setCertaine(true)}>Sortir et tout remettre en place</button>
        </div>
      ) : (
        <div className="adm-barre">
          <button className="adm-danger" disabled={occupe} onClick={async () => {
            const r = await act({ action: 'essai.fin' });
            setCertaine(false);
            if (r?.ok) flash('Tout est remis en place. Le jeu est prêt.');
          }}>{occupe ? '…' : 'Oui, sortir maintenant'}</button>
          <button disabled={occupe} onClick={() => setCertaine(false)}>Annuler</button>
        </div>
      )}

      {erreur && <p className="adm-alerte">{erreur}</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ */

/* L'habillage : la direction visuelle et les écrans qui entourent le jeu.
   Tout ce qui s'y saisit part en base ; rien n'est écrit dans le code. */
function Habillage({ d, recharger, flash }) {
  const [c, setC] = useState(d.config);
  const maj = (p) => setC((x) => ({ ...x, ...p }));
  const majIntro = (p) => setC((x) => ({ ...x, intro: { ...(x.intro || {}), ...p } }));
  const majAttente = (p) => setC((x) => ({ ...x, attente: { ...(x.attente || {}), ...p } }));
  const majAno = (p) => setC((x) => ({ ...x, anomalie: { ...(x.anomalie || {}), ...p } }));

  return (
    <section>
      <h3>La direction</h3>
      <p className="adm-aide">
        Deux habillages, le même jeu. Ouvre le jeu sur ton téléphone après avoir
        enregistré : le changement est immédiat, tu peux comparer les deux.
      </p>
      <div className="adm-grille">
        <label>Habillage
          <select value={c.skin || 'grimoire'} onChange={(e) => maj({ skin: e.target.value })}>
            <option value="grimoire">Le Grimoire — nuit, or, cire, papier crème</option>
            <option value="chambre">La Chambre 47 — vert sombre, machine à écrire</option>
          </select>
        </label>
        <label>Sur-titre <em>— la ligne en petites capitales</em>
          <input value={c.surtitre || ''} onChange={(e) => maj({ surtitre: e.target.value })} />
        </label>
        <label>Cote <em>— le nombre dans le coin du bandeau</em>
          <input value={c.cote || ''} onChange={(e) => maj({ cote: e.target.value })} />
        </label>
      </div>
      <label className="adm-case">
        <input type="checkbox" checked={c.amorcage !== false}
          onChange={(e) => maj({ amorcage: e.target.checked })} />
        Écran d'accès au premier chargement
      </label>
      <label className="adm-case">
        <input type="checkbox" checked={c.papierNet === true}
          onChange={(e) => maj({ papierNet: e.target.checked })} />
        Papier net <em>— sans bords déchirés</em>
      </label>
      <p className="adm-aide">
        Les bords déchirés sont dessinés par un filtre SVG. Sur certains
        iPhone, ce filtre empêche le champ de réponse de se rafraîchir : on
        tape et rien ne s'affiche jusqu'à ce qu'on quitte l'app et qu'on
        revienne. Si ça t'arrive sur son téléphone, coche cette case — le
        papier devient net, tout le reste ne bouge pas.
      </p>

      <h3>L'introduction <em>— titre vide : pas d'écran d'introduction</em></h3>
      <div className="adm-grille">
        <label>Titre
          <input value={c.intro?.titre || ''} onChange={(e) => majIntro({ titre: e.target.value })} />
        </label>
        <label>Bouton
          <input value={c.intro?.bouton || ''} onChange={(e) => majIntro({ bouton: e.target.value })} />
        </label>
      </div>
      <label className="adm-bloc">Le texte <em>— un paragraphe par ligne</em>
        <textarea rows={7} value={c.intro?.texte || ''}
          onChange={(e) => majIntro({ texte: e.target.value })} />
      </label>

      <h3>L'écran d'attente <em>— avant le premier jour</em></h3>
      <label className="adm-bloc">Titre
        <input value={c.attente?.titre || ''} onChange={(e) => majAttente({ titre: e.target.value })} />
      </label>
      <label className="adm-bloc">Le texte sous le titre <em>— un paragraphe par ligne</em>
        <textarea rows={5} value={c.attente?.texte || ''}
          onChange={(e) => majAttente({ texte: e.target.value })} />
      </label>
      <label className="adm-bloc">Le bouton qui rouvre l'introduction
        <input value={c.attente?.lien || ''} onChange={(e) => majAttente({ lien: e.target.value })} />
      </label>
      <p className="adm-aide">
        Il ouvrira le lien avant le premier jour, sans doute plusieurs fois. Un
        chiffre qui descend sans un mot ne lui apprend rien : ce bouton rouvre
        l'introduction autant de fois qu'il veut. Laisse le titre d'introduction
        vide et le bouton disparaît.
      </p>

      <h3>Le champ discret <em>— la seconde couche</em></h3>
      <p className="adm-aide">
        Sous chaque manche, un champ qui n'a rien à voir avec l'énigme du jour :
        c'est là qu'il signale ce qu'il a remarqué en marge et que personne ne
        lui demande. Il faut que ce soit compréhensible sans être une consigne —
        « Signaler autre chose » ne disait ni quoi, ni pourquoi.
      </p>
      <div className="adm-grille">
        <label>Le titre du champ
          <input value={c.anomalie?.titre || ''} onChange={(e) => majAno({ titre: e.target.value })} />
        </label>
        <label>Le texte dans le champ vide
          <input value={c.anomalie?.invite || ''} onChange={(e) => majAno({ invite: e.target.value })} />
        </label>
        <label>Le bouton
          <input value={c.anomalie?.bouton || ''} onChange={(e) => majAno({ bouton: e.target.value })} />
        </label>
      </div>
      <label className="adm-bloc">La phrase d'explication <em>— vide : aucune explication</em>
        <textarea rows={3} value={c.anomalie?.aide || ''}
          onChange={(e) => majAno({ aide: e.target.value })} />
      </label>

      <h3>Le fonds</h3>
      <label className="adm-bloc">La ligne sous la grille des 47
        <input value={c.piedFonds || ''} onChange={(e) => maj({ piedFonds: e.target.value })} />
      </label>

      <button className="adm-primaire" onClick={async () => {
        await poster({ action: 'config', config: c }); recharger(); flash('Habillage enregistré');
      }}>Enregistrer</button>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Quand({ d, recharger, flash }) {
  const [c, setC] = useState(d.config);
  const maj = (p) => setC((x) => ({ ...x, ...p }));
  return (
    <section>
      <div className="adm-grille">
        <label>Titre du jeu<input value={c.titre} onChange={(e) => maj({ titre: e.target.value })} /></label>
        <label>Premier jour<input type="date" value={c.debut} onChange={(e) => maj({ debut: e.target.value })} /></label>
        <label>Dernier jour<input type="date" value={c.fin} onChange={(e) => maj({ fin: e.target.value })} /></label>
        <label>Fuseau<input value={c.fuseau} onChange={(e) => maj({ fuseau: e.target.value })} /></label>
        <label>Heure de bascule<input type="number" min="0" max="23" value={c.heureOuverture} onChange={(e) => maj({ heureOuverture: Number(e.target.value) })} /></label>
        <label>Heure du verdict<input type="number" min="0" max="23" value={c.heureVerdict} onChange={(e) => maj({ heureVerdict: Number(e.target.value) })} /></label>
      </div>
      <button className="adm-primaire" onClick={async () => {
        await poster({ action: 'config', config: c }); recharger(); flash('Calendrier enregistré');
      }}>Enregistrer</button>
    </section>
  );
}

function Regles({ d, recharger, flash }) {
  const [c, setC] = useState(d.config);
  const maj = (p) => setC((x) => ({ ...x, ...p }));
  return (
    <section>
      <div className="adm-grille">
        <label>Code final<input value={c.codeFinal} onChange={(e) => maj({ codeFinal: e.target.value })} /></label>
        <label>Tentatives avant blocage<input type="number" value={c.tentativesMax} onChange={(e) => maj({ tentativesMax: Number(e.target.value) })} /></label>
        <label>Durée du blocage (min)<input type="number" value={c.blocageMinutes} onChange={(e) => maj({ blocageMinutes: Number(e.target.value) })} /></label>
        <label>Taille du fonds<input type="number" value={c.tailleFonds} onChange={(e) => maj({ tailleFonds: Number(e.target.value) })} /></label>
        <label>Anomalies pour la fin alternative<input type="number" value={c.seuilAnomalies} onChange={(e) => maj({ seuilAnomalies: Number(e.target.value) })} /></label>
      </div>
      <label className="adm-bloc">Paliers d'indices <em>— minutes depuis l'ouverture de la manche, une par ligne</em>
        <textarea rows={3} value={(c.paliers || []).join('\n')}
          onChange={(e) => maj({ paliers: e.target.value.split('\n').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)) })} />
      </label>
      <h3>L'enveloppe du dernier jour</h3>
      <p className="adm-aide">
        Quand le dernier dossier tombe, l'onglet « L'enveloppe » s'ouvre. Elle
        reste scellée tant que le code n'est pas donné — et scellée pour de vrai :
        la lettre ne quitte pas le serveur avant.
      </p>
      <div className="adm-grille">
        <label>Le titre affiché
          <input value={c.titreVerdict || ''} onChange={(e) => maj({ titreVerdict: e.target.value })} />
        </label>
        <label>Ce qui est écrit sous le sceau
          <input value={c.inviteVerdict || ''} onChange={(e) => maj({ inviteVerdict: e.target.value })} />
        </label>
        <label>Le texte gris dans le champ
          <input value={c.invitePlaceholder || ''} onChange={(e) => maj({ invitePlaceholder: e.target.value })} />
        </label>
      </div>

      <label className="adm-bloc">La lettre du 17
        <textarea rows={8} value={c.lettreFinale || ''} onChange={(e) => maj({ lettreFinale: e.target.value })} />
      </label>
      <label className="adm-bloc">La lettre du 17 <em>— version s'il a trouvé les anomalies</em>
        <textarea rows={8} value={c.lettreFinaleAnomalies || ''} onChange={(e) => maj({ lettreFinaleAnomalies: e.target.value })} />
      </label>
      <h3>L'invitation <em>— l'onglet en plus, que tu ouvres depuis « La partie »</em></h3>
      <div className="adm-grille">
        <label>Le titre
          <input value={c.invitation?.titre || ''}
            onChange={(e) => setC((x) => ({ ...x, invitation: { ...(x.invitation || {}), titre: e.target.value } }))} />
        </label>
      </div>
      <label className="adm-bloc">Le texte
        <textarea rows={5} value={c.invitation?.texte || ''}
          onChange={(e) => setC((x) => ({ ...x, invitation: { ...(x.invitation || {}), texte: e.target.value } }))} />
      </label>

      <label className="adm-bloc">Les notes de refus des dossiers verrouillés <em>— une par ligne, tirée au hasard</em>
        <textarea rows={5} value={(c.refus || []).join('\n')}
          onChange={(e) => maj({ refus: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
      </label>
      <button className="adm-primaire" onClick={async () => {
        await poster({ action: 'config', config: c }); recharger(); flash('Règles enregistrées');
      }}>Enregistrer</button>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Animations({ d, recharger, flash }) {
  const [g, setG] = useState(d.config.animations || {});
  return (
    <section>
      <h3>Réglages généraux</h3>
      <div className="adm-grille">
        <label className="adm-case">
          <input type="checkbox" checked={g.actives !== false} onChange={(e) => setG({ ...g, actives: e.target.checked })} />
          Animations activées
        </label>
        <label className="adm-case">
          <input type="checkbox" checked={g.sautToujours !== false} onChange={(e) => setG({ ...g, sautToujours: e.target.checked })} />
          Toujours sautables d'un clic
        </label>
        <label className="adm-case">
          <input type="checkbox" checked={g.attendreLeJoueur !== false} onChange={(e) => setG({ ...g, attendreLeJoueur: e.target.checked })} />
          Attendre que le joueur ferme <em>— la scène ne part pas toute seule</em>
        </label>
        <label>Version courte à partir de la Nième fois
          <input type="number" value={g.courteApres ?? 2} onChange={(e) => setG({ ...g, courteApres: Number(e.target.value) })} />
        </label>
        <label>Ce que « courte » veut dire (0,4 = 40 %)
          <input type="number" step="0.1" value={g.facteurCourte ?? 0.4} onChange={(e) => setG({ ...g, facteurCourte: Number(e.target.value) })} />
        </label>
      </div>
      <button className="adm-primaire" onClick={async () => {
        await poster({ action: 'config', config: { animations: g } }); recharger(); flash('Réglages enregistrés');
      }}>Enregistrer</button>

      <h3>Le catalogue</h3>
      <p className="adm-aide">
        Chaque scène est implémentée dans le code. Ici tu l'actives, tu règles sa durée
        et son rang. <strong>Tant que « Attendre que le joueur ferme » est coché, la
        durée ne referme rien</strong> : elle règle seulement la vitesse interne de la
        scène — la frappe d'un texte, le remplissage d'une barre. Une durée plus
        longue ralentit, elle ne fait pas patienter. Le choix de celles qui jouent après un dossier précis se fait
        dans l'éditeur de ce dossier.
      </p>
      <ul className="adm-liste">
        {d.animations.map((a) => (
          <li key={a.cle}>
            <div className="adm-ligne">
              <label className="adm-case">
                <input type="checkbox" checked={a.actif !== false} onChange={async (e) => {
                  await poster({ action: 'animation.maj', cle: a.cle, patch: { actif: e.target.checked } });
                  recharger();
                }} />
              </label>
              <div className="adm-ident">
                <strong>{a.nom}</strong>
                <small>{a.declencheur} · {a.description}</small>
              </div>
              <label className="adm-duree">
                <input type="number" step="100" defaultValue={a.duree_ms} onBlur={async (e) => {
                  await poster({ action: 'animation.maj', cle: a.cle, patch: { duree_ms: Number(e.target.value) } });
                  recharger(); flash('Durée enregistrée');
                }} /> ms
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Medias({ d, recharger, flash }) {
  const [envoi, setEnvoi] = useState(false);
  const [dossier, setDossier] = useState('');

  const televerser = async (fichiers) => {
    setEnvoi(true);
    for (const f of fichiers) {
      const fd = new FormData();
      fd.append('fichier', f);
      if (dossier) fd.append('dossier', dossier);
      await fetch('/api/admin', { method: 'POST', body: fd });
    }
    setEnvoi(false); recharger(); flash('Téléversé');
  };

  return (
    <section>
      <p className="adm-aide">
        Les médias ne sont pas dans <code>/public</code> : un fichier statique échappe au
        verrou de date. Un média rattaché à un dossier renvoie 404 tant que ce dossier
        n'est pas ouvert.
      </p>
      <div className="adm-grille">
        <label>Rattacher au dossier
          <select value={dossier} onChange={(e) => setDossier(e.target.value)}>
            <option value="">— aucun (accessible tout le temps) —</option>
            {d.dossiers.map((x) => <option key={x.slug} value={x.slug}>{x.titre || x.slug}</option>)}
          </select>
        </label>
        <label>Fichiers
          <input type="file" multiple disabled={envoi}
            onChange={(e) => televerser(Array.from(e.target.files || []))} />
        </label>
      </div>
      <ul className="adm-liste">
        {d.medias.map((m) => (
          <li key={m.nom}>
            <div className="adm-ligne">
              <div className="adm-ident">
                <strong>{m.nom}</strong>
                <small>{m.mime} · {Math.round((m.taille || 0) / 1024)} Ko
                  {m.dossier_slug ? ` · ${m.dossier_slug}` : ' · libre'}</small>
              </div>
              <div className="adm-actions">
                <a href={`/api/media/${encodeURIComponent(m.nom)}`} target="_blank" rel="noreferrer">Voir</a>
                <button className="adm-danger" onClick={async () => {
                  if (!confirm(`Supprimer ${m.nom} ?`)) return;
                  await poster({ action: 'media.supprimer', nom: m.nom }); recharger();
                }}>Suppr.</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Partie({ d, recharger, flash }) {
  const [razSure, setRazSure] = useState(false);
  const resolus = d.etat.resolus || {};
  return (
    <section>
      <p className="adm-aide">
        Le filet de sécurité. S'il bloque après minuit, tu débloques d'ici, depuis ton téléphone.
      </p>
      <ul className="adm-liste">
        {d.dossiers.map((x) => {
          const r = resolus[x.slug];
          const bloc = d.etat.tentatives?.[x.slug];
          return (
            <li key={x.slug}>
              <div className="adm-ligne">
                <div className="adm-ident">
                  <strong>{x.titre || x.slug}</strong>
                  <small>
                    {r ? `résolu${r.parAdmin ? ' (par toi)' : ''}${r.minutes != null ? ` en ${r.minutes} min` : ''}` : 'non résolu'}
                    {bloc?.jusqu > Date.now() ? ' · bloqué' : ''}
                  </small>
                </div>
                <div className="adm-actions">
                  {!r && <button onClick={async () => { await poster({ action: 'debloquer', slug: x.slug }); recharger(); flash('Débloqué'); }}>Débloquer</button>}
                  {r && <button onClick={async () => { await poster({ action: 'reverrouiller', slug: x.slug }); recharger(); flash('Reverrouillé'); }}>Reverrouiller</button>}
                  {bloc?.jusqu > Date.now() && <button onClick={async () => { await poster({ action: 'liberer', slug: x.slug }); recharger(); }}>Lever le blocage</button>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="adm-barre">
        <button onClick={async () => { await poster({ action: 'bonus', valeur: !d.etat.bonus }); recharger(); }}>
          {d.etat.bonus ? "Refermer l'invitation" : "Ouvrir l'invitation"}
        </button>
        {!razSure ? (
          <button className="adm-danger" onClick={() => setRazSure(true)}>
            Remettre la partie à zéro
          </button>
        ) : (
          <>
            <button className="adm-danger" onClick={async () => {
              await poster({ action: 'reinitialiser' }); setRazSure(false);
              recharger(); flash('Partie remise à zéro');
            }}>Oui, tout remettre à zéro</button>
            <button onClick={() => setRazSure(false)}>Annuler</button>
          </>
        )}
      </div>
    </section>
  );
}
