import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KEYS, MAXN, getClassList, saveClassList, saveSectionNamesAndReload,
  sectionLabel, sectionList, secInfo,
} from './bridge.js';
import {
  buildCSV, cleanName, countFilled, findDuplicates, pad, parseCSV, planImport,
  splitLines, toArr, tooMany, trimTail,
} from './roster-logic.js';

// The roster is positional: row N of a section is the same learner in every table and
// score sheet. That is why there is no "delete row" or "sort" here, only "clear" (blank
// row stays in place). It reads and writes the same "ecr_classlist" record as before.

const draftFrom = (data, key) => {
  const i = secInfo(key);
  return { grade: String(i.g), name: i.n, male: pad(data[key].male), female: pad(data[key].female) };
};

export default function RosterPanel() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [activeKey, setActiveKey] = useState(KEYS[0]);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState(null);
  const [paste, setPaste] = useState({ male: null, female: null });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const activeRef = useRef(activeKey);
  activeRef.current = activeKey;

  const flash = (text, ok = true) => setMsg({ text, ok });

  const load = useCallback(async (keepKey) => {
    const d = await getClassList();
    setData(d);
    const k = keepKey && d[keepKey] ? keepKey : KEYS[0];
    setActiveKey(k);
    setDraft(draftFrom(d, k));
    setDirty(false);
    setPaste({ male: null, female: null });
    return d;
  }, []);

  // Take over the toolbar's "Roster" button. The legacy functions are kept so that if
  // React ever fails to start, the old modal still works.
  useEffect(() => {
    const legacyOpen = window.openRosterModal;
    const legacyClose = window.closeRosterModal;
    window.__ecrLegacyOpenRoster = legacyOpen;
    window.openRosterModal = () => { setMsg(null); setOpen(true); load(activeRef.current); };
    window.closeRosterModal = () => setOpen(false);
    return () => { window.openRosterModal = legacyOpen; window.closeRosterModal = legacyClose; };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const sections = useMemo(() => (open ? sectionList() : []), [open, data]);

  const confirmDiscard = () => !dirty || window.confirm('You have unsaved changes in this section. Discard them?');

  function requestClose() {
    if (confirmDiscard()) setOpen(false);
  }

  function pickSection(key) {
    if (key === activeKey || !confirmDiscard()) return;
    setActiveKey(key);
    setDraft(draftFrom(data, key));
    setDirty(false);
    setPaste({ male: null, female: null });
    setMsg(null);
  }

  const setCell = (sex, i, value) => {
    setDraft((d) => ({ ...d, [sex]: d[sex].map((v, n) => (n === i ? value : v)) }));
    setDirty(true);
  };
  const cleanCell = (sex, i) => setDraft((d) => ({ ...d, [sex]: d[sex].map((v, n) => (n === i ? cleanName(v) : v)) }));

  function clearAll(sex) {
    if (!countFilled(draft[sex]) || window.confirm('Clear every ' + (sex === 'male' ? 'boy' : 'girl') + ' in this section? (Nothing is saved until you press Save.)')) {
      setDraft((d) => ({ ...d, [sex]: pad([]) }));
      setDirty(true);
    }
  }

  function applyPaste(sex) {
    const lines = splitLines(paste[sex]);
    if (tooMany(lines)) { flash('Too many names \u2013 the limit is ' + MAXN + ' per column.', false); return; }
    if (countFilled(draft[sex]) && !window.confirm('Replace the current ' + (sex === 'male' ? 'boys' : 'girls') + ' list with the pasted names?')) return;
    setDraft((d) => ({ ...d, [sex]: pad(toArr(lines)) }));
    setPaste((p) => ({ ...p, [sex]: null }));
    setDirty(true);
    flash('Pasted ' + toArr(lines).filter(Boolean).length + ' name(s). Press Save to keep them.', true);
  }

  async function save() {
    const key = activeKey;
    const newG = parseInt(draft.grade, 10);
    const newN = String(draft.name || '').replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ').trim();
    if (!newN) { flash('Please type a section name.', false); return; }
    const dup = KEYS.some((k) => { const i = secInfo(k); return k !== key && i.g === newG && i.n.toLowerCase() === newN.toLowerCase(); });
    if (dup) { flash('Grade ' + newG + ' already has a section named ' + newN + '.', false); return; }
    if (tooMany(draft.male) || tooMany(draft.female)) { flash('Too many names \u2013 the limit is ' + MAXN + ' boys and ' + MAXN + ' girls per section.', false); return; }

    const cur = secInfo(key);
    const renamed = cur.g !== newG || cur.n !== newN;
    if (renamed && !window.confirm('Change this section to "Grade ' + newG + ' \u2013 ' + newN + '"?\nThe app will reload once to apply the new name everywhere. Your scores are kept.')) return;

    setBusy(true);
    try {
      const m = toArr(draft.male), f = toArr(draft.female);
      const next = { ...data, [key]: { male: pad(m), female: pad(f) } };
      await saveClassList(next, [key]);
      setData(next);
      setDraft((d) => ({ ...d, male: pad(m), female: pad(f) }));
      setDirty(false);
      if (!renamed) {
        flash('Saved \u2714  ' + m.filter(Boolean).length + ' boys, ' + f.filter(Boolean).length + ' girls.', true);
      } else {
        const all = {};
        KEYS.forEach((k) => { const i = secInfo(k); all[k] = { g: i.g, n: i.n }; });
        all[key] = { g: newG, n: newN };
        flash('Saved \u2714  Reloading to apply the new section name\u2026', true);
        await saveSectionNamesAndReload(all);
      }
    } catch (e) {
      flash('Could not save: ' + (e && e.message ? e.message : e), false);
    } finally {
      setBusy(false);
    }
  }

  function exportCSV() {
    const text = buildCSV(sectionList(), data);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = 'roster.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    flash('Exported roster.csv (saved data only).', true);
  }

  function importCSV(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!confirmDiscard()) return;
    const rd = new FileReader();
    rd.onload = async () => {
      const plan = planImport(parseCSV(String(rd.result || '')), sectionList());
      if (plan.error) { flash(plan.error, false); return; }
      if (!window.confirm('Replace the boys and girls lists of ' + plan.keys.length + ' section(s) with the CSV contents?')) return;
      setBusy(true);
      try {
        const next = { ...data };
        plan.keys.forEach((k) => { next[k] = { male: pad(plan.got[k].male), female: pad(plan.got[k].female) }; });
        await saveClassList(next, plan.keys);
        setData(next);
        setDraft(draftFrom(next, activeKey));
        setDirty(false);
        const extra = plan.skipped.length ? '  Skipped (no such section): ' + plan.skipped.join(', ') : '';
        flash('Imported ' + plan.keys.length + ' section(s).' + extra + (plan.bad ? '  ' + plan.bad + ' row(s) had no Boy/Girl value.' : ''), true);
      } catch (e) {
        flash('Could not import: ' + (e && e.message ? e.message : e), false);
      } finally {
        setBusy(false);
      }
    };
    rd.readAsText(file, 'utf-8');
  }

  if (!open) return null;

  const dups = draft ? findDuplicates(draft.male, draft.female) : new Set();

  const column = (sex, title) => {
    const rows = draft[sex];
    const n = countFilled(rows);
    return (
      <div data-testid={'rx-col-' + sex}>
        <div className="rx-col-head">
          <b>{title}</b>
          <span className={'rx-count' + (n > MAXN ? ' rx-over' : '')}>({n} / {MAXN})</span>
          <button type="button" className="rx-tool" onClick={() => setPaste((p) => ({ ...p, [sex]: p[sex] === null ? '' : null }))}>
            {'\uD83D\uDCCB'} Paste list
          </button>
          <button type="button" className="rx-tool" onClick={() => clearAll(sex)}>Clear all</button>
        </div>
        {paste[sex] !== null && (
          <div className="rx-paste">
            <textarea
              autoFocus value={paste[sex]} placeholder="Paste names here, one per line (replaces this column)"
              onChange={(e) => setPaste((p) => ({ ...p, [sex]: e.target.value }))}
            />
            <div className="rx-row-actions">
              <button type="button" className="rx-tool" style={{ marginLeft: 0 }} onClick={() => applyPaste(sex)}>Use these names</button>
              <button type="button" className="rx-tool" style={{ marginLeft: 0 }} onClick={() => setPaste((p) => ({ ...p, [sex]: null }))}>Cancel</button>
            </div>
          </div>
        )}
        {rows.map((v, i) => (
          <div className="rx-row" key={i}>
            <i>{i + 1}</i>
            <input
              value={v} aria-label={title + ' row ' + (i + 1)}
              className={v && dups.has(cleanName(v)) ? 'rx-dup' : ''}
              onChange={(e) => setCell(sex, i, e.target.value)} onBlur={() => cleanCell(sex, i)}
            />
            <button type="button" title="Clear this row (the row stays in place)" disabled={!v} style={{ visibility: v ? 'visible' : 'hidden' }} onClick={() => setCell(sex, i, '')}>&times;</button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rx-root">
      <div className="rx-roster-back" data-testid="rx-roster" onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
        <div className="rx-roster" role="dialog" aria-label="Roster">
          <div className="rx-r-head">
            <h2>{'\uD83D\uDC65'} Roster {'\u2013'} Boys &amp; Girls per Section</h2>
            {dirty && <span className="rx-dirty">{'\u25CF'} Unsaved changes</span>}
            <button type="button" className="rx-x" onClick={requestClose} aria-label="Close">&times;</button>
          </div>
          <p className="rx-r-note">
            Pick a section, edit its grade/name and learners, then Save. Rows keep their position so scores stay with the
            right learner {'\u2013'} to remove someone, clear the row and leave it blank. Maximum {MAXN} boys and {MAXN} girls per section.
            Highlighted names appear more than once.
          </p>

          <div className="rx-r-body">
            <nav className="rx-side" aria-label="Sections">
              {sections.map((s) => {
                const d = data && data[s.key];
                return (
                  <button key={s.key} type="button" className={s.key === activeKey ? 'rx-on' : ''} onClick={() => pickSection(s.key)} data-testid={'rx-sec-' + s.key}>
                    <b>{sectionLabel(s)}</b>
                    <small>{'\u2642'} {countFilled(d && d.male)} &nbsp; {'\u2640'} {countFilled(d && d.female)}</small>
                  </button>
                );
              })}
            </nav>

            <div className="rx-main">
              {draft && (
                <>
                  <div className="rx-meta">
                    <div>
                      <label className="rx-label" htmlFor="rx-grade">Grade</label>
                      <select id="rx-grade" className="rx-select" value={draft.grade} onChange={(e) => { setDraft({ ...draft, grade: e.target.value }); setDirty(true); }}>
                        {[7, 8, 9, 10].map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="rx-label" htmlFor="rx-sname">Section name</label>
                      <input id="rx-sname" className="rx-input" maxLength={30} placeholder="e.g. Rizal" value={draft.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setDirty(true); }} />
                    </div>
                    <div className="rx-hint">
                      Changing the grade or section name updates every tab, table and printout. The app reloads once after saving (your scores are kept).
                    </div>
                  </div>
                  <div className="rx-cols">
                    {column('male', '\u2642 Boys')}
                    {column('female', '\u2640 Girls')}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rx-r-foot">
            <button type="button" className="rx-btn rx-save" disabled={busy || !dirty} onClick={save} data-testid="rx-save">{'\u2705'} Save this section</button>
            <span className="rx-msg" role="status" style={{ color: msg && !msg.ok ? '#b91c1c' : '#047857' }} data-testid="rx-msg">{msg ? msg.text : ''}</span>
            <button type="button" className="rx-btn" onClick={() => fileRef.current && fileRef.current.click()}>{'\uD83D\uDCC2'} Import CSV (all sections)</button>
            <button type="button" className="rx-btn" onClick={exportCSV}>{'\uD83D\uDCBE'} Export CSV</button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} data-testid="rx-import" />
          </div>
        </div>
      </div>
    </div>
  );
}
