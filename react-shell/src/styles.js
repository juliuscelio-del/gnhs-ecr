// All React-side CSS lives here. Every class is prefixed "rx-" so it can never clash
// with the ~120 KB of legacy CSS in the original file.

export default `
/* Once React is running, hide the legacy login markup (it stays in the DOM as a fallback
   and because the legacy _completeLogin() still updates it). */
html.rx-ready #login-overlay, html.rx-ready #forgotpw-overlay { display: none !important; }

.rx-root *, .rx-root *::before, .rx-root *::after { box-sizing: border-box; }
.rx-root { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; }
.rx-root button, .rx-root input, .rx-root select, .rx-root textarea { font-family: inherit; }

/* ------------------------------------------------------------ login */
.rx-login { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f2744 0%, #1a3a5c 50%, #0f2744 100%); transition: opacity .4s; }
.rx-login.rx-leaving { opacity: 0; pointer-events: none; }
.rx-blob { position: absolute; border-radius: 50%; background: rgba(37,99,235,.07); pointer-events: none; }
.rx-card { position: relative; width: 100%; max-width: 420px; margin: 16px; padding: 44px 40px 36px; text-align: center;
  background: #fff; border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,.35); }
.rx-logo { width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1d4ed8, #2563eb); box-shadow: 0 8px 20px rgba(37,99,235,.35); }
.rx-eyebrow { margin-bottom: 5px; font-size: 10.5px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb; }
.rx-title { margin: 0 0 4px; font-size: 20px; font-weight: 800; color: #0f2744; }
.rx-sub { margin: 0 0 26px; font-size: 13px; color: #64748b; }
.rx-field { text-align: left; margin-bottom: 14px; }
.rx-label { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 700; color: #374151; }
.rx-input, .rx-select { width: 100%; padding: 12px 14px; font-size: 14px; color: #0f2744; background: #f8fafc;
  border: 2px solid #e2e8f0; border-radius: 10px; outline: none; }
.rx-select { cursor: pointer; }
.rx-input:focus, .rx-select:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.rx-input.rx-bad { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.12); }
.rx-pw { position: relative; }
.rx-pw .rx-input { padding-right: 44px; }
.rx-eye { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); display: flex; padding: 4px;
  background: none; border: none; cursor: pointer; color: #94a3b8; }
.rx-welcome { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px;
  background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; }
.rx-welcome b { font-size: 14px; color: #0f2744; }
.rx-link { background: none; border: none; padding: 0; cursor: pointer; font-size: 11.5px; font-weight: 700; color: #2563eb; }
.rx-notice { margin-bottom: 12px; padding: 8px 12px; text-align: left; font-size: 11.5px; font-weight: 600;
  color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; }
.rx-error { margin-bottom: 14px; padding: 9px 14px; text-align: left; font-size: 12.5px; font-weight: 600;
  color: #dc2626; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; }
.rx-error a, .rx-error button { color: #dc2626; text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer; font: inherit; }
.rx-ok { margin-bottom: 10px; font-size: 12px; font-weight: 600; color: #16a34a; }
.rx-btn-primary { width: 100%; padding: 13px; font-size: 15px; font-weight: 700; letter-spacing: .3px; color: #fff; cursor: pointer;
  background: linear-gradient(135deg, #1d4ed8, #2563eb); border: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37,99,235,.35); }
.rx-btn-primary:hover { opacity: .9; }
.rx-foot { margin: 16px 0 0; font-size: 11px; color: #94a3b8; }
.rx-foot button { font-size: 11px; }

.rx-modal-back { position: fixed; inset: 0; z-index: 100001; display: flex; align-items: center; justify-content: center; background: rgba(10,20,50,.7); }
.rx-modal { position: relative; width: 100%; max-width: 400px; margin: 16px; padding: 32px 32px 26px; background: #fff; border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,.35); }
.rx-modal::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; border-radius: 18px 18px 0 0; background: linear-gradient(90deg, #d97706, #f59e0b); }
.rx-modal h2 { margin: 0; font-size: 17px; font-weight: 800; color: #0f2744; }
.rx-modal p { margin: 6px 0 18px; font-size: 12px; color: #64748b; }
.rx-modal-head { display: flex; align-items: center; justify-content: space-between; }
.rx-x { background: none; border: none; padding: 2px 6px; font-size: 22px; line-height: 1; color: #94a3b8; cursor: pointer; }

/* ------------------------------------------------------------ roster */
.rx-roster-back { position: fixed; inset: 0; z-index: 99998; display: flex; align-items: center; justify-content: center; padding: 12px; background: rgba(10,20,50,.6); }
.rx-roster { position: relative; display: flex; flex-direction: column; width: 100%; max-width: 1120px; height: min(92vh, 860px);
  overflow: hidden; background: #fff; border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,.35); }
.rx-roster::before { content: ''; height: 5px; flex: none; background: linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa); }
.rx-r-head { display: flex; align-items: center; gap: 12px; padding: 14px 22px 4px; }
.rx-r-head h2 { flex: 1; margin: 0; font-size: 18px; font-weight: 800; color: #0f2744; }
.rx-r-note { margin: 0; padding: 0 22px 10px; font-size: 12px; line-height: 1.5; color: #64748b; }
.rx-r-body { flex: 1; min-height: 0; display: flex; border-top: 1px solid #e2e8f0; }
.rx-side { flex: none; width: 210px; padding: 10px; overflow-y: auto; background: #f8fafc; border-right: 1px solid #e2e8f0; }
.rx-side button { display: block; width: 100%; margin-bottom: 4px; padding: 9px 11px; text-align: left; cursor: pointer;
  background: transparent; border: 2px solid transparent; border-radius: 10px; color: #0f2744; }
.rx-side button:hover { background: #eef2ff; }
.rx-side button.rx-on { background: #fff; border-color: #2563eb; box-shadow: 0 2px 8px rgba(37,99,235,.15); }
.rx-side b { display: block; font-size: 13px; font-weight: 700; }
.rx-side small { font-size: 11px; color: #64748b; }
.rx-main { flex: 1; min-width: 0; padding: 14px 18px; overflow-y: auto; }
.rx-meta { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
.rx-meta .rx-input, .rx-meta .rx-select { padding: 8px 10px; font-size: 14px; width: auto; }
.rx-meta .rx-hint { flex: 1; min-width: 200px; font-size: 11.5px; color: #64748b; }
.rx-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.rx-col-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.rx-col-head b { font-size: 13px; color: #0f2744; }
.rx-count { font-size: 12px; font-weight: 700; color: #64748b; }
.rx-count.rx-over { color: #b91c1c; }
.rx-tool { margin-left: auto; padding: 4px 9px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 7px; }
.rx-tool + .rx-tool { margin-left: 0; }
.rx-paste { margin-bottom: 8px; padding: 8px; background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 10px; }
.rx-paste textarea { width: 100%; height: 120px; padding: 8px; font-size: 13px; resize: vertical; border: 2px solid #e2e8f0; border-radius: 8px; }
.rx-paste .rx-row-actions { display: flex; gap: 6px; margin-top: 6px; }
.rx-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.rx-row i { flex: none; width: 22px; text-align: right; font-style: normal; font-size: 11px; color: #94a3b8; }
.rx-row input { flex: 1; min-width: 0; padding: 6px 9px; font-size: 13px; color: #0f2744; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 7px; outline: none; }
.rx-row input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.rx-row input.rx-dup { border-color: #f59e0b; background: #fffbeb; }
.rx-row button { flex: none; width: 24px; height: 24px; padding: 0; font-size: 15px; line-height: 1; color: #cbd5e1; cursor: pointer; background: none; border: none; border-radius: 6px; }
.rx-row button:hover { color: #dc2626; background: #fef2f2; }
.rx-r-foot { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 22px 14px; border-top: 1px solid #e2e8f0; background: #fff; }
.rx-msg { flex: 1; min-width: 160px; font-size: 12.5px; font-weight: 600; }
.rx-btn { padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; border-radius: 9px; border: 2px solid #e2e8f0; background: #fff; color: #0f2744; }
.rx-btn:hover { background: #f1f5f9; }
.rx-btn.rx-save { color: #fff; border-color: transparent; background: linear-gradient(135deg, #059669, #10b981); }
.rx-btn.rx-save:disabled { opacity: .45; cursor: default; }
.rx-dirty { font-size: 11.5px; font-weight: 700; color: #b45309; }

@media (max-width: 760px) {
  .rx-r-body { flex-direction: column; }
  .rx-side { width: auto; display: flex; gap: 6px; overflow-x: auto; overflow-y: hidden; border-right: 0; border-bottom: 1px solid #e2e8f0; }
  .rx-side button { width: auto; flex: none; margin: 0; }
  .rx-cols { grid-template-columns: 1fr; }
  .rx-card { padding: 32px 22px 26px; }
}
`;
