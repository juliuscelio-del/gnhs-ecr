import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  DEVICE_TEACHER_KEY, completeLogin, ecrGet, hasSession, loadUsers,
  masterResetCode, saveUsers, teacherAccounts,
} from './bridge.js';

// Same storage format, same rules and same wording as the original login screen, so
// accounts that already exist on a device keep working. On success the original
// _completeLogin() runs, which keeps the toolbar badge, session, device-teacher
// and profile-setup behaviour exactly as before.

const EyeOpen = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginScreen() {
  // 'loading' keeps a plain backdrop up so the app is never visible before we know the state.
  const [phase, setPhase] = useState(() => (hasSession() ? 'hidden' : 'loading'));
  const [leaving, setLeaving] = useState(false);
  const [users, setUsers] = useState(null);
  const [, bump] = useState(0);
  const [username, setUsername] = useState('');
  const [deviceMode, setDeviceMode] = useState(false); // "Welcome back" for a returning teacher
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null); // { text } | { fail: n }
  const [fails, setFails] = useState(0);
  const [pwFlash, setPwFlash] = useState(false);
  const [forgot, setForgot] = useState(false);

  const pwRef = useRef(null);
  const confirmRef = useRef(null);
  const nameRef = useRef(null);

  // Take over from the legacy overlay (it stays in the DOM as a fallback).
  useLayoutEffect(() => {
    document.documentElement.classList.add('rx-ready');
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return undefined;
    let alive = true;
    (async () => {
      const [u, dev] = await Promise.all([loadUsers(), ecrGet(DEVICE_TEACHER_KEY)]);
      if (!alive) return;
      setUsers(u);
      if (dev) { setUsername(dev); setDeviceMode(true); }
      setPhase('show');
    })();
    return () => { alive = false; };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'show') return;
    const t = setTimeout(() => {
      const el = deviceMode ? pwRef.current : nameRef.current;
      if (el) el.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [phase, deviceMode]);

  if (phase === 'hidden') return null;

  const user = users && username ? users[username] : null;
  const firstTime = !!username && (!user || !user.password);
  const displayName = user ? user.displayName : username;

  const resetFields = () => { setPassword(''); setConfirm(''); setError(null); };

  const onPickName = (e) => {
    setUsername(e.target.value);
    resetFields();
    setTimeout(() => pwRef.current && pwRef.current.focus(), 0);
  };

  const switchUser = async () => {
    // forget the remembered teacher on this device (same key the legacy code uses)
    await new Promise((res) => window.ecrDel(DEVICE_TEACHER_KEY, res));
    setDeviceMode(false);
    setUsername('');
    resetFields();
    setTimeout(() => nameRef.current && nameRef.current.focus(), 80);
  };

  const finish = (u, uname) => {
    completeLogin(u, uname);
    setError(null);
    setLeaving(true);
    setTimeout(() => setPhase('hidden'), 400);
  };

  const submit = async () => {
    const uname = username.trim().toLowerCase();
    if (!uname) { setError({ text: '\u274C Please select your name.' }); return; }
    const all = await loadUsers();
    setUsers(all);
    const u = all[uname];
    const isFirst = !u || !u.password;

    if (isFirst) {
      if (!password || !confirm) { setError({ text: '\u26A0\uFE0F Please create and confirm your password.' }); return; }
      if (password.length < 4) { setError({ text: '\u26A0\uFE0F Password must be at least 4 characters.' }); return; }
      if (password !== confirm) {
        setError({ text: '\u274C Passwords do not match.' });
        setConfirm('');
        if (confirmRef.current) confirmRef.current.focus();
        return;
      }
      if (!all[uname]) all[uname] = { password, displayName: uname, role: 'teacher' };
      else all[uname].password = password;
      await saveUsers(all);
      finish(all[uname], uname);
      return;
    }

    if (u.password === password) { finish(u, uname); return; }

    const n = fails + 1;
    setFails(n);
    setError({ fail: n });
    setPassword('');
    setPwFlash(true);
    setTimeout(() => setPwFlash(false), 1800);
    if (pwRef.current) pwRef.current.focus();
  };

  const onPwKey = (e) => {
    if (e.key !== 'Enter') return;
    if (firstTime) { if (confirmRef.current) confirmRef.current.focus(); } else submit();
  };

  const openForgot = () => setForgot(true);

  return (
    <div className="rx-root">
      <div className={'rx-login' + (leaving ? ' rx-leaving' : '')} data-testid="rx-login">
        <div className="rx-blob" style={{ width: 420, height: 420, top: -100, right: -100 }} />
        <div className="rx-blob" style={{ width: 300, height: 300, bottom: -60, left: -60 }} />

        {phase === 'show' && (
          <div className="rx-card">
            <div className="rx-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="rx-eyebrow">Guadalupe National High School</div>
            <h2 className="rx-title">Electronic Class Record</h2>
            <p className="rx-sub">SY 2026{'\u2013'}2027 &nbsp;{'\u00B7'}&nbsp; Sign in to continue</p>

            <div className="rx-field">
              <label className="rx-label" htmlFor="rx-name">Your Name</label>
              {deviceMode ? (
                <div className="rx-welcome">
                  <b data-testid="rx-welcome-name">{'\uD83D\uDC4B'} {displayName}</b>
                  <button type="button" className="rx-link" onClick={switchUser}>Not you?</button>
                </div>
              ) : (
                <select id="rx-name" ref={nameRef} className="rx-select" value={username} onChange={onPickName}>
                  <option value="">{'\u2014'} Select your name {'\u2014'}</option>
                  {teacherAccounts().map((t) => (
                    <option key={t.username} value={t.username}>{t.displayName}</option>
                  ))}
                </select>
              )}
            </div>

            {firstTime && (
              <div className="rx-notice">
                {'\uD83C\uDD95'} First time signing in {'\u2014'} create a password below to set up your account.
              </div>
            )}

            <div className="rx-field">
              <label className="rx-label" htmlFor="rx-pw">{firstTime ? 'Create Password' : 'Password'}</label>
              <div className="rx-pw">
                <input
                  id="rx-pw" ref={pwRef} className={'rx-input' + (pwFlash ? ' rx-bad' : '')}
                  type={showPw ? 'text' : 'password'} value={password}
                  placeholder={firstTime ? 'Create a password' : 'Enter your password'}
                  autoComplete={firstTime ? 'new-password' : 'current-password'}
                  onChange={(e) => setPassword(e.target.value)} onKeyDown={onPwKey}
                />
                <button type="button" className="rx-eye" title="Show/hide" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {firstTime && (
              <div className="rx-field">
                <label className="rx-label" htmlFor="rx-confirm">Confirm Password</label>
                <input
                  id="rx-confirm" ref={confirmRef} className="rx-input" type="password" value={confirm}
                  placeholder="Re-enter your password" autoComplete="new-password"
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                />
              </div>
            )}

            {error && (
              <div className="rx-error" role="alert" data-testid="rx-error">
                {error.text ? error.text : (
                  <>
                    {'\u274C'} Invalid password. <strong>({error.fail} failed attempt{error.fail > 1 ? 's' : ''})</strong>
                    {error.fail >= 3 && (<> {'\u2014'} <button type="button" onClick={openForgot}>Reset password?</button></>)}
                  </>
                )}
              </div>
            )}

            <button type="button" className="rx-btn-primary" onClick={submit}>{'\uD83D\uDD13'} Sign In</button>
            <p className="rx-foot">
              Forgot your password? <button type="button" className="rx-link" onClick={openForgot}>Reset it</button>
            </p>
          </div>
        )}
      </div>

      {forgot && (
        <ForgotPassword
          username={username}
          displayName={user ? user.displayName : ''}
          onClose={() => setForgot(false)}
          onDone={async () => {
            const all = await loadUsers();
            setUsers(all);
            bump((n) => n + 1);
            setForgot(false);
            resetFields();
            setTimeout(() => pwRef.current && pwRef.current.focus(), 50);
          }}
        />
      )}
    </div>
  );
}

function ForgotPassword({ username, displayName, onClose, onDone }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const ref = useRef(null);
  useEffect(() => { const t = setTimeout(() => ref.current && ref.current.focus(), 100); return () => clearTimeout(t); }, []);

  const submit = async () => {
    setErr(''); setOk('');
    const uname = (username || '').trim();
    const c = code.trim();
    if (!uname) { setErr('\u26A0\uFE0F Please select your name on the login screen first, then try again.'); return; }
    if (!c) { setErr('\u26A0\uFE0F Please enter the master reset code.'); return; }
    if (c.toLowerCase() !== masterResetCode().toLowerCase()) {
      setErr('\u274C Incorrect master reset code.');
      setCode('');
      if (ref.current) ref.current.focus();
      return;
    }
    const all = await loadUsers();
    if (!all[uname]) { setErr('\u26A0\uFE0F Account not found.'); return; }
    all[uname].password = null;
    await saveUsers(all);
    setOk('\u2705 Password cleared! Closing \u2014 you can now create a new password.');
    setTimeout(onDone, 1400);
  };

  return (
    <div className="rx-modal-back" data-testid="rx-forgot">
      <div className="rx-modal">
        <div className="rx-modal-head">
          <h2>{'\uD83D\uDD11'} Reset Password</h2>
          <button type="button" className="rx-x" onClick={onClose}>&times;</button>
        </div>
        <p>
          Enter the school's master reset code to reset <strong>{displayName ? displayName + "'s" : "this account's"}</strong> password.
        </p>
        <div className="rx-field">
          <label className="rx-label" htmlFor="rx-code">Master Reset Code</label>
          <input
            id="rx-code" ref={ref} className="rx-input" type="password" value={code}
            placeholder="Enter master reset code" onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
        </div>
        {err && <div className="rx-error" role="alert" style={{ marginBottom: 10 }}>{err}</div>}
        {ok && <div className="rx-ok">{ok}</div>}
        <button type="button" className="rx-btn-primary" onClick={submit}>Reset Password</button>
      </div>
    </div>
  );
}
