/**
 * Notehaven — frontend module (Spindle / Lumiverse)
 *
 *  • Notes live in a big comfy MODAL: note rail on the left, editor on the
 *    right (the drawer "Notes" tab is a launcher with recent notes).
 *  • Halo drawer tab — upload a chat logo, resize it, show/hide it, and
 *    watch it float over your chat (drag it anywhere, right-click for more).
 *
 * Rendering happens directly in host-provided placement roots
 * (ctx.ui.registerDrawerTab / ctx.ui.createFloatWidget) plus one free-tier
 * ctx.dom.inject() wrapper for the modal overlay.
 */

/* ================================================================ */
/* 1. Styles                                                         */
/* ================================================================ */

const NH_CSS = `
  .nh-root, .nh-modal, .nh-floatnote {
    --nh-bg: var(--lumiverse-fill, #17161f);
    --nh-bg-2: var(--lumiverse-fill-subtle, rgba(255,255,255,0.045));
    --nh-border: var(--lumiverse-border, rgba(255,255,255,0.09));
    --nh-text: var(--lumiverse-text, #eceaf3);
    --nh-muted: var(--lumiverse-text-muted, #9a97ab);
    --nh-accent: var(--lumiverse-accent, #b28cff);
    --nh-rose: #ff8fb3;
    --nh-amber: #ffcf7a;
    --nh-mint: #8fe3c0;
    --nh-sky: #8fc9ff;
    --nh-radius: 14px;
    color: var(--nh-text); font-size: 13.5px; line-height: 1.55;
    font-family: inherit;
    width: 100%; min-width: 0;
  }

  /* ---- light theme: toggled by the ☀️/🌙 button or Settings → Theme ---- */
  .nh-th-light {
    --nh-bg: #f7f5ff;
    --nh-bg-2: rgba(72, 54, 140, 0.07);
    --nh-border: rgba(72, 54, 140, 0.18);
    --nh-text: #282044;
    --nh-muted: #716b8c;
    --nh-accent: var(--lumiverse-accent, #7c5ce0);
  }

  .nh-root *, .nh-modal *, .nh-floatnote * { box-sizing: border-box; }

  /* ---- pinned mini note floating on screen ---- */
  .nh-floatnote { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--nh-bg); color: var(--nh-text); border: 1px solid var(--nh-border); border-radius: 15px; overflow: hidden; box-shadow: 0 12px 34px rgba(0,0,0,.5); }
  .nh-fn-head { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 8px 10px 7px; border-bottom: 1px solid var(--nh-border); background: color-mix(in srgb, var(--nh-accent) 12%, transparent); }
  .nh-fn-pin { font-size: 12px; flex: 0 0 auto; }
  .nh-fn-title { flex: 1; min-width: 0; font-weight: 700; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nh-fn-btn { border: 0; background: transparent; color: var(--nh-muted); width: 24px; height: 24px; border-radius: 7px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; font-family: inherit; flex: 0 0 auto; }
  .nh-fn-btn:hover { background: var(--nh-bg-2); color: var(--nh-text); }
  .nh-fn-body { flex: 1; width: 100%; border: 0; outline: none; resize: none; background: transparent; color: var(--nh-text); font-family: inherit; font-size: 12.5px; line-height: 1.6; padding: 10px 12px; }
  .nh-fn-state { flex: 0 0 auto; padding: 4px 10px 6px; color: var(--nh-muted); font-size: 10px; text-align: right; opacity: .8; }
  .nh-root button, .nh-modal button { font-family: inherit; }
  .nh-scroll { scrollbar-width: thin; scrollbar-color: var(--nh-border) transparent; }
  .nh-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
  .nh-scroll::-webkit-scrollbar-thumb { background: var(--nh-border); border-radius: 8px; }
  .nh-scroll::-webkit-scrollbar-track { background: transparent; }

  /* ================= drawer launcher ================= */
  .nh-launch { display: flex; flex-direction: column; gap: 12px; padding: 14px; overflow-y: auto; height: 100%; }
  .nh-brand { text-align: center; padding: 10px 8px 2px; }
  .nh-brand .nh-brandmark { font-size: 30px; }
  .nh-brand h2 { margin: 2px 0 2px; font-size: 17px; }
  .nh-brand p { margin: 0; color: var(--nh-muted); font-size: 11.5px; }
  .nh-openbtn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--nh-accent); color: #1a1526; border: 0; cursor: pointer;
    font-weight: 700; font-size: 13.5px; padding: 11px 14px; border-radius: 12px;
    transition: filter .15s, transform .1s;
  }
  .nh-openbtn:hover { filter: brightness(1.08); }
  .nh-openbtn:active { transform: scale(.97); }
  .nh-launch .nh-recent-title { color: var(--nh-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; padding: 2px 4px 0; }
  .nh-tips {
    background: var(--nh-bg-2); border: 1px dashed var(--nh-border); border-radius: var(--nh-radius);
    padding: 10px 12px; color: var(--nh-muted); font-size: 11.5px; line-height: 1.6;
  }

  /* ================= modal overlay ================= */
  .nh-overlay {
    position: fixed; inset: 0; z-index: 9000;
    display: none; align-items: center; justify-content: center;
    background: rgba(9, 8, 15, 0.6); backdrop-filter: blur(3px);
    padding: 18px;
  }
  .nh-overlay.nh-open { display: flex; }
  .nh-overlay.nh-open .nh-modal { animation: nh-pop .18s ease; }
  @keyframes nh-pop { from { transform: translateY(10px) scale(.98); opacity: 0; } to { transform: none; opacity: 1; } }

  .nh-modal {
    width: min(1060px, 94vw);
    height: min(720px, 90vh);
    max-width: 96vw;      /* safety net: custom sizes can never leave the viewport */
    max-height: 94vh;     /* …so the ◢ resize grip can never fall off-screen again */
    background: var(--nh-bg);
    border: 1px solid var(--nh-border);
    border-radius: 20px;
    box-shadow: 0 30px 90px rgba(0,0,0,0.55);
    display: flex; flex-direction: column; overflow: hidden;
  }

  /* ---------- modal header ---------- */
  .nh-mhead {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-bottom: 1px solid var(--nh-border); flex: 0 0 auto;
  }
  .nh-mhead .nh-mtitle { font-weight: 700; font-size: 14px; white-space: nowrap; display: flex; align-items: center; gap: 7px; color: var(--nh-accent); }
  .nh-search {
    flex: 1; display: flex; align-items: center; gap: 7px;
    background: var(--nh-bg-2); border: 1px solid var(--nh-border);
    border-radius: 999px; padding: 7px 13px; min-width: 60px;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .nh-search:focus-within { border-color: var(--nh-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--nh-accent) 18%, transparent); }
  .nh-search svg { flex: 0 0 auto; opacity: .55; }
  .nh-search input { flex: 1; background: transparent; border: 0; outline: 0; color: var(--nh-text); font-size: 13px; min-width: 0; }
  .nh-search input::placeholder { color: var(--nh-muted); }
  .nh-newbtn {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--nh-accent); color: #1a1526; border: 0; cursor: pointer;
    font-weight: 700; font-size: 12.5px; padding: 8px 14px; border-radius: 999px;
    transition: filter .15s, transform .1s; flex: 0 0 auto; white-space: nowrap;
  }
  .nh-newbtn:hover { filter: brightness(1.08); } .nh-newbtn:active { transform: scale(.96); }
  .nh-mclose {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--nh-border);
    background: var(--nh-bg-2); color: var(--nh-muted); cursor: pointer; font-size: 15px;
    transition: background .15s, color .15s; flex: 0 0 auto;
  }
  .nh-mclose:hover { background: color-mix(in srgb, #ff6b81 18%, transparent); color: #ffb3bd; border-color: #ff6b8144; }

  .nh-iconbtn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 9px; border: 1px solid transparent;
    background: transparent; color: var(--nh-muted); cursor: pointer;
    transition: background .15s, color .15s, transform .1s; flex: 0 0 auto;
  }
  .nh-iconbtn:hover { background: var(--nh-bg-2); color: var(--nh-text); }
  .nh-iconbtn:active { transform: scale(.94); }
  .nh-iconbtn.is-active { color: var(--nh-accent); background: color-mix(in srgb, var(--nh-accent) 14%, transparent); }
  .nh-iconbtn.danger:hover { background: color-mix(in srgb, #ff6b81 16%, transparent); color: #ff8f9f; }
  .nh-iconbtn.confirm { background: color-mix(in srgb, #ff6b81 22%, transparent); color: #ffb3bd; border-color: #ff6b8155; width: auto; padding: 0 10px; font-weight: 600; font-size: 12px; height: 30px; }

  /* ---------- modal body: rail + editor ---------- */
  .nh-mbody { flex: 1; display: flex; min-height: 0; position: relative; }

  .nh-listwrap {
    width: 224px; flex: 0 0 auto; border-right: 1px solid var(--nh-border);
    display: flex; flex-direction: column; min-height: 0; background: transparent;
  }
  .nh-listwrap.nh-hidden { display: none; }
  .nh-listhead {
    flex: 0 0 auto; padding: 9px 12px 7px; color: var(--nh-muted);
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .nh-lh-left { display: inline-flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; }
  .nh-view-label { display: inline-flex; align-items: center; gap: 6px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nh-view-label .nh-fico { width: 16px; height: 16px; font-size: 10px; border-radius: 5px; }
  .nh-list { flex: 1; overflow-y: auto; padding: 2px 8px 20px; }

  .nh-listitem {
    width: 100%; text-align: left; background: transparent; border: 1px solid transparent;
    border-radius: 12px; padding: 9px 10px 7px; margin-bottom: 4px; cursor: pointer;
    color: var(--nh-text); display: block; transition: background .13s, border-color .13s;
  }
  .nh-listitem:hover { background: var(--nh-bg-2); }
  .nh-listitem.active { background: color-mix(in srgb, var(--nh-accent) 10%, transparent); border-color: color-mix(in srgb, var(--nh-accent) 35%, transparent); }
  .nh-li-top { display: flex; align-items: center; gap: 7px; }
  .nh-li-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
  .nh-li-title { font-weight: 650; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .nh-li-pin { opacity: .8; flex: 0 0 auto; display: inline-flex; }
  .nh-li-snippet { color: var(--nh-muted); font-size: 11.5px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nh-li-meta { color: var(--nh-muted); font-size: 10.5px; margin-top: 3px; opacity: .8; display: flex; gap: 6px; }
  .nh-empty { color: var(--nh-muted); text-align: center; padding: 26px 14px; font-size: 12.5px; }

  /* ---------- editor column ---------- */
  .nh-editor { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }

  .nh-editor-head { display: flex; align-items: center; gap: 6px; padding: 10px 14px 6px; flex: 0 0 auto; flex-wrap: wrap; }
  .nh-title {
    flex: 1; min-width: 140px; background: transparent; border: 0; outline: 0;
    color: var(--nh-text); font-size: 17px; font-weight: 700; padding: 5px 8px; border-radius: 8px;
  }
  .nh-title:hover, .nh-title:focus { background: var(--nh-bg-2); }
  .nh-modegroup { display: inline-flex; background: var(--nh-bg-2); border: 1px solid var(--nh-border); border-radius: 999px; padding: 2px; gap: 2px; }
  .nh-modebtn { border: 0; background: transparent; color: var(--nh-muted); font-size: 11.5px; font-weight: 650; padding: 4px 11px; border-radius: 999px; cursor: pointer; transition: all .13s; }
  .nh-modebtn:hover { color: var(--nh-text); }
  .nh-modebtn.is-active { background: var(--nh-accent); color: #1a1526; }

  .nh-toolbar {
    display: flex; align-items: center; gap: 2px; flex: 0 0 auto; flex-wrap: wrap;
    border-bottom: 1px dashed var(--nh-border); margin: 0 14px; padding: 2px 0 8px;
  }
  .nh-toolbar .nh-sep { width: 1px; height: 18px; background: var(--nh-border); margin: 0 5px; flex: 0 0 auto; }

  .nh-canvas { flex: 1; display: flex; min-height: 0; }
  .nh-surfacewrap { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; }
  .nh-preview { flex: 0 0 auto; padding: 14px 20px 44px; font-size: var(--nh-editor-fs, 13.5px); }
  .nh-preview:empty::before { content: 'Start writing… ✍️ images, [[links]] and ☑ checklists all render live as you type'; color: var(--nh-muted); font-size: 12.5px; }
  .nh-editor-surface { min-height: 100%; outline: none; -webkit-tap-highlight-color: transparent; }
  .nh-editor-surface[contenteditable="true"] { cursor: text; caret-color: var(--nh-accent); }
  .nh-editor-surface[contenteditable="false"] { cursor: default; }
  .nh-editor-surface::selection { background: color-mix(in srgb, var(--nh-accent) 32%, transparent); }
  .nh-editor-surface [contenteditable="false"] { -webkit-user-select: none; user-select: none; }

  .nh-statusbar {
    flex: 0 0 auto; display: flex; align-items: center; gap: 12px;
    padding: 8px 16px; border-top: 1px solid var(--nh-border);
    color: var(--nh-muted); font-size: 11.5px; min-height: 36px;
  }
  .nh-savestate { display: inline-flex; align-items: center; gap: 5px; }
  .nh-savestate .nh-pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--nh-mint); }
  .nh-savestate.busy .nh-pulse { background: var(--nh-amber); animation: nh-pulse 1s infinite; }
  @keyframes nh-pulse { 50% { opacity: .35; } }
  .nh-tags { display: inline-flex; gap: 5px; flex-wrap: wrap; overflow: hidden; }
  .nh-tag { background: color-mix(in srgb, var(--nh-sky) 14%, transparent); color: var(--nh-sky); border-radius: 999px; padding: 1px 8px; font-size: 10.5px; font-weight: 600; }
  .nh-statusbar .nh-grow { flex: 1; }

  /* ---------- markdown preview ---------- */
  .nh-preview h1 { font-size: 22px; margin: 14px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--nh-border); }
  .nh-preview h2 { font-size: 18px; margin: 14px 0 6px; }
  .nh-preview h3 { font-size: 15.5px; margin: 12px 0 5px; }
  .nh-preview h1:first-child, .nh-preview h2:first-child, .nh-preview h3:first-child { margin-top: 2px; }
  .nh-preview p { margin: 6px 0; }
  .nh-preview ul, .nh-preview ol { margin: 6px 0; padding-left: 22px; }
  .nh-preview li { margin: 2px 0; }
  .nh-preview blockquote { margin: 8px 0; padding: 6px 14px; border-left: 3px solid var(--nh-accent); background: var(--nh-bg-2); border-radius: 0 10px 10px 0; color: var(--nh-muted); }
  .nh-preview code { font-family: ui-monospace, "Cascadia Code", Menlo, monospace; font-size: 12px; background: var(--nh-bg-2); border: 1px solid var(--nh-border); border-radius: 6px; padding: 1px 5px; }
  .nh-preview pre { background: var(--nh-bg-2); border: 1px solid var(--nh-border); border-radius: 12px; padding: 12px 14px; overflow-x: auto; margin: 10px 0; }
  .nh-preview pre code { background: transparent; border: 0; padding: 0; }
  .nh-preview hr { border: 0; border-top: 1px dashed var(--nh-border); margin: 14px 0; }
  .nh-preview mark { background: color-mix(in srgb, var(--nh-amber) 35%, transparent); color: inherit; border-radius: 4px; padding: 0 3px; }
  .nh-preview del { opacity: .65; }
  .nh-preview a { color: var(--nh-sky); }
  .nh-wikilink { color: var(--nh-rose); cursor: pointer; font-weight: 600; border-bottom: 1px dashed color-mix(in srgb, var(--nh-rose) 60%, transparent); }
  .nh-wikilink:hover { background: color-mix(in srgb, var(--nh-rose) 15%, transparent); border-radius: 4px; }
  .nh-wikilink.missing { opacity: .75; }
  .nh-wikilink.missing::after { content: ' ✚'; font-size: 10px; }
  .nh-task { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; user-select: none; margin: 3px 0; }
  .nh-task input { margin-top: 3px; accent-color: var(--nh-accent); cursor: pointer; }
  .nh-task.done span { text-decoration: line-through; opacity: .55; }
  .nh-imgbox { margin: 10px 0; }
  .nh-imgbox img { max-width: min(100%, 460px); border-radius: 12px; border: 1px solid var(--nh-border); display: block; cursor: zoom-in; background: var(--nh-bg-2); min-height: 40px; }
  .nh-imgbox video { max-width: min(100%, 460px); border-radius: 12px; border: 1px solid var(--nh-border); display: block; background: #000; outline: none; }
  .nh-imgbox audio { width: min(100%, 380px); height: 44px; display: block; border-radius: 12px; background: var(--nh-bg-2); outline: none; }
  .nh-imgbox.nh-missing [data-img-id] { opacity: .35; min-height: 60px; }
  .nh-imgbox.nh-missing::before { content: '🖼 media missing'; color: var(--nh-muted); font-size: 11px; display: block; text-align: center; padding-top: 10px; }
  .nh-imgcap { color: var(--nh-muted); font-size: 11px; margin-top: 4px; }

  /* narrow modal: rail slides over the editor */
  @media (max-width: 760px) {
    .nh-listwrap { position: absolute; z-index: 6; top: 0; bottom: 0; left: 0; background: var(--nh-bg); box-shadow: 10px 0 30px rgba(0,0,0,.4); width: min(240px, 78vw); }
    .nh-overlay { padding: 8px; }
    .nh-mhead .nh-mtitle span.nh-mt-text { display: none; }
  }

  /* phones: take over the whole screen */
  @media (max-width: 560px) {
    .nh-overlay { padding: 0; }
    .nh-modal { width: 100vw; height: 100vh; height: 100dvh; max-width: none; max-height: none; border-radius: 0; border: 0; }
    .nh-mhead { flex-wrap: wrap; row-gap: 7px; }
    .nh-search { order: 5; flex-basis: 100%; }
    .nh-title { font-size: 16px; }
    .nh-statusbar { flex-wrap: wrap; row-gap: 4px; }
  }

  /* touch targets: everything a thumbs-width bigger */
  @media (pointer: coarse) {
    .nh-iconbtn { width: 36px; height: 36px; }
    .nh-iconbtn.confirm { width: auto; }
    .nh-listitem { padding: 12px 12px 10px; margin-bottom: 5px; }
    .nh-modebtn { padding: 6px 13px; font-size: 12.5px; }
    .nh-newbtn { padding: 10px 15px; }
    .nh-toolbar { gap: 4px; }
    .nh-halo { cursor: default; }
    .nh-fhdr { padding: 10px 11px; }
    .nh-addfolder { padding: 11px; }
  }

  /* ---------- folders, selection & resizing ---------- */
  /* ---- folders live inside the list as section headers (no chip bar) ---- */
  .nh-fhdr { position: sticky; top: -2px; z-index: 2; display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0 5px; padding: 7px 9px; border: 1px solid transparent; border-radius: 10px; background: var(--nh-bg); color: var(--nh-text); cursor: pointer; user-select: none; transition: background .13s, border-color .13s; font-family: inherit; text-align: left; }
  .nh-fhdr:first-child { margin-top: 2px; }
  .nh-fhdr:hover { background: var(--nh-bg-2); }
  .nh-fhdr.nh-drop { border-color: var(--nh-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--nh-accent) 25%, transparent); }
  .nh-fico { width: 22px; height: 22px; border-radius: 7px; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; flex: 0 0 auto; }
  .nh-fico img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nh-fhdr .nh-fname { flex: 1; min-width: 0; font-weight: 700; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nh-fhdr .nh-fcount { color: var(--nh-muted); font-size: 10.5px; font-weight: 600; flex: 0 0 auto; }
  .nh-fhdr .nh-fchev { color: var(--nh-muted); flex: 0 0 auto; display: inline-flex; align-items: center; }
  .nh-fhdr .nh-fchev svg { transition: transform .18s ease; transform: rotate(90deg); }
  .nh-fhdr:hover .nh-fchev { color: var(--nh-accent); }
  .nh-fhdr.collapsed { margin-bottom: 2px; }
  .nh-fhdr.collapsed .nh-fchev svg { transform: rotate(0deg); }
  .nh-addfolder { width: 100%; margin: 9px 0 2px; padding: 8px 10px; border: 1px dashed var(--nh-border); border-radius: 10px; background: transparent; color: var(--nh-muted); font-size: 12px; font-weight: 650; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 6px; transition: border-color .13s, color .13s, background .13s; }
  .nh-addfolder:hover { color: var(--nh-accent); border-color: color-mix(in srgb, var(--nh-accent) 45%, transparent); background: color-mix(in srgb, var(--nh-accent) 7%, transparent); }
  .nh-rename-input { flex: 1; min-width: 60px; background: var(--nh-bg); color: var(--nh-text); border: 1px solid var(--nh-accent); border-radius: 8px; padding: 3px 8px; font-size: 12.5px; font-weight: 700; outline: none; font-family: inherit; }
  .nh-empty .nh-emptybtn { margin-top: 10px; border: 1px solid var(--nh-border); background: var(--nh-bg-2); color: var(--nh-text); font-size: 12px; font-weight: 650; padding: 7px 13px; border-radius: 999px; cursor: pointer; font-family: inherit; }
  .nh-empty .nh-emptybtn:hover { border-color: color-mix(in srgb, var(--nh-accent) 45%, transparent); color: var(--nh-accent); }

  .nh-actionbar { flex: 0 0 auto; display: none; gap: 6px; align-items: center; padding: 7px 10px; border-bottom: 1px dashed var(--nh-border); flex-wrap: wrap; }
  .nh-actionbar.on { display: flex; }
  .nh-ambtn { border: 1px solid var(--nh-border); background: var(--nh-bg-2); color: var(--nh-text); font-size: 11.5px; font-weight: 650; padding: 5px 11px; border-radius: 999px; cursor: pointer; font-family: inherit; }
  .nh-ambtn:hover { background: color-mix(in srgb, var(--nh-accent) 12%, transparent); }
  .nh-ambtn.danger { color: #ff8f9f; border-color: #ff6b8144; }
  .nh-ambtn.danger.armed { background: color-mix(in srgb, #ff6b81 22%, transparent); color: #ffc3cb; }
  .nh-ambtn.primary { background: var(--nh-accent); color: #1a1526; border-color: transparent; }
  .nh-selcount { color: var(--nh-muted); font-size: 11px; margin-left: auto; }

  .nh-listitem .nh-check { display: none; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--nh-muted); flex: 0 0 auto; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: transparent; }
  .nh-listwrap.selecting .nh-check { display: inline-flex; }
  .nh-listitem.selected { background: color-mix(in srgb, var(--nh-accent) 13%, transparent); border-color: color-mix(in srgb, var(--nh-accent) 40%, transparent); }
  .nh-listitem.selected .nh-check { background: var(--nh-accent); border-color: var(--nh-accent); color: #1a1526; }

  .nh-listwrap { position: relative; }
  .nh-rail-resizer { position: absolute; top: 0; right: -3px; bottom: 0; width: 7px; cursor: col-resize; z-index: 5; border-radius: 4px; touch-action: none; }
  .nh-rail-resizer:hover, .nh-rail-resizer.active { background: color-mix(in srgb, var(--nh-accent) 30%, transparent); }
  @media (max-width: 760px) { .nh-rail-resizer { display: none; } }

  .nh-modal { position: relative; }
  .nh-mresize { position: absolute; right: 4px; bottom: 3px; width: 30px; height: 30px; cursor: nwse-resize; z-index: 6; opacity: .75; transition: opacity .15s, transform .15s; touch-action: none; color: var(--nh-accent); font-size: 15px; display: flex; align-items: center; justify-content: center; }
  .nh-mresize:hover, .nh-mresize.active { opacity: 1; transform: scale(1.15); }
  .nh-rsz { position: absolute; z-index: 6; touch-action: none; border-radius: 5px; transition: background .15s; }
  .nh-rsz-e { top: 14px; bottom: 14px; right: -4px; width: 9px; cursor: ew-resize; }
  .nh-rsz-s { left: 14px; right: 14px; bottom: -4px; height: 9px; cursor: ns-resize; }
  .nh-rsz:hover, .nh-rsz.active { background: color-mix(in srgb, var(--nh-accent) 35%, transparent); }
  @media (max-width: 560px) { .nh-mresize, .nh-rsz { display: none; } }
  @media (pointer: coarse) { .nh-mresize { width: 36px; height: 36px; font-size: 17px; } .nh-rsz-e { width: 13px; } .nh-rsz-s { height: 13px; } }

  /* ---------- settings panel ---------- */
  .nh-settings-overlay { z-index: 9600; }
  .nh-spanel { width: min(560px, 94vw); height: auto; max-height: 88vh; }
  .nh-sbody { padding: 14px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
  .nh-colorwrap { display: inline-flex; align-items: center; gap: 8px; }
  .nh-sel { background: var(--nh-bg-2); border: 1px solid var(--nh-border); color: var(--nh-text); font-family: inherit; font-size: 12.5px; font-weight: 600; border-radius: 9px; padding: 6px 10px; outline: none; cursor: pointer; }
  input[type="color"].nh-color { width: 44px; height: 28px; border: 1px solid var(--nh-border); border-radius: 8px; background: var(--nh-bg-2); padding: 2px; cursor: pointer; }
  .nh-cssbox { width: 100%; min-height: 130px; resize: vertical; background: var(--nh-bg); border: 1px solid var(--nh-border); border-radius: 10px; color: var(--nh-text); font-family: ui-monospace, "Cascadia Code", Menlo, monospace; font-size: 12px; line-height: 1.6; padding: 10px 12px; outline: none; }
  .nh-cssbox:focus { border-color: var(--nh-accent); }
  .nh-themerow { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ---------- halo tab ---------- */
  .nh-halo-root { display: flex; flex-direction: column; gap: 14px; }
  .nh-card { background: var(--nh-bg-2); border: 1px solid var(--nh-border); border-radius: var(--nh-radius); padding: 14px; }
  .nh-card h3 { margin: 0 0 4px; font-size: 13.5px; }
  .nh-card .nh-sub { color: var(--nh-muted); font-size: 11.5px; margin-bottom: 10px; }
  .nh-logo-preview { width: 96px; height: 96px; margin: 4px auto 10px; border-radius: 24px; display: flex; align-items: center; justify-content: center; background: var(--nh-bg); border: 1px dashed var(--nh-border); overflow: hidden; }
  .nh-logo-preview img { width: 82%; height: 82%; object-fit: contain; }
  .nh-btnrow { display: flex; gap: 8px; flex-wrap: wrap; }
  .nh-btn { border: 1px solid var(--nh-border); background: var(--nh-bg-2); color: var(--nh-text); border-radius: 10px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background .13s, border-color .13s; display: inline-flex; align-items: center; gap: 6px; }
  .nh-btn:hover { background: color-mix(in srgb, var(--nh-accent) 12%, transparent); border-color: color-mix(in srgb, var(--nh-accent) 40%, transparent); }
  .nh-btn.primary { background: var(--nh-accent); border-color: transparent; color: #1a1526; }
  .nh-btn.primary:hover { filter: brightness(1.07); }
  .nh-field { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; }
  .nh-field + .nh-field { border-top: 1px dashed var(--nh-border); }
  .nh-field label { font-weight: 600; font-size: 12.5px; }
  .nh-field .nh-desc { color: var(--nh-muted); font-size: 11px; font-weight: 400; margin-top: 1px; }
  .nh-slider { display: flex; align-items: center; gap: 10px; flex: 1; max-width: 220px; }
  .nh-slider input[type=range] { flex: 1; accent-color: var(--nh-accent); }
  .nh-slider output { font-variant-numeric: tabular-nums; font-size: 12px; color: var(--nh-muted); width: 48px; text-align: right; }
  .nh-switch { position: relative; width: 40px; height: 22px; flex: 0 0 auto; }
  .nh-switch input { opacity: 0; width: 100%; height: 100%; position: absolute; margin: 0; cursor: pointer; z-index: 2; }
  .nh-switch .nh-track { position: absolute; inset: 0; border-radius: 999px; background: var(--nh-border); transition: background .18s; }
  .nh-switch .nh-track::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .18s; }
  .nh-switch input:checked + .nh-track { background: var(--nh-accent); }
  .nh-switch input:checked + .nh-track::after { transform: translateX(18px); }
  .nh-posread { color: var(--nh-muted); font-size: 11.5px; font-variant-numeric: tabular-nums; }
  .nh-permwarn { border: 1px solid color-mix(in srgb, var(--nh-amber) 45%, transparent); background: color-mix(in srgb, var(--nh-amber) 10%, transparent); border-radius: var(--nh-radius); padding: 12px 14px; font-size: 12.5px; display: flex; flex-direction: column; gap: 8px; }

  /* ---------- floating halo widget ---------- */
  .nh-halo { width: var(--halo-size, 64px); height: var(--halo-size, 64px); border-radius: 28%; position: relative; cursor: grab; user-select: none; }
  .nh-halo:active { cursor: grabbing; }
  .nh-halo img { width: 100%; height: 100%; object-fit: contain; border-radius: inherit; filter: drop-shadow(0 4px 14px rgba(0,0,0,.45)); user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .nh-halo::after { content: ''; position: absolute; inset: -14%; background: radial-gradient(circle, color-mix(in srgb, var(--lumiverse-accent, #b28cff) 28%, transparent) 0%, transparent 70%); z-index: -1; opacity: 0; transition: opacity .25s; border-radius: 50%; }
  .nh-halo:hover::after { opacity: 1; }

  /* ---------- image lightbox ---------- */
  .nh-lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(8,7,14,.82); display: flex; align-items: center; justify-content: center; cursor: zoom-out; backdrop-filter: blur(4px); }
  .nh-lightbox img { max-width: 92vw; max-height: 92vh; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
`;

/* ================================================================ */
/* 2. Icons                                                          */
/* ================================================================ */

const ICONS = {
  notebook: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 18.5Z"/><path d="M20 3v13"/><path d="M8 7.5h5M8 11h3"/></svg>',
  spark: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.4L19.3 10l-5.4 1.9L12 17.3l-1.9-5.4L4.7 10l5.4-1.6Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  plus: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pin: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 7 4 4H6l4-4Z"/><path d="M12 15v6"/></svg>',
  pinSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#b28cff" stroke="none"><path d="M9 3h6l-1 7 4 4H6l4-4Z"/><path d="M12 14v7" stroke="#b28cff" stroke-width="2"/></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
  image: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-4.5-4.5L9 18"/></svg>',
  list: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.1" fill="currentColor" stroke="none"/></svg>',
  chev: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  upload: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 20h16"/></svg>',
  reset: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  gear: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.09a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/></svg>',
};

/* Default halo logo — a soft lavender spark (SVG, no external assets) */
function defaultLogoDataUrl() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>
  <defs>
    <radialGradient id='g' cx='50%' cy='38%' r='75%'>
      <stop offset='0%' stop-color='#e6dbff'/><stop offset='55%' stop-color='#b28cff'/><stop offset='100%' stop-color='#6d4fc4'/>
    </radialGradient>
  </defs>
  <rect x='4' y='4' width='88' height='88' rx='26' fill='url(#g)'/>
  <path d='M48 22c2.4 10.8 6.6 15 17.4 17.4C55 43 50.4 46.6 48 57.4 45.6 46.6 41 43 30.6 39.4 41.4 37 45.6 32.8 48 22Z' fill='#fff' opacity='.95'/>
  <circle cx='66' cy='62' r='4' fill='#fff' opacity='.8'/><circle cx='30' cy='66' r='2.6' fill='#fff' opacity='.6'/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ================================================================ */
/* 3. Tiny utilities                                                 */
/* ================================================================ */

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function unescapeHtml(s) {
  return String(s ?? '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (_) { return ''; }
}

function debounce(fn, ms) {
  let t = null;
  const wrapped = (...args) => { clearTimeout(t); t = setTimeout(() => { t = null; fn(...args); }, ms); };
  wrapped.flush = (...args) => { if (t) { clearTimeout(t); t = null; fn(...args); } };
  wrapped.cancel = () => { clearTimeout(t); t = null; };
  return wrapped;
}

/** Trigger a real browser download for a text file */
function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function safeFilename(title, ext) {
  const base = String(title || 'note').replace(/[^\p{L}\p{N} _.-]+/gu, '').trim().replace(/\s+/g, ' ').slice(0, 60);
  return `${base || 'note'}.${ext}`;
}

/** raw bytes → data URL (keeps GIF animations & media files intact, no canvas) */
function bytesToDataUrl(bytes, mime) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  return `data:${mime || 'application/octet-stream'};base64,${btoa(bin)}`;
}

/** which player does a data URL need? */
function mediaKindOf(dataUrl) {
  const mime = (dataUrl || '').slice(5, Math.max(5, (dataUrl || '').indexOf(';')));
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'image';
}

/** pickers often hand us '' or application/octet-stream — extension knows better */
const MEDIA_EXT_MIME = {
  gif: 'image/gif', apng: 'image/apng', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v', ogv: 'video/ogg', mkv: 'video/x-matroska', avi: 'video/x-msvideo', '3gp': 'video/3gpp',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', m4a: 'audio/x-m4a', aac: 'audio/aac', flac: 'audio/flac', opus: 'audio/ogg', weba: 'audio/webm', mid: 'audio/midi',
};
const MEDIA_PICK_ACCEPT = [
  ...new Set(Object.values(MEDIA_EXT_MIME)),
  ...Object.keys(MEDIA_EXT_MIME).map((e) => `.${e}`),
];
function fileMime(file) {
  const mt = (file?.mimeType || '').toLowerCase();
  if (mt && mt !== 'application/octet-stream') return mt;
  const ext = (String(file?.name || '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  return MEDIA_EXT_MIME[ext] || mt || 'application/octet-stream';
}

/** Tap (tiny, no drag) + long-press helpers that survive host drag handlers */
function addTapListener(el, onTap) {
  let sx = 0, sy = 0, st = 0;
  el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); }, { passive: true });
  el.addEventListener('pointerup', (e) => {
    const moved = Math.hypot(e.clientX - sx, e.clientY - sy);
    if (moved < 8 && Date.now() - st < 450) onTap(e);
  }, { passive: true });
}

function addLongPress(el, onPress) {
  let timer = null, sx = 0, sy = 0, fired = false;
  el.addEventListener('pointerdown', (e) => {
    sx = e.clientX; sy = e.clientY; fired = false;
    clearTimeout(timer);
    timer = setTimeout(() => { fired = true; onPress({ x: sx, y: sy }); }, 520);
  }, { passive: true });
  el.addEventListener('pointermove', (e) => {
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) clearTimeout(timer);
  }, { passive: true });
  const cancel = () => clearTimeout(timer);
  el.addEventListener('pointerup', cancel, { passive: true });
  el.addEventListener('pointercancel', cancel, { passive: true });
  return () => fired; // caller can query if the press already fired
}

/** Minimal .docx (OOXML zip) text extraction — zero dependencies */
async function extractDocxText(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  // locate End Of Central Directory record
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid .docx (no zip directory found)');
  const entries = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  let docEntry = null;
  for (let i = 0; i < entries && off + 46 <= u8.length; i++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    const method = dv.getUint16(off + 10, true);
    const compSize = dv.getUint32(off + 20, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const commentLen = dv.getUint16(off + 32, true);
    const localOff = dv.getUint32(off + 42, true);
    const name = dec.decode(u8.subarray(off + 46, off + 46 + nameLen));
    if (name === 'word/document.xml') { docEntry = { method, compSize, localOff }; break; }
    off += 46 + nameLen + extraLen + commentLen;
  }
  if (!docEntry) throw new Error('Not a Word document (word/document.xml missing)');
  const lh = docEntry.localOff;
  if (dv.getUint32(lh, true) !== 0x04034b50) throw new Error('Corrupt .docx (bad local header)');
  const dataStart = lh + 30 + dv.getUint16(lh + 26, true) + dv.getUint16(lh + 28, true);
  const raw = u8.subarray(dataStart, dataStart + docEntry.compSize);
  let xmlBytes = raw;
  if (docEntry.method === 8) {
    const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const xml = dec.decode(xmlBytes);
  return xml
    .replace(/<w:tab\s*\/>/g, '\t')
    .replace(/<w:br\s*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Downscale an image data URL (svg/gif pass through untouched) */
function downscaleImage(file, maxDim) {
  return new Promise((resolve) => {
    try {
      if (file.mimeType === 'image/svg+xml' || file.mimeType === 'image/gif') {
        const blob = new Blob([file.bytes], { type: file.mimeType });
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(blob);
        return;
      }
      const blob = new Blob([file.bytes], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const type = file.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(type, 0.88));
        } catch (_) { resolve(null); } finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch (_) { resolve(null); }
  });
}

/* ================================================================ */
/* 4. Markdown-lite renderer (XSS-safe: escape first, then tokens)   */
/* ================================================================ */

function renderMarkdown(src, opts) {
  const missing = new Set(opts?.missingTitles || []);
  const stash = [];

  // 1) pull out fenced code blocks + inline code before escaping
  //    (markers are digit-free so normal numbers in text are never touched)
  let text = String(src || '');
  text = text.replace(/```([\s\S]*?)```/g, (_m, code) => {
    stash.push(`<pre><code>${escapeHtml(code.replace(/^\n+|\n+$/g, ''))}</code></pre>`);
    return `\x00nh${stash.length - 1}\x00`;
  });
  text = text.replace(/`([^`\n]+)`/g, (_m, code) => {
    stash.push(`<code>${escapeHtml(code)}</code>`);
    return `\x00nh${stash.length - 1}\x00`;
  });

  // 2) escape everything else, then work line by line
  const lines = escapeHtml(text).split('\n');
  const out = [];
  let para = [];
  let listType = null; // 'ul' | 'ol'
  const flushPara = () => { if (para.length) { out.push(`<p>${para.join('<br>')}</p>`); para = []; } };
  const flushList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  const inline = (s) => {
    // images embedded via our scheme — real src resolved after render
    s = s.replace(/!\[([^\]]*)\]\(nh-img:\/\/([A-Za-z0-9_-]+)\)/g,
      (_m, alt, id) => `</p><div class="nh-imgbox" data-img-id="${id}"><img data-img-id="${id}" alt="${alt}">${alt ? `<div class="nh-imgcap">${alt}</div>` : ''}</div><p>`);
    // wiki links [[Title]]  (text here is already HTML-escaped — don't re-escape)
    s = s.replace(/\[\[([^\][|]{1,120})(?:\|([^\]]{1,120}))?\]\]/g, (_m, target, label) => {
      const rawTitle = unescapeHtml(target).trim();
      const cls = missing.has(rawTitle.toLowerCase()) ? 'nh-wikilink missing' : 'nh-wikilink';
      return `<span class="${cls}" data-nh-link="${target.trim()}">${(label || target).trim()}</span>`;
    });
    // normal links
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_m, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    // bold/italic/strike/highlight
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    return s;
  };

  let taskIdx = 0;
  for (const line of lines) {
    let m;
    if ((m = line.match(/^###\s+(.*)/))) { flushPara(); flushList(); out.push(`<h3>${inline(m[1])}</h3>`); continue; }
    if ((m = line.match(/^##\s+(.*)/))) { flushPara(); flushList(); out.push(`<h2>${inline(m[1])}</h2>`); continue; }
    if ((m = line.match(/^#\s+(.*)/))) { flushPara(); flushList(); out.push(`<h1>${inline(m[1])}</h1>`); continue; }
    if (/^(\s*)(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); continue; }
    if ((m = line.match(/^&gt;\s?(.*)/))) { flushPara(); flushList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = line.match(/^\s*-\s+\[([ xX])\]\s+(.*)/))) {
      flushPara(); flushList();
      const done = m[1] !== ' ';
      out.push(`<div class="nh-task${done ? ' done' : ''}" data-task-idx="${taskIdx++}"><input type="checkbox" ${done ? 'checked' : ''}><span>${inline(m[2])}</span></div>`);
      continue;
    }
    if ((m = line.match(/^\s*[-•]\s+(.*)/))) {
      flushPara();
      if (listType !== 'ul') { flushList(); out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`); continue;
    }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
      flushPara();
      if (listType !== 'ol') { flushList(); out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`); continue;
    }
    if (line.trim() === '') { flushPara(); flushList(); continue; }
    flushList();
    para.push(inline(line));
  }
  flushPara(); flushList();

  // 3) restore code stashes and tidy wrapper paragraphs around block stashes
  return out
    .join('\n')
    .replace(/\x00nh(\d+)\x00/g, (_m, i) => stash[Number(i)] ?? '')
    .replace(/<p>(<pre>[\s\S]*?<\/pre>)<\/p>/g, '$1')
    .replace(/<p>\s*<\/p>/g, '');
}

/* ================================================================ */
/* 5. The extension                                                  */
/* ================================================================ */

export function setup(ctx) {
  const disposers = [];
  const removeStyle = ctx.dom.addStyle(NH_CSS);

  /* ---------------- RPC bridge ---------------- */

  let reqSeq = 0;
  const pending = new Map();

  function rpc(type, data = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const requestId = `nh_${Date.now()}_${++reqSeq}`;
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`Notehaven request timed out (${type})`));
      }, timeoutMs);
      pending.set(requestId, { resolve, reject, timer });
      ctx.sendToBackend({ type, requestId, ...data });
    });
  }

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (!payload || payload.type !== 'nh:result') return;
    const slot = pending.get(payload.requestId);
    if (!slot) return;
    pending.delete(payload.requestId);
    clearTimeout(slot.timer);
    if (payload.ok) slot.resolve(payload.data);
    else slot.reject(new Error(payload.error || 'Unknown backend error'));
  });
  disposers.push(unsubBackend);

  const toast = (level, message) => rpc('toast', { level, message }).catch(() => {});

  /* ---------------- shared state ---------------- */

  const state = {
    index: { notes: [] },
    settings: {
      logo: { size: 64, visible: true, snapToEdge: true, x: null, y: null },
      editor: { mode: 'write' },
      ui: { customCSS: '', accent: '', modalOpacity: 1, backdropDim: 0.6, backdropBlur: 3, fontSize: 13.5, radius: 14, theme: 'auto', collapsed: [] },
    },
    currentId: null,
    current: null,         // { id, title, content }
    search: '',
    view: 'all',       // 'all' | 'inbox' | folderId
    selection: null,   // null → normal mode; Set<string> → select mode
    modalOpen: false,
    settingsOpen: false,
    railHidden: (window.innerWidth || 1280) < 760, // rail starts tucked away on small screens
    lastLPAt: 0, // dedupe long-press vs native contextmenu
    haloResizeAt: 0,   // suppress the "tap" that ends a resize gesture
    lastHaloOpenAt: 0, // dedupe tap vs click open paths on the Halo
    imageCache: new Map(), // imageId -> dataUrl
    logoSrc: defaultLogoDataUrl(),
    booted: false,
  };

  const metaOf = (id) => state.index.notes.find((n) => n.id === id);

  const saveSettingsSoon = debounce(() => {
    rpc('save_settings', { settings: state.settings }).catch(() => {});
  }, 400);

  /* ==================================================== */
  /* MODAL skeleton (injected into <body>, free tier)      */
  /* ==================================================== */

  const overlayWrap = ctx.dom.inject('body', `
    <div class="nh-overlay">
      <div class="nh-modal" role="dialog" aria-label="Notehaven notes">
        <div class="nh-mhead">
          <span class="nh-mtitle">${ICONS.notebook.replace('width="20" height="20"', 'width="17" height="17"')}<span class="nh-mt-text">Notehaven</span></span>
          <div class="nh-search">${ICONS.search}<input type="text" placeholder="Search notes, #tags…" spellcheck="false"></div>
          <button class="nh-iconbtn nh-rail-toggle" title="Toggle note list">${ICONS.list}</button>
          <button class="nh-iconbtn nh-themebtn" title="Switch to light theme" style="font-size:14px">☀️</button>
          <button class="nh-iconbtn nh-settings-btn" title="Notehaven settings — appearance, CSS, themes">${ICONS.gear}</button>
          <button class="nh-newbtn">${ICONS.plus}<span>New note</span></button>
          <button class="nh-iconbtn nh-morebtn" title="Import / Export" style="font-size:17px;font-weight:800;line-height:1;padding-bottom:4px">⋯</button>
          <button class="nh-mclose" title="Close (Esc)">✕</button>
        </div>
        <div class="nh-mbody">
          <div class="nh-listwrap">
            <div class="nh-actionbar">
              <button class="nh-ambtn nh-am-all">☑ All</button>
              <button class="nh-ambtn nh-am-move">📁 Move</button>
              <button class="nh-ambtn danger nh-am-del">🗑 Delete</button>
              <span class="nh-selcount"></span>
              <button class="nh-ambtn primary nh-am-done">Done</button>
            </div>
            <div class="nh-listhead"><span class="nh-lh-left"><span class="nh-view-label">All</span></span><span style="display:inline-flex;align-items:center;gap:4px"><button class="nh-iconbtn nh-select-toggle" title="Select notes" style="width:26px;height:26px;font-size:12px">☑</button><span class="nh-count"></span></span></div>
            <div class="nh-list nh-scroll"></div>
            <div class="nh-rail-resizer" title="Drag to resize the rail"></div>
          </div>
          <div class="nh-editor">
            <div class="nh-editor-head">
              <input class="nh-title" type="text" placeholder="Untitled Note" spellcheck="false">
              <div class="nh-modegroup">
                <button class="nh-modebtn" data-mode="write">✍ Write</button>
                <button class="nh-modebtn" data-mode="read">📖 Read</button>
              </div>
              <button class="nh-iconbtn nh-pinbtn" title="Pin note">${ICONS.pin}</button>
              <button class="nh-iconbtn danger nh-delbtn" title="Delete note">${ICONS.trash}</button>
            </div>
            <div class="nh-toolbar"></div>
            <div class="nh-canvas">
              <div class="nh-surfacewrap nh-scroll">
                <div class="nh-preview nh-editor-surface" contenteditable="true" spellcheck="true"></div>
              </div>
            </div>
            <div class="nh-statusbar">
              <span class="nh-savestate"><span class="nh-pulse"></span><span class="nh-savetext">Saved</span></span>
              <span class="nh-tags"></span><span class="nh-grow"></span>
              <span class="nh-words"></span><span class="nh-when"></span>
            </div>
          </div>
        </div>
        <div class="nh-rsz nh-rsz-e" title="Drag to resize width"></div>
        <div class="nh-rsz nh-rsz-s" title="Drag to resize height"></div>
        <div class="nh-mresize" title="Drag to resize the window">◢</div>
      </div>
    </div>
  `);

  const overlay = overlayWrap.querySelector('.nh-overlay');
  const modalEl = overlayWrap.querySelector('.nh-modal');
  const searchInput = overlayWrap.querySelector('.nh-search input');
  const newBtn = overlayWrap.querySelector('.nh-newbtn');
  const moreBtn = overlayWrap.querySelector('.nh-morebtn');
  const railToggle = overlayWrap.querySelector('.nh-rail-toggle');
  const listWrap = overlayWrap.querySelector('.nh-listwrap');
  const listEl = overlayWrap.querySelector('.nh-list');
  const countEl = overlayWrap.querySelector('.nh-count');
  const themeBtn = overlayWrap.querySelector('.nh-themebtn');
  const actionBar = overlayWrap.querySelector('.nh-actionbar');
  const amAll = overlayWrap.querySelector('.nh-am-all');
  const amMove = overlayWrap.querySelector('.nh-am-move');
  const amDel = overlayWrap.querySelector('.nh-am-del');
  const amDone = overlayWrap.querySelector('.nh-am-done');
  const selCount = overlayWrap.querySelector('.nh-selcount');
  const viewLabel = overlayWrap.querySelector('.nh-view-label');
  const selectToggle = overlayWrap.querySelector('.nh-select-toggle');
  const railResizer = overlayWrap.querySelector('.nh-rail-resizer');
  const mResize = overlayWrap.querySelector('.nh-mresize');
  const titleInput = overlayWrap.querySelector('.nh-title');
  const pinBtn = overlayWrap.querySelector('.nh-pinbtn');
  const delBtn = overlayWrap.querySelector('.nh-delbtn');
  const modeBtns = [...overlayWrap.querySelectorAll('.nh-modebtn')];
  const toolbar = overlayWrap.querySelector('.nh-toolbar');
  const canvas = overlayWrap.querySelector('.nh-canvas');
  const settingsBtn = overlayWrap.querySelector('.nh-settings-btn');
  const preview = overlayWrap.querySelector('.nh-editor-surface'); // the one live surface
  const saveStateEl = overlayWrap.querySelector('.nh-savestate');
  const saveTextEl = overlayWrap.querySelector('.nh-savetext');
  const tagsEl = overlayWrap.querySelector('.nh-tags');
  const wordsEl = overlayWrap.querySelector('.nh-words');
  const whenEl = overlayWrap.querySelector('.nh-when');

  /* ---------------- modal open/close ---------------- */

  function openModal(noteId) {
    state.modalOpen = true;
    overlay.classList.add('nh-open');
    if (noteId && noteId !== state.currentId && metaOf(noteId)) openNote(noteId);
    else if (state.currentId) { renderList(); renderPreview(); }
    // don't pop the on-screen keyboard open on phones
    if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
      setTimeout(() => searchInput.focus(), 60);
    }
  }

  function closeModal() {
    state.modalOpen = false;
    saveNoteSoon.flush();
    overlay.classList.remove('nh-open');
    refreshDrawerRecent();
  }

  overlayWrap.querySelector('.nh-mclose').addEventListener('click', closeModal);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });
  const onEsc = (e) => {
    if (e.key !== 'Escape') return;
    if (state.settingsOpen) { closeSettings(); return; }
    if (state.modalOpen) closeModal();
  };
  window.addEventListener('keydown', onEsc);
  disposers.push(() => window.removeEventListener('keydown', onEsc));

  function syncRail() {
    listWrap.classList.toggle('nh-hidden', state.railHidden);
    railToggle.classList.toggle('is-active', state.railHidden);
  }
  syncRail(); // honor the small-screen default

  railToggle.addEventListener('click', () => {
    state.railHidden = !state.railHidden;
    syncRail();
  });

  /* ==================================================== */
  /* Drawer tab — launcher                                 */
  /* ==================================================== */

  const notesTab = ctx.ui.registerDrawerTab({
    id: 'notes',
    title: 'Notehaven Notes',
    shortName: 'Notes',
    description: 'Cozy Obsidian-inspired notes — opens in a comfy window',
    keywords: ['notes', 'markdown', 'journal', 'obsidian', 'images', 'tags'],
    headerTitle: 'Notes',
    iconSvg: ICONS.notebook,
  });
  disposers.push(() => notesTab.destroy());

  const launchRoot = document.createElement('div');
  launchRoot.className = 'nh-root nh-launch nh-scroll';
  launchRoot.innerHTML = `
    <div class="nh-brand">
      <div class="nh-brandmark">🌙</div>
      <h2>Notehaven</h2>
      <p>A cozy little haven for your thoughts.</p>
    </div>
    <button class="nh-openbtn">${ICONS.notebook.replace('width="20" height="20"', 'width="15" height="15"')} Open Notehaven</button>
    <button class="nh-btn nh-launch-new" style="justify-content:center">${ICONS.plus} New note</button>
    <div class="nh-recent-title">Recent</div>
    <div class="nh-recent"></div>
    <div class="nh-tips">💡 Tip: the floating <b>Halo</b> logo doubles as a doorbell — <b>tap</b> it to pop this window open. On phones, <b>long-press</b> it for its menu.</div>`;
  notesTab.root.appendChild(launchRoot);

  const recentEl = launchRoot.querySelector('.nh-recent');

  launchRoot.querySelector('.nh-openbtn').addEventListener('click', () => openModal());
  launchRoot.querySelector('.nh-launch-new').addEventListener('click', async () => {
    const note = await createNote();
    if (note) { openModal(note.id); setTimeout(() => { titleInput.focus(); titleInput.select(); }, 120); }
  });
  disposers.push(notesTab.onActivate(refreshDrawerRecent));

  function refreshDrawerRecent() {
    if (!recentEl) return;
    const notes = [...state.index.notes]
      .sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updatedAt) - new Date(a.updatedAt)))
      .slice(0, 6);
    recentEl.innerHTML = '';
    if (!notes.length) {
      recentEl.innerHTML = '<div class="nh-empty">No notes yet</div>';
      return;
    }
    for (const meta of notes) recentEl.appendChild(listItemButton(meta, () => openModal(meta.id)));
  }

  /* ==================================================== */
  /* Notes — list + editor rendering                       */
  /* ==================================================== */

  function listItemButton(meta, onClick) {
    const item = document.createElement('button');
    const isSelected = state.selection?.has(meta.id) || false;
    item.className = 'nh-listitem' + (meta.id === state.currentId ? ' active' : '') + (isSelected ? ' selected' : '');
    item.innerHTML = `
      <div class="nh-li-top">
        <span class="nh-check">✓</span>
        <span class="nh-li-dot" style="background:${meta.color || '#b28cff'}"></span>
        <span class="nh-li-title">${escapeHtml(meta.title)}</span>
        ${meta.pinned ? `<span class="nh-li-pin">${ICONS.pinSmall}</span>` : ''}
      </div>
      ${meta.snippet ? `<div class="nh-li-snippet">${escapeHtml(meta.snippet)}</div>` : ''}
      <div class="nh-li-meta"><span>${fmtDate(meta.updatedAt)}</span><span>${meta.words ?? 0}w</span></div>`;
    item.addEventListener('click', onClick);
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (Date.now() - state.lastLPAt < 900) return; // already opened by long-press
      noteContextMenu(e.clientX, e.clientY, meta);
    });
    addLongPress(item, (pt) => {
      state.lastLPAt = Date.now();
      noteContextMenu(pt.x, pt.y, meta);
    });
    // desktop drag & drop onto folder section headers
    if (!state.selection) {
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/nh-note', meta.id);
        e.dataTransfer.effectAllowed = 'move';
      });
    }
    return item;
  }

  function filteredNotes() {
    const q = state.search.trim().toLowerCase();
    let notes = [...state.index.notes];
    if (state.view === 'inbox') notes = notes.filter((n) => !n.folderId);
    else if (state.view !== 'all') notes = notes.filter((n) => n.folderId === state.view);
    notes.sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updatedAt) - new Date(a.updatedAt)));
    if (!q) return notes;
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      (n.snippet || '').toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q.replace(/^#/, ''))));
  }

  function viewName() {
    if (state.view === 'inbox') return 'Inbox';
    if (state.view === 'all') return 'All';
    return state.index.folders.find((f) => f.id === state.view)?.name || 'All';
  }

  /* [testable:buildSections:start] */
  // One scannable "All" view: unfiled notes under "Inbox", then every folder
  // as its own section — even empty ones, so they never become unreachable.
  // Incoming notes stay in their existing order (pinned first, then recency).
  function buildSections(notes, folders) {
    const sections = [];
    const unfiled = notes.filter((n) => !n.folderId);
    if (unfiled.length) sections.push({ id: 'inbox', name: 'Inbox', icon: '📥', folder: null, items: unfiled });
    for (const folder of folders) {
      sections.push({ id: folder.id, name: folder.name, icon: folder.icon, color: folder.color, folder, items: notes.filter((n) => n.folderId === folder.id) });
    }
    return sections;
  }
  /* [testable:buildSections:end] */

  function noteRow(meta) {
    return listItemButton(meta, () => {
      if (state.selection) { toggleSelected(meta.id); return; }
      openNote(meta.id);
      // on small screens the rail covers the editor — tuck it away after picking
      if ((window.innerWidth || 1280) <= 760) { state.railHidden = true; syncRail(); }
    });
  }

  const isCollapsed = (id) => (state.settings.ui.collapsed || []).includes(id);

  function toggleCollapse(id) {
    const list = state.settings.ui.collapsed || (state.settings.ui.collapsed = []);
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    saveSettingsSoon();
    renderList();
  }

  function expandSection(id) {
    const list = state.settings.ui.collapsed || [];
    const i = list.indexOf(id);
    if (i >= 0) { list.splice(i, 1); saveSettingsSoon(); }
  }

  function folderHeaderRow(section) {
    const hdr = document.createElement('div');
    const collapsed = isCollapsed(section.id);
    hdr.className = 'nh-fhdr' + (collapsed ? ' collapsed' : '');
    hdr.setAttribute('role', 'button');
    hdr.setAttribute('aria-expanded', String(!collapsed));
    if (section.folder) hdr.dataset.folderId = section.folder.id;
    const ico = section.folder
      ? folderIconHtml(section.folder)
      : `<span class="nh-fico">${section.icon}</span>`;
    hdr.innerHTML = `${ico}<span class="nh-fname">${escapeHtml(section.name)}</span><span class="nh-fcount">${section.items.length}</span><span class="nh-fchev">${ICONS.chev}</span>`;
    // dropdown behavior: tap (anywhere on the row, chevron included) hides/shows its notes
    hdr.title = collapsed ? `Show notes in “${section.name}”` : `Hide notes in “${section.name}”`;
    hdr.addEventListener('click', () => toggleCollapse(section.id));
    if (section.folder) {
      hdr.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (Date.now() - state.lastLPAt < 900) return; // already opened by long-press
        folderContextMenu(e.clientX, e.clientY, section.folder);
      });
      addLongPress(hdr, (pt) => {
        state.lastLPAt = Date.now();
        folderContextMenu(pt.x, pt.y, section.folder);
      });
    }
    // desktop drag & drop: drag a note onto a folder header to file it there
    const target = section.id === 'inbox' ? null : section.id;
    hdr.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('text/nh-note')) { e.preventDefault(); hdr.classList.add('nh-drop'); }
    });
    hdr.addEventListener('dragleave', () => hdr.classList.remove('nh-drop'));
    hdr.addEventListener('drop', (e) => {
      e.preventDefault();
      hdr.classList.remove('nh-drop');
      const noteId = e.dataTransfer.getData('text/nh-note');
      if (noteId) moveNotes([noteId], target);
    });
    return hdr;
  }

  function syncListHeader() {
    viewLabel.textContent = viewName(); // everything lives under one "All" list now
    viewLabel.title = 'All notes';
  }

  function emptyRow(text, btnLabel, onBtn) {
    const e = document.createElement('div');
    e.className = 'nh-empty';
    e.appendChild(document.createTextNode(text));
    if (btnLabel) {
      e.appendChild(document.createElement('br'));
      const b = document.createElement('button');
      b.className = 'nh-emptybtn';
      b.textContent = btnLabel;
      b.addEventListener('click', onBtn);
      e.appendChild(b);
    }
    return e;
  }

  function renderList() {
    const scrollTop = listEl.scrollTop;
    listEl.innerHTML = '';
    const searching = !!state.search.trim();
    const notes = filteredNotes();
    countEl.textContent = `${notes.length}`;
    syncListHeader();
    const pushRows = (items) => { for (const meta of items) listEl.appendChild(noteRow(meta)); };

    // one list to rule them all: folders are collapsible dropdown sections
    if (!searching) {
      if (!notes.length && !state.index.folders.length) {
        listEl.appendChild(emptyRow('No notes here yet.', '＋ New note', () => newBtn.click()));
      } else {
        for (const section of buildSections(notes, state.index.folders || [])) {
          listEl.appendChild(folderHeaderRow(section));
          if (!isCollapsed(section.id)) pushRows(section.items);
        }
        const add = document.createElement('button');
        add.className = 'nh-addfolder';
        add.innerHTML = `${ICONS.plus}<span>New folder</span>`;
        add.title = 'New folder';
        add.addEventListener('click', () => createFolderFlow());
        listEl.appendChild(add);
      }
      hydrateFolderIcons();
      listEl.scrollTop = scrollTop;
      return;
    }

    // search results: flat, fast, no sections
    if (!notes.length) listEl.appendChild(emptyRow('No notes match your search.'));
    else pushRows(notes);
    listEl.scrollTop = scrollTop;
  }

  /* ---------------- folders (categories) ---------------- */

  function folderIconHtml(folder) {
    const icon = folder?.icon || '';
    if (icon.startsWith('img:')) return `<span class="nh-fico"><img data-folder-ico="${icon.slice(4)}" alt=""></span>`;
    if (icon) return `<span class="nh-fico">${escapeHtml(icon)}</span>`;
    return `<span class="nh-fico" style="background:${folder?.color || '#b28cff'}30">📁</span>`;
  }

  async function hydrateFolderIcons() {
    const imgs = [...listWrap.querySelectorAll('img[data-folder-ico]')];
    const missing = [...new Set(imgs.map((c) => c.getAttribute('data-folder-ico')))].filter((id) => !state.imageCache.has(id));
    await Promise.all(missing.map(async (id) => {
      try { const { dataUrl } = await rpc('get_image', { imageId: id }, 25000); state.imageCache.set(id, dataUrl || ''); }
      catch (_) { state.imageCache.set(id, ''); }
    }));
    listWrap.querySelectorAll('img[data-folder-ico]').forEach((img) => {
      const src = state.imageCache.get(img.getAttribute('data-folder-ico'));
      if (src) img.src = src;
    });
  }

  async function createFolderFlow() {
    try {
      const { folder, index } = await rpc('create_folder', { name: 'New folder' });
      state.index = index;
      renderList();
      startFolderRename(folder.id);
    } catch (err) { toast('error', err.message || 'Could not create folder'); }
  }

  function startFolderRename(folderId) {
    renderList();
    const folder = state.index.folders.find((f) => f.id === folderId);
    if (!folder) return;
    // rename inline, right inside the folder's section row
    const host = listEl.querySelector(`[data-folder-id="${folderId}"] .nh-fname`);
    if (!host) return;
    const input = document.createElement('input');
    input.className = 'nh-rename-input';
    input.value = folder.name;
    host.innerHTML = '';
    host.appendChild(input);
    input.focus(); input.select();
    let done = false;
    const commit = async (save) => {
      if (done) return; done = true;
      const name = input.value.trim();
      if (save && name && name !== folder.name) {
        try {
          const { index } = await rpc('rename_folder', { id: folderId, name });
          state.index = index;
        } catch (err) { toast('error', err.message); }
      }
      renderList();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      else if (e.key === 'Escape') commit(false);
    });
    input.addEventListener('blur', () => commit(true));
    input.addEventListener('click', (e) => e.stopPropagation());
  }

  async function setFolderMeta(id, patch) {
    try {
      const { index } = await rpc('set_folder_meta', { id, ...patch });
      state.index = index;
      renderList();
    } catch (err) { toast('error', err.message); }
  }

  async function deleteFolder(folder, deleteNotes) {
    try {
      const { index } = await rpc('delete_folder', { id: folder.id, deleteNotes });
      state.index = index;
      if (state.currentId && !state.index.notes.some((n) => n.id === state.currentId)) {
        state.current = null; state.currentId = null;
        const next = state.index.notes[0];
        if (next) await openNote(next.id);
        else { titleInput.value = ''; preview.innerHTML = ''; }
      }
      renderList();
      toast('info', deleteNotes ? 'Folder and its notes deleted' : 'Folder deleted — notes moved to Inbox');
    } catch (err) { toast('error', err.message); }
  }

  async function folderContextMenu(x, y, folder) {
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x, y },
      items: [
        { key: 'newnote', label: '＋ New note here' },
        { key: 'rename', label: '✏️ Rename folder' },
        { key: 'icon', label: '🎨 Change icon…' },
        { key: 'div1', label: '', type: 'divider' },
        { key: 'del-keep', label: '🗑 Delete folder (keep notes)', danger: true },
        { key: 'del-all', label: '🔥 Delete folder AND its notes', danger: true },
      ],
    });
    if (!selectedKey) return;
    if (selectedKey === 'rename') startFolderRename(folder.id);
    else if (selectedKey === 'newnote') {
      try {
        const res = await rpc('create_note', { title: '', folderId: folder.id });
        state.index = res.index;
        expandSection(folder.id); // make sure you can see your brand new note
        renderList();
        await openNote(res.note.id);
        setTimeout(() => { titleInput.focus(); titleInput.select(); }, 80);
      } catch (err) { toast('error', err.message); }
    } else if (selectedKey === 'del-keep') await deleteFolder(folder, false);
    else if (selectedKey === 'del-all') await deleteFolder(folder, true);
    else if (selectedKey === 'icon') {
      const emojis = ['📁', '📂', '🌙', '⭐', '💼', '❤️', '📚', '🎨', '🎮', '💡', '🔥', '🌸'];
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: [
          ...emojis.map((e) => ({ key: `emoji:${e}`, label: `${e}${folder.icon === e ? ' ✓' : ''}`, active: folder.icon === e })),
          { key: 'd', label: '', type: 'divider' },
          { key: 'upload', label: '📷 Upload image…' },
          { key: 'clear', label: '✖ Remove icon' },
        ],
      });
      if (!sub.selectedKey) return;
      if (sub.selectedKey.startsWith('emoji:')) await setFolderMeta(folder.id, { icon: sub.selectedKey.slice(6) });
      else if (sub.selectedKey === 'clear') await setFolderMeta(folder.id, { icon: '' });
      else if (sub.selectedKey === 'upload') {
        try {
          const files = await ctx.uploads.pickFile({
            accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
            multiple: false,
            maxSizeBytes: 2 * 1024 * 1024,
          });
          const file = files[0];
          if (!file) return;
          const dataUrl = await downscaleImage(file, 256);
          if (!dataUrl) { toast('error', 'Could not read that image'); return; }
          const { imageId } = await rpc('put_image', { name: file.name, dataUrl }, 30000);
          state.imageCache.set(imageId, dataUrl);
          await setFolderMeta(folder.id, { icon: `img:${imageId}` });
          toast('success', 'Folder icon set');
        } catch (err) {
          if (err && !/cancel|abort/i.test(err.message || '')) toast('error', err.message || 'Icon upload failed');
        }
      }
    }
  }

  async function moveNotes(ids, folderId) {
    try {
      const { index } = await rpc('move_notes', { ids, folderId: folderId ?? null });
      state.index = index;
      exitSelectMode();
      renderList();
      const f = state.index.folders.find((x) => x.id === folderId);
      toast('success', `Moved ${ids.length} note(s)${f ? ` to "${f.name}"` : ' to Inbox'}`);
    } catch (err) { toast('error', err.message || 'Could not move notes'); }
  }

  /* ---------------- multi-select mode ---------------- */

  function enterSelectMode() {
    state.selection = new Set();
    actionBar.classList.add('on');
    listWrap.classList.add('selecting');
    selectToggle.classList.add('is-active');
    renderList();
    syncSelectionUi();
  }

  function exitSelectMode() {
    if (!state.selection) return;
    state.selection = null;
    actionBar.classList.remove('on');
    listWrap.classList.remove('selecting');
    selectToggle.classList.remove('is-active');
    amDelArmedReset();
    syncSelectionUi();
    renderList();
  }

  function toggleSelected(id) {
    if (!state.selection) return;
    if (state.selection.has(id)) state.selection.delete(id);
    else state.selection.add(id);
    renderList();
    syncSelectionUi();
  }

  function syncSelectionUi() {
    selCount.textContent = state.selection ? `${state.selection.size} selected` : '';
  }

  function amDelArmedReset() {
    if (amDelArmedTimer) { clearTimeout(amDelArmedTimer); amDelArmedTimer = null; }
    amDel.classList.remove('armed');
    amDel.textContent = '🗑 Delete';
  }

  selectToggle.addEventListener('click', () => (state.selection ? exitSelectMode() : enterSelectMode()));
  amDone.addEventListener('click', exitSelectMode);
  themeBtn.addEventListener('click', () => {
    const u = state.settings.ui;
    u.theme = u.theme === 'light' ? 'dark' : 'light';
    saveSettingsSoon();
    applyUi(); // also flips the ☀️/🌙 icon and the settings dropdown
  });

  amAll.addEventListener('click', () => {
    if (!state.selection) return;
    const ids = filteredNotes().map((n) => n.id);
    const allSelected = ids.length > 0 && ids.every((id) => state.selection.has(id));
    state.selection = allSelected ? new Set() : new Set(ids);
    renderList();
    syncSelectionUi();
  });

  amMove.addEventListener('click', async (e) => {
    if (!state.selection?.size) { toast('info', 'Select some notes first'); return; }
    const rect = amMove.getBoundingClientRect();
    const items = [{ key: 'inbox', label: '📥 Inbox' },
      ...state.index.folders.map((f) => ({ key: f.id, label: `${f.icon && !f.icon.startsWith('img:') ? f.icon + ' ' : '📁 '}${f.name}` }))];
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: rect.left, y: rect.bottom + 6 },
      items,
    });
    if (!selectedKey) return;
    moveNotes([...state.selection], selectedKey === 'inbox' ? null : selectedKey);
  });

  let amDelArmedTimer = null;
  amDel.addEventListener('click', async () => {
    if (!state.selection?.size) { toast('info', 'Select some notes first'); return; }
    if (!amDelArmedTimer) {
      amDel.classList.add('armed');
      amDel.textContent = `Sure? ${state.selection.size}`;
      amDelArmedTimer = setTimeout(amDelArmedReset, 2800);
      return;
    }
    amDelArmedReset();
    const ids = [...state.selection];
    try {
      const { index, deleted } = await rpc('bulk_delete', { ids });
      state.index = index;
      if (state.currentId && ids.includes(state.currentId)) {
        state.current = null; state.currentId = null;
        const next = state.index.notes[0];
        if (next) await openNote(next.id);
        else { titleInput.value = ''; preview.innerHTML = ''; }
      }
      exitSelectMode();
      renderList();
      toast('info', `Deleted ${deleted} note(s)`);
    } catch (err) { toast('error', err.message || 'Could not delete'); }
  });

  /* ---------------- rail + modal resizing ---------------- */

  railResizer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    railResizer.classList.add('active');
    try { railResizer.setPointerCapture(e.pointerId); } catch (_) {}
    const startX = e.clientX;
    const startW = listWrap.getBoundingClientRect().width;
    const onMove = (ev) => {
      const w = Math.min(420, Math.max(170, startW + (ev.clientX - startX)));
      state.settings.ui.railWidth = Math.round(w);
      listWrap.style.width = `${w}px`;
    };
    const onUp = () => {
      railResizer.classList.remove('active');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      saveSettingsSoon();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // rescalable window: SE corner grip + right-edge and bottom-edge bars
  const rszE = overlayWrap.querySelector('.nh-rsz-e');
  const rszS = overlayWrap.querySelector('.nh-rsz-s');
  const addResizer = (el, dx, dy) => {
    el.addEventListener('pointerdown', (e) => {
      if ((window.innerWidth || 1280) <= 560) return; // phones keep the full-screen sheet
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('active');
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      const startX = e.clientX, startY = e.clientY;
      const rect = modalEl.getBoundingClientRect();
      const onMove = (ev) => {
        const vw = window.innerWidth || 1280, vh = window.innerHeight || 800;
        if (dx) {
          const w = Math.round(Math.min(Math.max(440, rect.width + (ev.clientX - startX)), vw - 16, 2400));
          state.settings.ui.modalW = w;
          modalEl.style.width = `${w}px`;
        }
        if (dy) {
          const h = Math.round(Math.min(Math.max(320, rect.height + (ev.clientY - startY)), vh - 12, 1600));
          state.settings.ui.modalH = h;
          modalEl.style.height = `${h}px`;
        }
      };
      const onUp = () => {
        el.classList.remove('active');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        saveSettingsSoon();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  };
  addResizer(mResize, true, true); // corner: both directions at once
  addResizer(rszE, true, false);   // right edge: width
  addResizer(rszS, false, true);   // bottom edge: height

  const onWinResize = debounce(() => applyUi(), 160);
  window.addEventListener('resize', onWinResize);
  disposers.push(() => window.removeEventListener('resize', onWinResize));

  async function noteContextMenu(x, y, meta) {
    const colors = [
      ['#b28cff', '🟣 Lavender'], ['#ff8fb3', '🌸 Rose'], ['#ffcf7a', '🍯 Amber'],
      ['#8fe3c0', '🌿 Mint'], ['#8fc9ff', '💧 Sky'], ['#9aa0ab', '🪨 Stone'],
    ];
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x, y },
      items: [
        { key: 'rename', label: '✏️ Rename' },
        { key: 'pin', label: meta.pinned ? '📌 Unpin' : '📌 Pin to top' },
        { key: 'float', label: '🪟 Pin on screen — mini window' },
        { key: 'move', label: '📁 Move to…' },
        { key: 'div1', label: '', type: 'divider' },
        ...colors.map(([hex, label]) => ({ key: `color:${hex}`, label, active: meta.color === hex })),
        { key: 'div2', label: '', type: 'divider' },
        { key: 'duplicate', label: '📑 Duplicate' },
        { key: 'export', label: '⬇ Export (.md)' },
        { key: 'delete', label: '🗑 Delete note', danger: true },
      ],
    });
    if (!selectedKey) return;
    if (selectedKey === 'rename') {
      if (!state.modalOpen) openModal(meta.id);
      else await openNote(meta.id);
      titleInput.focus(); titleInput.select();
    } else if (selectedKey === 'pin') {
      await rpc('set_meta', { id: meta.id, pinned: !meta.pinned });
      meta.pinned = !meta.pinned;
      renderList(); refreshPinBtn();
    } else if (selectedKey === 'float') {
      floatNote(meta);
    } else if (selectedKey === 'move') {
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: [
          { key: 'inbox', label: '📥 Inbox', active: !meta.folderId },
          ...state.index.folders.map((f) => ({
            key: f.id,
            label: `${f.icon && !f.icon.startsWith('img:') ? f.icon + ' ' : '📁 '}${f.name}`,
            active: meta.folderId === f.id,
          })),
        ],
      });
      if (sub.selectedKey) moveNotes([meta.id], sub.selectedKey === 'inbox' ? null : sub.selectedKey);
    } else if (selectedKey.startsWith('color:')) {
      const color = selectedKey.slice(6);
      await rpc('set_meta', { id: meta.id, color });
      meta.color = color;
      renderList();
    } else if (selectedKey === 'duplicate') {
      const { note } = await rpc('get_note', { id: meta.id });
      const res = await rpc('create_note', { title: `${meta.title} (copy)`, content: note?.content || '' });
      state.index = res.index;
      renderList();
      toast('success', 'Note duplicated');
    } else if (selectedKey === 'export') {
      exportNoteMarkdown(meta);
    } else if (selectedKey === 'delete') {
      await deleteNote(meta.id);
    }
  }

  function refreshPinBtn() {
    const meta = metaOf(state.currentId);
    pinBtn.classList.toggle('is-active', !!meta?.pinned);
    pinBtn.title = 'Pin — to list top, or onto your screen 📌';
  }

  /* ==================================================== */
  /* Floating mini note — pin a note ON SCREEN and keep    */
  /* chatting. Multitasking for PC *and* phone.            */
  /* ==================================================== */

  let floatNoteWidget = null;
  let floatNoteId = null;
  let floatNoteSaveSoon = null;

  function closeFloatNote() {
    if (floatNoteWidget) { try { floatNoteWidget.destroy(); } catch (_) { /* noop */ } }
    floatNoteWidget = null;
    floatNoteId = null;
    floatNoteSaveSoon = null;
  }
  disposers.push(closeFloatNote);

  async function floatNote(meta) {
    closeFloatNote();
    if (state.currentId === meta.id) { toast('info', 'This note is open in the editor — pin a different one instead'); return; }
    try {
      const { note } = await rpc('get_note', { id: meta.id });
      if (!note) { toast('error', 'That note could not be read'); return; }
      let w;
      try {
        w = ctx.ui.createFloatWidget({
          width: 320,
          height: 240,
          initialPosition: { x: 20, y: Math.max(20, (window.innerHeight || 700) - 300) },
          tooltip: `📌 ${meta.title} — pinned mini note (drag it around)`,
          chromeless: true,
          snapToEdge: false,
        });
      } catch (err) {
        toast('error', 'Floating windows need the ui_panels permission');
        return;
      }
      const box = document.createElement('div');
      box.className = 'nh-floatnote';
      box.classList.toggle('nh-th-light', state.settings.ui.theme === 'light');
      box.innerHTML =
        `<div class="nh-fn-head"><span class="nh-fn-pin">📌</span><span class="nh-fn-title">${escapeHtml(note.title)}</span>` +
        `<button class="nh-fn-btn nh-fn-open" title="Open in Notehaven">⤢</button><button class="nh-fn-btn nh-fn-close" title="Save & unpin">✕</button></div>` +
        `<textarea class="nh-fn-body nh-scroll" spellcheck="true" placeholder="(empty note)"></textarea>` +
        `<div class="nh-fn-state">ready · autosaves as you type</div>`;
      w.root.appendChild(box);
      floatNoteWidget = w;
      floatNoteId = meta.id;

      const ta = box.querySelector('.nh-fn-body');
      const stateEl = box.querySelector('.nh-fn-state');
      ta.value = note.content || '';

      const saveNow = async () => {
        stateEl.textContent = 'saving…';
        try {
          const { index } = await rpc('save_note', { id: floatNoteId, title: note.title, content: ta.value });
          state.index = index;
          renderList();
          stateEl.textContent = `saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓`;
        } catch (err) {
          stateEl.textContent = 'note gone — closing';
          setTimeout(closeFloatNote, 1200);
        }
      };
      floatNoteSaveSoon = debounce(saveNow, 900);
      ta.addEventListener('input', () => { stateEl.textContent = 'typing…'; floatNoteSaveSoon(); });

      box.querySelector('.nh-fn-open').addEventListener('click', () => {
        const id = floatNoteId;
        closeFloatNote();
        if (id) openModal(id);
      });
      box.querySelector('.nh-fn-close').addEventListener('click', async () => {
        await saveNow().catch(() => {});
        closeFloatNote();
      });
      toast('success', `📌 “${meta.title}” pinned on screen — chat & jot at once!`);
    } catch (err) {
      toast('error', err.message || 'Could not pin that note');
    }
  }

  function renderStatus() {
    const meta = metaOf(state.currentId);
    if (!meta) { tagsEl.innerHTML = ''; wordsEl.textContent = ''; whenEl.textContent = ''; return; }
    tagsEl.innerHTML = (meta.tags || []).slice(0, 8).map((t) => `<span class="nh-tag">#${escapeHtml(t)}</span>`).join('');
    const words = state.current ? (state.current.content.trim() ? state.current.content.trim().split(/\s+/).length : 0) : 0;
    wordsEl.textContent = `${words} words · ${(state.current?.content || '').length} chars`;
    whenEl.textContent = `edited ${fmtDate(meta.updatedAt)}`;
  }

  function renderPreview() {
    if (!state.current) { preview.innerHTML = ''; return; }
    const titles = new Set(state.index.notes.map((n) => n.title.toLowerCase()));
    const allTargets = [...state.current.content.matchAll(/\[\[([^\][|]{1,120})/g)].map((m) => unescapeHtml(m[1]).trim().toLowerCase());
    const missing = allTargets.filter((t) => !titles.has(t));
    preview.innerHTML = renderMarkdown(state.current.content, { missingTitles: missing });
    hydrateImages();
  }

  function referencedImageIds() {
    if (!state.current) return [];
    return [...state.current.content.matchAll(/!\[[^\]]*\]\(nh-img:\/\/([A-Za-z0-9_-]+)\)/g)].map((m) => m[1]);
  }

  function applyImgSrcs() {
    // every embedded box gets the RIGHT player once we know its data URL:
    // images → <img> (GIFs animate naturally), videos → <video>, sounds → <audio>
    preview.querySelectorAll('.nh-imgbox[data-img-id]').forEach((box) => {
      const id = box.getAttribute('data-img-id');
      const src = state.imageCache.get(id);
      const cap = box.querySelector('.nh-imgcap');
      const alt = cap ? cap.textContent : (box.querySelector('[data-img-id]')?.dataset.alt || '');
      let media = box.querySelector('[data-img-id]');
      if (src === '') { box.classList.add('nh-missing'); return; } // gone from storage
      box.classList.remove('nh-missing');
      if (!src) return; // not hydrated yet — leave the placeholder
      const kind = mediaKindOf(src);
      const have = media ? (media.tagName === 'VIDEO' ? 'video' : media.tagName === 'AUDIO' ? 'audio' : 'image') : null;
      if (have !== kind) {
        if (media) media.remove();
        media = document.createElement(kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'img');
        media.dataset.imgId = id;
        if (kind !== 'image') {
          media.controls = true;
          media.preload = 'metadata';
          if (kind === 'video') media.setAttribute('playsinline', '');
        }
        box.insertBefore(media, cap || null);
      }
      media.dataset.alt = alt;
      if (media.dataset.done !== '1') { media.src = src; media.dataset.done = '1'; }
    });
  }

  async function hydrateImages() {
    const ids = referencedImageIds();
    const missing = [...new Set(ids)].filter((id) => !state.imageCache.has(id));
    if (missing.length === 0) { applyImgSrcs(); return; } // cached — no flicker
    await Promise.all(missing.map(async (id) => {
      try {
        const { dataUrl } = await rpc('get_image', { imageId: id }, 25000);
        state.imageCache.set(id, dataUrl || '');
      } catch (_) { state.imageCache.set(id, ''); }
    }));
    applyImgSrcs();
  }

  /* ==================================================== */
  /* Live surface — DOM → markdown serialization           */
  /* ==================================================== */

  function inlineMd(el, skipLists = false) {
    let out = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) { out += node.textContent.replace(/\u00a0/g, ' '); continue; }
      if (node.nodeType !== 1) continue;
      const tag = node.tagName;
      if (skipLists && (tag === 'UL' || tag === 'OL')) continue;
      if (tag === 'STRONG' || tag === 'B') out += `**${inlineMd(node)}**`;
      else if (tag === 'EM' || tag === 'I') out += `*${inlineMd(node)}*`;
      else if (tag === 'S' || tag === 'DEL' || tag === 'STRIKE') out += `~~${inlineMd(node)}~~`;
      else if (tag === 'MARK') out += `==${inlineMd(node)}==`;
      else if (tag === 'CODE') out += '`' + node.textContent.replace(/\u00a0/g, ' ') + '`';
      else if (tag === 'BR') out += '\n';
      else if (tag === 'A') {
        const href = node.getAttribute('href') || '';
        out += /^https?:\/\//.test(href) ? `[${inlineMd(node)}](${href})` : inlineMd(node);
      }
      else if ((tag === 'IMG' || tag === 'VIDEO' || tag === 'AUDIO') && node.dataset.imgId) out += `![${node.dataset.alt || node.getAttribute('alt') || ''}](nh-img://${node.dataset.imgId})`;
      else if (node.classList.contains('nh-wikilink')) {
        const target = node.getAttribute('data-nh-link') || node.textContent.trim();
        const label = node.textContent.replace(/\u00a0/g, ' ').trim();
        out += label && label !== target ? `[[${target}|${label}]]` : `[[${target}]]`;
      }
      else if (tag === 'INPUT' || node.classList.contains('nh-imgcap')) { /* handled by block parent */ }
      else out += inlineMd(node); // unknown inline wrappers unwrap
    }
    return out;
  }

  function listItemMd(li, depth) {
    const head = inlineMd(li, true).replace(/\s*\n\s*/g, ' ').trim();
    const nested = [...li.children].filter((n) => n.tagName === 'UL' || n.tagName === 'OL');
    const nestedMd = nested.map((n) => blockToMd(n, depth + 1)).filter(Boolean).join('\n');
    return nestedMd ? `${head}\n${nestedMd}` : head;
  }

  function blockToMd(el, depth = 0) {
    const pad = '  '.repeat(depth);
    const tag = el.tagName;
    if (tag === 'H1') return '# ' + inlineMd(el).trim();
    if (tag === 'H2') return '## ' + inlineMd(el).trim();
    if (tag === 'H3') return '### ' + inlineMd(el).trim();
    if (tag === 'HR') return '---';
    if (tag === 'PRE') {
      const codeEl = el.querySelector('code');
      return '```\n' + (codeEl ? codeEl.textContent : el.textContent).replace(/\n+$/g, '') + '\n```';
    }
    if (tag === 'BLOCKQUOTE') {
      return inlineMd(el).trim().split('\n').filter((l) => l.trim()).map((l) => '> ' + l.trim()).join('\n');
    }
    if (tag === 'UL') return [...el.children].filter((li) => li.tagName === 'LI').map((li) => `${pad}- ${listItemMd(li, depth)}`).join('\n');
    if (tag === 'OL') {
      let n = 1;
      return [...el.children].filter((li) => li.tagName === 'LI').map((li) => `${pad}${n++}. ${listItemMd(li, depth)}`).join('\n');
    }
    if (el.classList.contains('nh-task')) {
      const cb = el.querySelector('input[type="checkbox"]');
      const span = el.querySelector('span');
      return `${pad}- [${cb && cb.checked ? 'x' : ' '}] ${(span ? inlineMd(span) : inlineMd(el)).trim()}`;
    }
    if (el.classList.contains('nh-imgbox')) {
      const media = el.querySelector('[data-img-id]');
      if (!media) return '';
      const alt = media.dataset.alt ?? media.getAttribute('alt') ?? el.querySelector('.nh-imgcap')?.textContent ?? '';
      return `![${alt}](nh-img://${media.dataset.imgId})`;
    }
    return inlineMd(el); // P, DIV, and other paragraph-ish blocks
  }

  function serializeSurface() {
    const blocks = [];
    for (const child of preview.childNodes) {
      if (child.nodeType === 3) {
        const t = child.textContent.replace(/\u00a0/g, ' ');
        if (t.trim()) blocks.push(t.trim());
      } else if (child.nodeType === 1) {
        blocks.push(blockToMd(child, 0));
      }
    }
    return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /** Read the surface, sync state.current.content and schedule a save. */
  function commitSurface(opts = {}) {
    if (!state.current) return;
    const md = serializeSurface();
    if (md !== state.current.content) {
      state.current.content = md;
      setSaveState(true, 'Saving…');
      if (opts.saveNow) { saveNoteSoon.flush(); void doSaveNote(); }
      else saveNoteSoon();
    }
    renderStatus();
  }

  /* ==================================================== */
  /* Notes — loading / saving                              */
  /* ==================================================== */

  function setSaveState(busy, label) {
    saveStateEl.classList.toggle('busy', busy);
    saveTextEl.textContent = label;
  }

  const saveNoteSoon = debounce(doSaveNote, 900);

  async function doSaveNote() {
    if (!state.current) return;
    setSaveState(true, 'Saving…');
    try {
      const { index } = await rpc('save_note', {
        id: state.current.id,
        title: state.current.title,
        content: state.current.content,
      });
      state.index = index;
      renderList();
      renderStatus();
      setSaveState(false, `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      setSaveState(true, 'Save failed');
      toast('error', err.message || 'Could not save note');
    }
  }

  async function openNote(id) {
    saveNoteSoon.flush(); // make sure the previous note is persisted first
    try {
      const { note } = await rpc('get_note', { id });
      if (!note) return;
      if (floatNoteId === id) closeFloatNote(); // one editor per note — the modal takes over
      state.currentId = id;
      state.current = { id, title: note.title, content: note.content };
      titleInput.value = note.title;
      renderList(); refreshPinBtn(); renderStatus(); renderPreview();
      applyMode(state.settings.editor.mode);
    } catch (err) {
      toast('error', err.message || 'Could not open note');
    }
  }

  async function createNote(title = '') {
    try {
      // land new notes in the folder you're currently browsing
      const folderId = (state.view !== 'all' && state.view !== 'inbox') ? state.view : null;
      const res = await rpc('create_note', { title, folderId });
      state.index = res.index;
      renderList();
      return res.note;
    } catch (err) { toast('error', err.message || 'Could not create note'); return null; }
  }

  async function deleteNote(id) {
    try {
      const { index } = await rpc('delete_note', { id });
      state.index = index;
      toast('info', 'Note deleted');
      if (state.currentId === id) {
        state.current = null; state.currentId = null;
        const next = state.index.notes[0];
        if (next) await openNote(next.id);
        else { titleInput.value = ''; preview.innerHTML = ''; const n = await createNote(); if (n) await openNote(n.id); }
      }
      renderList();
    } catch (err) { toast('error', err.message || 'Could not delete note'); }
  }

  /* ---------------- editor events ---------------- */

  preview.addEventListener('input', () => commitSurface());

  preview.addEventListener('paste', (e) => {
    if (preview.getAttribute('contenteditable') !== 'true') { e.preventDefault(); return; }
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData)?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  });

  preview.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); exec('bold'); }
    else if (k === 'i') { e.preventDefault(); exec('italic'); }
  });

  titleInput.addEventListener('input', () => {
    if (!state.current) return;
    state.current.title = titleInput.value;
    const meta = metaOf(state.currentId);
    if (meta) { meta.title = titleInput.value || 'Untitled Note'; renderList(); }
    setSaveState(true, 'Saving…');
    saveNoteSoon();
  });

  searchInput.addEventListener('input', () => { state.search = searchInput.value; renderList(); });
  newBtn.addEventListener('click', async () => {
    const note = await createNote();
    if (note) { await openNote(note.id); setTimeout(() => { titleInput.focus(); titleInput.select(); }, 80); }
  });

  pinBtn.addEventListener('click', async () => {
    const meta = metaOf(state.currentId);
    if (!meta) return;
    const rect = pinBtn.getBoundingClientRect();
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: Math.max(12, rect.left - 150), y: rect.bottom + 6 },
      items: [
        { key: 'top', label: meta.pinned ? '📌 Unpin from list top' : '📌 Pin to top of the list', active: !!meta.pinned },
        { key: 'float', label: '🪟 Pin on screen — mini window (multitask!)' },
      ],
    });
    if (selectedKey === 'top') {
      await rpc('set_meta', { id: meta.id, pinned: !meta.pinned });
      meta.pinned = !meta.pinned;
      renderList(); refreshPinBtn();
    } else if (selectedKey === 'float') floatNote(meta);
  });

  let delArmed = null;
  delBtn.addEventListener('click', () => {
    const id = state.currentId;
    if (!id) return;
    if (!delArmed) {
      delBtn.classList.add('confirm');
      delBtn.innerHTML = 'Sure?';
      delArmed = setTimeout(() => { delBtn.classList.remove('confirm'); delBtn.innerHTML = ICONS.trash; delArmed = null; }, 2600);
    } else {
      clearTimeout(delArmed); delArmed = null;
      delBtn.classList.remove('confirm'); delBtn.innerHTML = ICONS.trash;
      deleteNote(id);
    }
  });

  function applyMode(mode) {
    if (!['write', 'read'].includes(mode)) mode = 'write';
    state.settings.editor.mode = mode;
    canvas.classList.remove('nh-mode-write', 'nh-mode-read');
    canvas.classList.add(`nh-mode-${mode}`);
    modeBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.mode === mode));
    preview.setAttribute('contenteditable', mode === 'write' ? 'true' : 'false');
    toolbar.style.display = mode === 'read' ? 'none' : '';
    saveSettingsSoon();
  }
  modeBtns.forEach((b) => b.addEventListener('click', () => applyMode(b.dataset.mode)));

  /* ---------------- export / import ---------------- */

  async function noteFullWithImages(meta) {
    const { note } = await rpc('get_note', { id: meta.id });
    if (!note) throw new Error('That note could not be read');
    const images = {};
    for (const imgId of meta.imageIds || []) {
      let durl = state.imageCache.get(imgId);
      if (!durl) {
        try { const r = await rpc('get_image', { imageId: imgId }); durl = r.dataUrl; } catch (_) { /* skip */ }
      }
      if (durl) images[imgId] = durl;
    }
    return { note, images };
  }

  async function exportNoteMarkdown(meta) {
    try {
      const { note } = await rpc('get_note', { id: meta.id });
      if (!note) throw new Error('That note could not be read');
      downloadText(safeFilename(meta.title, 'md'), `# ${note.title}\n\n${note.content}`, 'text/markdown');
      toast('success', 'Note exported as Markdown');
    } catch (err) { toast('error', err.message); }
  }

  async function exportNoteJson(meta) {
    try {
      const { note, images } = await noteFullWithImages(meta);
      const data = {
        app: 'notehaven', kind: 'notehaven_backup', version: 1,
        exportedAt: new Date().toISOString(),
        notes: [{ ...meta, content: note.content, createdAt: note.createdAt }],
        images,
      };
      downloadText(safeFilename(meta.title, 'json'), JSON.stringify(data, null, 2), 'application/json');
      toast('success', 'Note exported (.json with images)');
    } catch (err) { toast('error', err.message); }
  }

  async function exportAll() {
    try {
      const { data } = await rpc('export_all', {}, 60000);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadText(`notehaven-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast('success', `Exported ${data.notes.length} note(s)`);
    } catch (err) { toast('error', err.message); }
  }

  const CODE_FILE_EXTS = ['toml', 'yaml', 'yml', 'csv', 'ini', 'log', 'cfg', 'conf', 'sh', 'bat', 'py', 'js', 'ts', 'html', 'xml', 'css', 'sql', 'env', 'txt2'];

  async function importCodeNote(filename, ext, text) {
    const title = filename.replace(/\.[a-z0-9]+$/i, '').slice(0, 120) || 'Imported file';
    const lang = ext || 'text';
    const content = '```' + lang + '\n' + text.replace(/\n{3,}/g, '\n\n').trim() + '\n```';
    const res = await rpc('create_note', { title, content });
    state.index = res.index;
    await openNote(res.note.id);
    toast('success', `Imported ${filename} as a code note`);
  }

  async function importFlow() {
    try {
      const files = await ctx.uploads.pickFile({
        accept: ['.md', '.markdown', '.txt', '.json', '.toml', '.yaml', '.yml', '.csv', '.ini', '.log', '.docx',
          'application/json', 'text/markdown', 'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: false,
        maxSizeBytes: 25 * 1024 * 1024,
      });
      const file = files[0];
      if (!file) return;
      const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

      // --- Word documents: real text extraction from the OOXML zip
      if (ext === 'docx' || file.mimeType.includes('wordprocessingml')) {
        const text = await extractDocxText(file.bytes);
        const res = await rpc('create_note', {
          title: file.name.replace(/\.docx$/i, '').slice(0, 120),
          content: text || '(that document appears to be empty)',
        });
        state.index = res.index;
        await openNote(res.note.id);
        toast('success', 'Word document imported 📄');
        return;
      }

      const text = new TextDecoder().decode(file.bytes);

      // --- JSON: Notehaven backup if valid, otherwise a code note
      if (ext === 'json' || file.mimeType === 'application/json') {
        let data = null;
        try { data = JSON.parse(text); } catch (_) { /* fall through to code note */ }
        if (data && (data.kind === 'notehaven_backup' || data.app === 'notehaven')) {
          const res = await rpc('import_data', { data }, 60000);
          state.index = res.index;
          renderList();
          const extras = [res.images ? `${res.images} image(s)` : '', res.folders ? `${res.folders} folder(s)` : ''].filter(Boolean).join(' · ');
          toast('success', `Imported ${res.imported} note(s)${extras ? ` · ${extras}` : ''}`);
        } else {
          await importCodeNote(file.name, 'json', text);
        }
        return;
      }

      // --- Markdown & friends: a leading "# Heading" becomes the title
      if (['md', 'markdown', 'txt'].includes(ext) || file.mimeType === 'text/markdown') {
        const h1 = text.match(/^\s*#\s+(.+)$/m);
        const title = (h1 ? h1[1].trim() : file.name.replace(/\.(md|markdown|txt)$/i, '')).slice(0, 120);
        const content = h1 ? text.replace(/^\s*#\s+[^\n]*\n?/, '') : text;
        const res = await rpc('create_note', { title, content });
        state.index = res.index;
        await openNote(res.note.id);
        toast('success', 'Note imported');
        return;
      }

      // --- Everything else (.toml, .yaml, .csv, etc.): wrapped in a code fence
      await importCodeNote(file.name, CODE_FILE_EXTS.includes(ext) ? ext : 'text', text);
    } catch (err) {
      if (err && !/cancel|abort/i.test(err.message || '')) toast('error', err.message || 'Import failed');
    }
  }

  moreBtn.addEventListener('click', async () => {
    const meta = metaOf(state.currentId);
    const items = [];
    if (meta) {
      items.push({ key: 'exp-md', label: '⬇ Export this note (.md)' });
      items.push({ key: 'exp-json', label: '⬇ Export this note (.json, with images)' });
    }
    items.push({ key: 'exp-all', label: '🗄 Export ALL notes (backup .json)' });
    items.push({ key: 'd1', label: '', type: 'divider' });
    items.push({ key: 'import', label: '⬆ Import notes (.md / .json)…' });
    const rect = moreBtn.getBoundingClientRect();
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: Math.max(12, rect.right - 250), y: rect.bottom + 8 },
      items,
    });
    if (selectedKey === 'exp-md' && meta) exportNoteMarkdown(meta);
    else if (selectedKey === 'exp-json' && meta) exportNoteJson(meta);
    else if (selectedKey === 'exp-all') exportAll();
    else if (selectedKey === 'import') importFlow();
  });

  /* ---------------- toolbar (live surface) ---------------- */

  function saveSel() {
    const s = window.getSelection();
    return s && s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
  }

  function restoreSel(range) {
    if (!range) return;
    const s = window.getSelection();
    s.removeAllRanges();
    try { s.addRange(range); } catch (_) { /* range went stale — fine */ }
  }

  function exec(cmd, arg) {
    preview.focus();
    document.execCommand(cmd, false, arg);
    commitSurface();
  }

  function insertHtml(html) {
    preview.focus();
    document.execCommand('insertHTML', false, html);
    commitSurface();
  }

  function wrapSelectedInline(openTag, closeTag, placeholder = 'text') {
    const t = (window.getSelection()?.toString() || '') || placeholder;
    insertHtml(`${openTag}${escapeHtml(t)}${closeTag}`);
  }

  const tb = (label, title, fn) => {
    const b = document.createElement('button');
    b.className = 'nh-iconbtn';
    b.innerHTML = label;
    b.title = title;
    b.addEventListener('click', fn);
    toolbar.appendChild(b);
  };
  const sep = () => { const s = document.createElement('span'); s.className = 'nh-sep'; toolbar.appendChild(s); };

  tb('<strong>B</strong>', 'Bold (Ctrl+B)', () => exec('bold'));
  tb('<em>I</em>', 'Italic (Ctrl+I)', () => exec('italic'));
  tb('<s>S</s>', 'Strikethrough', () => exec('strikeThrough'));
  tb('<span style="font-size:12px;font-weight:700">H</span>', 'Heading', () => exec('formatBlock', 'h2'));
  sep();
  tb('•≡', 'Bulleted list', () => exec('insertUnorderedList'));
  tb('☑', 'Checklist', () => insertHtml('<div class="nh-task"><input type="checkbox"><span>to do</span></div>'));
  tb('❝', 'Quote', () => exec('formatBlock', 'blockquote'));
  tb('<span style="font-family:monospace;font-size:12px">&lt;/&gt;</span>', 'Inline code', () => wrapSelectedInline('<code>', '</code>', 'code'));
  tb('—', 'Divider', () => exec('insertHorizontalRule'));
  sep();
  tb('🔗', 'Wiki link [[Note]]', () => {
    const t = ((window.getSelection()?.toString() || '').trim()) || 'Note title';
    insertHtml(`<span class="nh-wikilink" contenteditable="false" data-nh-link="${escapeHtml(t)}">${escapeHtml(t)}</span>&nbsp;`);
  });
  tb(ICONS.image, 'Insert image / GIF / video / audio… (png, gif, mp4, webm, mp3, wav, ogg…)', () => insertImageFlow());

  /* ---------------- one picker for images, gifs, videos & audio ---------------- */

  // Big files go in CHUNKS — one giant base64 message gets silently dropped by
  // the frontend↔backend bridge (that was the put_image timeout of doom 💀)
  async function uploadMedia(name, dataUrl, { logo = false } = {}) {
    if (dataUrl.length <= 400 * 1024) { // small enough for a single message
      if (logo) { await rpc('put_logo', { dataUrl }, 30000); return { ok: true }; }
      return rpc('put_image', { name, dataUrl }, 30000);
    }
    const CHUNK = 320 * 1024; // ~240KB of binary per message — well under any cap
    const parts = Math.ceil(dataUrl.length / CHUNK);
    const { imageId } = await rpc('begin_upload', { name, parts }, 20000);
    try {
      // three lanes at once — uploads feel 3x quicker than one-by-one 🏎
      let cursor = 0, done = 0;
      const lanes = [];
      for (let lane = 0; lane < Math.min(3, parts); lane++) {
        lanes.push((async () => {
          for (let i = cursor++; i < parts; i = cursor++) {
            await rpc('put_upload_part', { imageId, index: i, data: dataUrl.slice(i * CHUNK, (i + 1) * CHUNK) }, 30000);
            if (parts > 4 && ++done % 3 === 1) toast('info', `Uploading… ${Math.round((done / parts) * 100)}%`);
          }
        })());
      }
      await Promise.all(lanes);
      return await rpc('commit_upload', { imageId, name, logo }, 45000);
    } catch (err) {
      rpc('abort_upload', { imageId }).catch(() => {});
      throw err;
    }
  }

  async function insertImageFlow() {
    if (!state.current) return;
    if (state.settings.editor.mode !== 'write') { toast('info', 'Switch to ✍ Write to add images & media'); return; }
    const savedRange = saveSel(); // the file picker steals focus — park the caret
    try {
      const files = await ctx.uploads.pickFile({
        accept: MEDIA_PICK_ACCEPT,
        multiple: false,
        maxSizeBytes: 16 * 1024 * 1024, // base64 inflates ~33% — stays under the storage guard
      });
      const file = files[0];
      if (!file) return;
      // extension-aware: mp3/wav *actually* get recognised even if the picker
      // hands us an empty or application/octet-stream mime type
      const mime = fileMime(file);
      const kind = mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'image';
      // static images get a slimming session; GIFs & media keep raw bytes (canvas freezes animations)
      let dataUrl = null;
      if (kind === 'image' && !/gif|apng/.test(mime)) dataUrl = await downscaleImage(file, 1600);
      if (!dataUrl) dataUrl = bytesToDataUrl(file.bytes, mime);
      if (kind === 'video' && !/mp4|webm|quicktime|x-m4v/.test(mime)) {
        toast('info', 'This video format may not play in the browser — it’s stored either way 📼');
      }
      const { imageId, name } = await uploadMedia(file.name, dataUrl);
      const alt = name.replace(/\.[a-z0-9]+$/i, '');
      state.imageCache.set(imageId, dataUrl);
      restoreSel(savedRange);
      const inner = kind === 'video'
        ? `<video data-img-id="${imageId}" data-alt="${escapeHtml(alt)}" data-done="1" src="${dataUrl}" controls playsinline preload="metadata"></video>`
        : kind === 'audio'
          ? `<audio data-img-id="${imageId}" data-alt="${escapeHtml(alt)}" data-done="1" src="${dataUrl}" controls preload="metadata"></audio>`
          : `<img data-img-id="${imageId}" data-done="1" src="${dataUrl}" alt="${escapeHtml(alt)}">`;
      insertHtml(
        `<div class="nh-imgbox" data-img-id="${imageId}" contenteditable="false">` +
        inner + `<div class="nh-imgcap">${escapeHtml(alt)}</div></div><p><br></p>`,
      );
      setSaveState(true, 'Saving…');
      saveNoteSoon.flush();
      await doSaveNote();
      toast('success', `${kind === 'video' ? '🎬 Video' : kind === 'audio' ? '🎧 Audio' : '🖼 Image'} added to note`);
    } catch (err) {
      if (err && !/cancel|abort/i.test(err.message || '')) toast('error', err.message || 'Upload failed (max ~16 MB)');
    }
  }

  // right-click any embedded media box (images, GIFs, videos, audio) → remove it
  preview.addEventListener('contextmenu', (e) => {
    const box = e.target.closest('.nh-imgbox');
    if (!box || !state.current) return;
    e.preventDefault();
    (async () => {
      const { selectedKey } = await ctx.ui.showContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: [{ key: 'remove', label: '✂️ Remove media from note', danger: true }],
      });
      if (selectedKey === 'remove') {
        box.remove();
        setSaveState(true, 'Saving…');
        commitSurface({ saveNow: true }); // server garbage-collects the file
      }
    })();
  });

  preview.addEventListener('click', async (e) => {
    // wiki links
    const link = e.target.closest('.nh-wikilink');
    if (link) {
      const title = link.dataset.nhLink;
      const meta = state.index.notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
      if (meta) openNote(meta.id);
      else { const n = await createNote(title); if (n) { await openNote(n.id); toast('info', `Created “${title}”`); } }
      return;
    }
    // task checkboxes — the DOM already flipped; just re-serialize
    const task = e.target.closest('.nh-task');
    if (task && state.current) {
      commitSurface();
      return;
    }
    // images → context menu / zoom
    const img = e.target.closest('img[data-img-id]');
    if (img) {
      const { selectedKey } = await ctx.ui.showContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: [
          { key: 'zoom', label: '🔍 View full size' },
          { key: 'remove', label: '✂️ Remove from note', danger: true },
        ],
      });
      if (selectedKey === 'zoom') {
        const overlayLb = document.createElement('div');
        overlayLb.className = 'nh-lightbox';
        const big = document.createElement('img');
        big.src = img.src;
        overlayLb.appendChild(big);
        overlayLb.addEventListener('click', () => overlayLb.remove());
        document.body.appendChild(overlayLb);
      } else if (selectedKey === 'remove' && state.current) {
        const box = img.closest('.nh-imgbox');
        if (box) box.remove(); else img.remove();
        setSaveState(true, 'Saving…');
        commitSurface({ saveNow: true }); // server garbage-collects the image file
      }
    }
  });

  /* ==================================================== */
  /* Halo controls — live inside Notehaven Settings now    */
  /* (no separate drawer tab: everything in one place)     */
  /* ==================================================== */

  const haloRoot = document.createElement('div');
  haloRoot.className = 'nh-root nh-halo-root';
  haloRoot.innerHTML = `
    <div class="nh-permwarn nh-permwarn-el" style="display:none">
      <strong>✨ One more step…</strong>
      <span>The floating logo needs the <b>ui_panels</b> permission. Grant it to Notehaven in the Extensions panel, then come back here.</span>
      <button class="nh-btn primary nh-open-ext" style="align-self:flex-start">Open Extensions settings</button>
    </div>
    <div class="nh-card">
      <h3>Halo — your floating logo ✨</h3>
      <div class="nh-sub">It lives right here now — click it in chat to open your notes, drag it anywhere, Ctrl+scroll to resize. Animated GIFs welcome!</div>
      <div class="nh-logo-preview"><img alt="Halo logo preview"></div>
      <div class="nh-btnrow" style="justify-content:center">
        <button class="nh-btn primary nh-upload">${ICONS.upload} Upload logo</button>
        <button class="nh-btn nh-resetlogo">${ICONS.reset} Reset</button>
      </div>
    </div>
    <div class="nh-card">
      <h3>Comfort controls</h3>
      <div class="nh-sub">Tune the logo exactly how you like it — everything saves automatically.</div>
      <div class="nh-field">
        <div><label>Size</label><div class="nh-desc">From a shy 24px to a proud 256px.</div></div>
        <div class="nh-slider"><input type="range" min="24" max="256" step="2"><output>64px</output></div>
      </div>
      <div class="nh-field">
        <div><label>Show in chat</label><div class="nh-desc">Hide it without losing your setup.</div></div>
        <span class="nh-switch"><input type="checkbox" class="nh-visible"><span class="nh-track"></span></span>
      </div>
      <div class="nh-field">
        <div><label>Snap to edge</label><div class="nh-desc">Magnetically docks after you drag it.</div></div>
        <span class="nh-switch"><input type="checkbox" class="nh-snap"><span class="nh-track"></span></span>
      </div>
      <div class="nh-field">
        <div><label>Position</label><div class="nh-desc nh-posread">x: —, y: —</div></div>
        <button class="nh-btn nh-resetpos">${ICONS.reset} Reset spot</button>
      </div>
    </div>
    <div class="nh-card">
      <h3>Little tricks</h3>
      <div class="nh-sub" style="margin-bottom:0">
        👆 <b>Click / tap</b> the logo to pop your notes open.<br>
        🖱 <b>Drag</b> it anywhere on your chat.<br>
        ⌨️ <b>Ctrl+scroll</b> on it to resize on PC (slider & presets above work too).<br>
        🖱 <b>Right-click</b> — or <b>long-press</b> on phones — for size presets and a quick hide.
      </div>
    </div>`;

  const haloPreviewImg = haloRoot.querySelector('.nh-logo-preview img');
  const sizeRange = haloRoot.querySelector('input[type=range]');
  const sizeOut = haloRoot.querySelector('.nh-slider output');
  const visibleSwitch = haloRoot.querySelector('.nh-visible');
  const snapSwitch = haloRoot.querySelector('.nh-snap');
  const posRead = haloRoot.querySelector('.nh-posread');
  const permWarn = haloRoot.querySelector('.nh-permwarn-el');

  haloRoot.querySelector('.nh-open-ext').addEventListener('click', () => {
    ctx.events.emit('open-settings', { view: 'extensions' });
  });

  /* ==================================================== */
  /* Halo widget — the floating logo                       */
  /* ==================================================== */

  let haloWidget = null;
  let haloImgEl = null;
  let unsubDragEnd = null;
  let haloPermissionMissing = false;

  function haloDefaultPos() {
    const size = state.settings.logo.size;
    return {
      x: Math.max(16, (window.innerWidth || 1280) - size - 40),
      y: Math.max(16, (window.innerHeight || 800) - size - 48),
    };
  }

  function haloPos() {
    const { logo } = state.settings;
    const d = haloDefaultPos();
    return {
      x: Number.isFinite(logo.x) ? logo.x : d.x,
      y: Number.isFinite(logo.y) ? logo.y : d.y,
    };
  }

  function syncHaloTab() {
    const { logo } = state.settings;
    sizeRange.value = String(logo.size);
    sizeOut.textContent = `${logo.size}px`;
    visibleSwitch.checked = logo.visible;
    snapSwitch.checked = logo.snapToEdge;
    haloPreviewImg.src = state.logoSrc;
    const p = haloPos();
    posRead.textContent = `x: ${Math.round(p.x)}, y: ${Math.round(p.y)}`;
    permWarn.style.display = haloPermissionMissing ? '' : 'none';
  }

  function destroyHalo() {
    if (unsubDragEnd) { unsubDragEnd(); unsubDragEnd = null; }
    if (haloWidget) { haloWidget.destroy(); haloWidget = null; haloImgEl = null; }
  }

  function createHalo() {
    destroyHalo();
    const { logo } = state.settings;
    const pos = haloPos();
    try {
      haloWidget = ctx.ui.createFloatWidget({
        width: logo.size,
        height: logo.size,
        initialPosition: pos,
        snapToEdge: logo.snapToEdge,
        tooltip: 'Notehaven Halo — click to open · drag to move · Ctrl+scroll resizes · right-click for menu',
        chromeless: true,
      });
      haloPermissionMissing = false;
    } catch (err) {
      haloPermissionMissing = true;
      haloWidget = null;
      syncHaloTab();
      return;
    }

    const el = document.createElement('div');
    el.className = 'nh-halo';
    el.style.setProperty('--halo-size', `${logo.size}px`);
    const img = document.createElement('img');
    img.src = state.logoSrc;
    img.alt = 'Halo';
    img.draggable = false;
    el.appendChild(img);
    haloWidget.root.appendChild(el);
    haloImgEl = img;

    haloWidget.setVisible(logo.visible);
    unsubDragEnd = haloWidget.onDragEnd((p) => {
      state.settings.logo.x = p.x;
      state.settings.logo.y = p.y;
      posRead.textContent = `x: ${Math.round(p.x)}, y: ${Math.round(p.y)}`;
      saveSettingsSoon();
    });

    // --- open-note triggers: several paths, all funneled into one deduped
    // open, because host drag handlers MAY capture/retarget pointer events
    // (that is what silently eats clicks on some setups)
    const openFromHalo = () => {
      if (Date.now() - (state.haloResizeAt || 0) < 500) return; // just finished resizing
      if (Date.now() - state.lastLPAt < 600) return; // long-press menu owns this gesture
      const now = Date.now();
      if (now - (state.lastHaloOpenAt || 0) < 450) return; // dedupe tap+click double-fire
      state.lastHaloOpenAt = now;
      openModal();
    };
    for (const t of [...new Set([el, haloWidget?.root].filter(Boolean))]) {
      addTapListener(t, openFromHalo); // classic small-move tap
      let pdown = null;
      t.addEventListener('pointerdown', (e) => { pdown = { x: e.clientX, y: e.clientY }; }, { passive: true });
      t.addEventListener('click', (e) => { // fallback: fires even if pointerup got retargeted
        if (pdown && Math.hypot(e.clientX - pdown.x, e.clientY - pdown.y) >= 8) return; // that was a drag
        openFromHalo();
      });
    }

    // --- PC resize: Ctrl+scroll right on the logo (plus slider & presets in Settings)
    el.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setLogoSize(state.settings.logo.size + (e.deltaY < 0 ? 8 : -8));
    }, { passive: false });

    // long-press opens the menu on touch screens (right-click covers desktops)
    addLongPress(el, (pt) => {
      state.lastLPAt = Date.now();
      haloContextMenu(pt.x, pt.y);
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (Date.now() - state.lastLPAt < 900) return; // already opened by long-press
      haloContextMenu(e.clientX, e.clientY);
    });
    syncHaloTab();
  }

  async function haloContextMenu(x, y) {
    const { logo } = state.settings;
    const sizeLabel = (px) => `${logo.size === px ? '● ' : ''}${px}px`;
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x, y },
      items: [
        { key: 'size:40', label: `Small — ${sizeLabel(40)}`, active: logo.size === 40 },
        { key: 'size:64', label: `Medium — ${sizeLabel(64)}`, active: logo.size === 64 },
        { key: 'size:104', label: `Large — ${sizeLabel(104)}`, active: logo.size === 104 },
        { key: 'size:160', label: `Giant — ${sizeLabel(160)}`, active: logo.size === 160 },
        { key: 'd1', label: '', type: 'divider' },
        { key: 'snap', label: '🧲 Snap to edge', active: logo.snapToEdge },
        { key: 'visibility', label: logo.visible ? '🙈 Hide logo' : '✨ Show logo' },
        { key: 'd2', label: '', type: 'divider' },
        { key: 'reset', label: '📍 Reset position' },
        { key: 'open', label: '📓 Open Notehaven' },
      ],
    });
    if (!selectedKey) return;
    if (selectedKey.startsWith('size:')) setLogoSize(Number(selectedKey.slice(5)));
    else if (selectedKey === 'snap') { state.settings.logo.snapToEdge = !logo.snapToEdge; saveSettingsSoon(); createHalo(); }
    else if (selectedKey === 'visibility') setHaloVisible(!logo.visible);
    else if (selectedKey === 'reset') resetHaloPosition();
    else if (selectedKey === 'open') openModal();
  }

  const recreateHaloSoon = debounce(() => createHalo(), 320);

  function setLogoSize(px) {
    state.settings.logo.size = Math.min(256, Math.max(24, px));
    sizeRange.value = String(state.settings.logo.size);
    sizeOut.textContent = `${state.settings.logo.size}px`;
    saveSettingsSoon();
    recreateHaloSoon();
  }

  function setHaloVisible(v) {
    state.settings.logo.visible = v;
    visibleSwitch.checked = v;
    if (haloWidget) haloWidget.setVisible(v);
    saveSettingsSoon();
    syncInputBarLabel();
  }

  function resetHaloPosition() {
    state.settings.logo.x = null;
    state.settings.logo.y = null;
    const d = haloDefaultPos();
    if (haloWidget) haloWidget.moveTo(d.x, d.y);
    posRead.textContent = `x: ${Math.round(d.x)}, y: ${Math.round(d.y)}`;
    saveSettingsSoon();
  }

  /* ---------------- halo tab events ---------------- */

  sizeRange.addEventListener('input', () => setLogoSize(Number(sizeRange.value)));
  visibleSwitch.addEventListener('change', () => setHaloVisible(visibleSwitch.checked));
  snapSwitch.addEventListener('change', () => {
    state.settings.logo.snapToEdge = snapSwitch.checked;
    saveSettingsSoon();
    createHalo();
  });
  haloRoot.querySelector('.nh-resetpos').addEventListener('click', resetHaloPosition);

  haloRoot.querySelector('.nh-upload').addEventListener('click', async () => {
    try {
      const files = await ctx.uploads.pickFile({
        accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
        multiple: false,
        maxSizeBytes: 4 * 1024 * 1024,
      });
      const file = files[0];
      if (!file) return;
      const logoMime = fileMime(file);
      // GIFs keep their animation (canvas downscale would freeze them)
      const dataUrl = (file.mimeType || '').includes('gif')
        ? bytesToDataUrl(file.bytes, 'image/gif')
        : await downscaleImage(file, 512);
      if (!dataUrl) { toast('error', 'Could not read that image'); return; }
      await uploadMedia(file.name, dataUrl, { logo: true });
      state.logoSrc = dataUrl;
      if (haloImgEl) haloImgEl.src = dataUrl;
      haloPreviewImg.src = dataUrl;
      toast('success', 'New Halo logo set ✨');
    } catch (err) {
      if (err && !/cancel|abort/i.test(err.message || '')) toast('error', err.message || 'Logo upload failed');
    }
  });

  haloRoot.querySelector('.nh-resetlogo').addEventListener('click', async () => {
    try {
      await rpc('put_logo', { dataUrl: '' });
      state.logoSrc = defaultLogoDataUrl();
      if (haloImgEl) haloImgEl.src = state.logoSrc;
      haloPreviewImg.src = state.logoSrc;
      toast('info', 'Halo logo reset to default');
    } catch (err) { toast('error', err.message || 'Could not reset logo'); }
  });

  /* ==================================================== */
  /* Settings panel — appearance / themes                  */
  /* ==================================================== */

  const settingsWrap = ctx.dom.inject('body', `
    <div class="nh-overlay nh-settings-overlay">
      <div class="nh-modal nh-spanel" role="dialog" aria-label="Notehaven settings">
        <div class="nh-mhead">
          <span class="nh-mtitle">${ICONS.gear} <span class="nh-mt-text">Settings</span></span>
          <span style="flex:1"></span>
          <button class="nh-mclose nh-sc-close" title="Close">✕</button>
        </div>
          <div class="nh-sbody nh-scroll">
          <!-- Halo controls are prepended here (they used to be a separate tab) -->
          <div class="nh-card">
            <h3>Appearance</h3>
            <div class="nh-sub">Your look, your rules — everything applies live and saves automatically.</div>
            <div class="nh-field">
              <div><label>Theme</label><div class="nh-desc">Auto follows your Lumiverse look. Tip: the ☀️/🌙 button in the notes header flips it instantly.</div></div>
              <select class="nh-sel nh-ui-theme">
                <option value="auto">Auto</option>
                <option value="dark">Dark 🌙</option>
                <option value="light">Light ☀️</option>
              </select>
            </div>
            <div class="nh-field">
              <div><label>Accent color</label><div class="nh-desc">Buttons, pills and glow inside Notehaven.</div></div>
              <span class="nh-colorwrap"><input type="color" class="nh-color nh-ui-accent" value="#b28cff"><button class="nh-btn nh-ui-accent-reset">Auto</button></span>
            </div>
            <div class="nh-field">
              <div><label>Window opacity</label><div class="nh-desc">Make the notes window dreamy and see-through.</div></div>
              <div class="nh-slider"><input type="range" class="nh-ui-opacity" min="0.55" max="1" step="0.01"><output></output></div>
            </div>
            <div class="nh-field">
              <div><label>Backdrop dim</label></div>
              <div class="nh-slider"><input type="range" class="nh-ui-dim" min="0" max="0.9" step="0.05"><output></output></div>
            </div>
            <div class="nh-field">
              <div><label>Backdrop blur</label></div>
              <div class="nh-slider"><input type="range" class="nh-ui-blur" min="0" max="24" step="1"><output></output></div>
            </div>
            <div class="nh-field">
              <div><label>Editor font size</label></div>
              <div class="nh-slider"><input type="range" class="nh-ui-font" min="11" max="17" step="0.5"><output></output></div>
            </div>
            <div class="nh-field">
              <div><label>Corner roundness</label></div>
              <div class="nh-slider"><input type="range" class="nh-ui-radius" min="0" max="24" step="1"><output></output></div>
            </div>
            <div class="nh-field">
              <div><label>Note rail width</label><div class="nh-desc">On PC you can also drag the rail's right edge.</div></div>
              <div class="nh-slider"><input type="range" class="nh-ui-rail" min="170" max="420" step="2"><output></output></div>
            </div>
          </div>
          <div class="nh-card">
            <h3>Custom CSS</h3>
            <div class="nh-sub">Full freedom — style anything you want. Applies instantly.</div>
            <textarea class="nh-cssbox nh-scroll" spellcheck="false" placeholder="/* anything goes — e.g. */
.nh-preview h1 { letter-spacing: .5px; }
.nh-listitem.active { box-shadow: 0 0 14px #b28cff55; }"></textarea>
          </div>
          <div class="nh-card">
            <h3>Themes</h3>
            <div class="nh-sub">Bundle everything above into a shareable theme file.</div>
            <div class="nh-themerow">
              <button class="nh-btn nh-theme-export">⬇ Export theme</button>
              <button class="nh-btn nh-theme-import">⬆ Import theme</button>
              <button class="nh-btn nh-winsize-reset">↺ Reset window size</button>
              <button class="nh-btn nh-theme-reset">↺ Reset looks</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  const settingsOverlay = settingsWrap.querySelector('.nh-settings-overlay');
  const spanelEl = settingsWrap.querySelector('.nh-spanel');
  const uiAccent = settingsWrap.querySelector('.nh-ui-accent');
  const uiTheme = settingsWrap.querySelector('.nh-ui-theme');
  // the Halo's controls live at the top of Settings — one cozy home for everything
  settingsWrap.querySelector('.nh-sbody').prepend(haloRoot);
  const uiCss = settingsWrap.querySelector('.nh-cssbox');
  const uiSliders = {
    opacity: settingsWrap.querySelector('.nh-ui-opacity'),
    dim: settingsWrap.querySelector('.nh-ui-dim'),
    blur: settingsWrap.querySelector('.nh-ui-blur'),
    font: settingsWrap.querySelector('.nh-ui-font'),
    radius: settingsWrap.querySelector('.nh-ui-radius'),
    rail: settingsWrap.querySelector('.nh-ui-rail'),
  };

  let removeUiCss = null;

  function applyUi() {
    const u = state.settings.ui;
    overlay.style.background = `rgba(9, 8, 15, ${u.backdropDim})`;
    overlay.style.backdropFilter = u.backdropBlur > 0 ? `blur(${u.backdropBlur}px)` : 'none';
    modalEl.style.opacity = String(u.modalOpacity);
    const light = u.theme === 'light';
    for (const rootEl of [modalEl, launchRoot, haloRoot, spanelEl]) {
      if (!rootEl) continue;
      rootEl.classList.toggle('nh-th-light', light);
      rootEl.style.setProperty('--nh-radius', `${u.radius}px`);
      if (u.accent) rootEl.style.setProperty('--lumiverse-accent', u.accent);
      else rootEl.style.removeProperty('--lumiverse-accent');
    }
    themeBtn.textContent = light ? '🌙' : '☀️';
    themeBtn.title = light ? 'Switch to dark theme' : 'Switch to light theme';
    if (uiTheme) uiTheme.value = u.theme || 'auto';
    modalEl.style.setProperty('--nh-editor-fs', `${u.fontSize}px`);

    // rail width — overlay mode on phones gets a viewport-capped width
    const vw = window.innerWidth || 1280;
    listWrap.style.width = vw <= 760
      ? `${Math.min(u.railWidth, Math.max(200, vw * 0.78))}px`
      : `${u.railWidth}px`;

    // modal size — only on desktop; phones keep the full-screen sheet.
    // clamp persisted sizes to TODAY's viewport (screen/zoom may have changed
    // since the size was saved) so the resize grip never falls off-screen.
    const vh = window.innerHeight || 800;
    const mw = u.modalW ? Math.min(u.modalW, Math.max(400, vw - 16)) : 0;
    const mh = u.modalH ? Math.min(u.modalH, Math.max(280, vh - 12)) : 0;
    if (u.modalW && mw !== u.modalW) state.settings.ui.modalW = mw; // self-heal bad values
    if (u.modalH && mh !== u.modalH) state.settings.ui.modalH = mh;
    modalEl.style.width = showSheet && mw ? `${mw}px` : '';
    modalEl.style.height = showSheet && mh ? `${mh}px` : '';

    if (removeUiCss) { removeUiCss(); removeUiCss = null; }
    if (u.customCSS && u.customCSS.trim()) removeUiCss = ctx.dom.addStyle(u.customCSS);
  }

  function syncSettingsInputs() {
    const u = state.settings.ui;
    uiAccent.value = u.accent || '#b28cff';
    uiTheme.value = u.theme || 'auto';
    const pairs = [
      [uiSliders.opacity, u.modalOpacity, (v) => `${Math.round(v * 100)}%`],
      [uiSliders.dim, u.backdropDim, (v) => `${Math.round(v * 100)}%`],
      [uiSliders.blur, u.backdropBlur, (v) => `${v}px`],
      [uiSliders.font, u.fontSize, (v) => `${v}px`],
      [uiSliders.radius, u.radius, (v) => `${v}px`],
      [uiSliders.rail, u.railWidth, (v) => `${v}px`],
    ];
    for (const [input, val, fmt] of pairs) {
      input.value = String(val);
      input.nextElementSibling.textContent = fmt(val);
    }
    uiCss.value = u.customCSS;
  }

  function openSettings() {
    state.settingsOpen = true;
    syncSettingsInputs();
    settingsOverlay.classList.add('nh-open');
  }

  function closeSettings() {
    state.settingsOpen = false;
    settingsOverlay.classList.remove('nh-open');
  }

  settingsBtn.addEventListener('click', openSettings);
  settingsWrap.querySelector('.nh-sc-close').addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('mousedown', (e) => { if (e.target === settingsOverlay) closeSettings(); });

  const bindSlider = (input, key, fmt) => {
    input.addEventListener('input', () => {
      const v = Number(input.value);
      state.settings.ui[key] = v;
      input.nextElementSibling.textContent = fmt(v);
      applyUi();
      saveSettingsSoon();
    });
  };
  bindSlider(uiSliders.opacity, 'modalOpacity', (v) => `${Math.round(v * 100)}%`);
  bindSlider(uiSliders.dim, 'backdropDim', (v) => `${Math.round(v * 100)}%`);
  bindSlider(uiSliders.blur, 'backdropBlur', (v) => `${v}px`);
  bindSlider(uiSliders.font, 'fontSize', (v) => `${v}px`);
  bindSlider(uiSliders.radius, 'radius', (v) => `${v}px`);
  bindSlider(uiSliders.rail, 'railWidth', (v) => `${v}px`);

  settingsWrap.querySelector('.nh-winsize-reset').addEventListener('click', () => {
    state.settings.ui.modalW = 0;
    state.settings.ui.modalH = 0;
    applyUi();
    saveSettingsSoon();
    toast('info', 'Window size reset');
  });

  uiTheme.addEventListener('change', () => {
    state.settings.ui.theme = uiTheme.value;
    applyUi();
    saveSettingsSoon();
    toast('info', `Theme: ${uiTheme.value === 'auto' ? 'following Lumiverse' : uiTheme.value}`);
  });
  uiAccent.addEventListener('input', () => {
    state.settings.ui.accent = uiAccent.value;
    applyUi();
    saveSettingsSoon();
  });
  settingsWrap.querySelector('.nh-ui-accent-reset').addEventListener('click', () => {
    state.settings.ui.accent = '';
    applyUi();
    saveSettingsSoon();
    toast('info', 'Back to the app accent');
  });

  const applyCssSoon = debounce(() => {
    state.settings.ui.customCSS = uiCss.value;
    applyUi();
    saveSettingsSoon();
  }, 500);
  uiCss.addEventListener('input', applyCssSoon);

  settingsWrap.querySelector('.nh-theme-export').addEventListener('click', () => {
    const data = { app: 'notehaven', kind: 'notehaven_theme', version: 1, exportedAt: new Date().toISOString(), ui: state.settings.ui };
    downloadText('notehaven-theme.json', JSON.stringify(data, null, 2), 'application/json');
    toast('success', 'Theme exported');
  });

  settingsWrap.querySelector('.nh-theme-import').addEventListener('click', async () => {
    try {
      const files = await ctx.uploads.pickFile({ accept: ['.json', 'application/json'], multiple: false, maxSizeBytes: 1024 * 1024 });
      const file = files[0];
      if (!file) return;
      let data;
      try { data = JSON.parse(new TextDecoder().decode(file.bytes)); } catch (_) { toast('error', 'Not valid JSON'); return; }
      const ui = data?.kind === 'notehaven_theme' ? data.ui : data?.ui;
      if (!ui || typeof ui !== 'object') { toast('error', 'Not a Notehaven theme file'); return; }
      const clean = {};
      for (const k of Object.keys(state.settings.ui)) if (k in ui) clean[k] = ui[k];
      saveSettingsSoon.flush();
      const { settings } = await rpc('save_settings', { settings: { ...state.settings, ui: { ...state.settings.ui, ...clean } } });
      state.settings = settings; // server-sanitized copy
      syncSettingsInputs();
      applyUi();
      toast('success', 'Theme applied ✨');
    } catch (err) {
      if (err && !/cancel|abort/i.test(err.message || '')) toast('error', err.message || 'Import failed');
    }
  });

  settingsWrap.querySelector('.nh-theme-reset').addEventListener('click', () => {
    state.settings.ui = { customCSS: '', accent: '', modalOpacity: 1, backdropDim: 0.6, backdropBlur: 3, fontSize: 13.5, radius: 14 };
    syncSettingsInputs();
    applyUi();
    saveSettingsSoon();
    toast('info', 'Looks reset to defaults');
  });

  /* ---------------- input bar actions ---------------- */

  const haloAction = ctx.ui.registerInputBarAction({
    id: 'toggle-halo',
    label: state.settings.logo.visible ? 'Hide Chat Logo' : 'Show Chat Logo',
    iconSvg: ICONS.spark,
  });
  disposers.push(() => haloAction.destroy());
  function syncInputBarLabel() {
    haloAction.setLabel(state.settings.logo.visible ? 'Hide Chat Logo' : 'Show Chat Logo');
  }
  disposers.push(haloAction.onClick(() => setHaloVisible(!state.settings.logo.visible)));

  const notesAction = ctx.ui.registerInputBarAction({
    id: 'open-notes',
    label: 'Open Notes',
    iconSvg: ICONS.notebook.replace('width="20" height="20"', 'width="14" height="14"'),
  });
  disposers.push(() => notesAction.destroy());
  disposers.push(notesAction.onClick(() => openModal()));

  /* ==================================================== */
  /* Boot                                                  */
  /* ==================================================== */

  (async () => {
    try {
      const [{ settings }, { index }, { dataUrl }] = await Promise.all([
        rpc('get_settings'),
        rpc('list_notes'),
        rpc('get_logo'),
      ]);
      state.settings = settings;
      // forward-compatible defaults for older saves (theme & collapsed arrive with 1.6)
      state.settings.ui = { theme: 'auto', collapsed: [], ...state.settings.ui };
      if (!Array.isArray(state.settings.ui.collapsed)) state.settings.ui.collapsed = [];
      state.index = index;
      if (dataUrl) state.logoSrc = dataUrl;

      if (!['write', 'read'].includes(state.settings.editor.mode)) state.settings.editor.mode = 'write';
      canvas.classList.add(`nh-mode-${state.settings.editor.mode}`);
      modeBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.mode === state.settings.editor.mode));
      preview.setAttribute('contenteditable', state.settings.editor.mode === 'write' ? 'true' : 'false');
      toolbar.style.display = state.settings.editor.mode === 'read' ? 'none' : '';
      applyUi();

      createHalo();
      syncInputBarLabel();
      renderList();
      refreshDrawerRecent();

      const first = [...index.notes].sort((a, b) => (b.pinned - a.pinned))[0] || index.notes[0];
      if (first) {
        // preload the first note so the modal opens instantly
        const { note } = await rpc('get_note', { id: first.id });
        if (note) {
          state.currentId = first.id;
          state.current = { id: note.id, title: note.title, content: note.content };
          titleInput.value = note.title;
          renderList(); refreshPinBtn(); renderStatus(); renderPreview();
        }
      }
      state.booted = true;
      syncHaloTab();
    } catch (err) {
      toast('error', `Notehaven failed to start: ${err?.message || err}`);
    }
  })();

  /* ---------------- teardown ---------------- */

  return () => {
    saveNoteSoon.flush();
    recreateHaloSoon.cancel();
    saveSettingsSoon.cancel();
    destroyHalo();
    disposers.forEach((d) => { try { d(); } catch (_) {} });
    if (removeUiCss) removeUiCss();
    ctx.dom.uninject(settingsWrap);
    ctx.dom.uninject(overlayWrap);
    removeStyle();
    ctx.dom.cleanup();
  };
}
