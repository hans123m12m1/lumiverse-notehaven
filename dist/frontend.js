/**
 * Notehaven — frontend module (Spindle / Lumiverse)
 *
 *  • Notes live in a big comfy MODAL: note rail on the left, editor on the
 *    right (the drawer "Notes" tab is a launcher with recent notes).
 *  • Halo drawer tab — upload a chat logo, resize it, show/hide it, and
 *    watch it float over your chat (drag it anywhere, right-click for more).
 *
 * Rendering happens directly in host-provided placement roots
 * (ctx.ui.registerDrawerTab / input-bar actions) plus one free-tier
 * ctx.dom.inject() wrapper for the modal overlay.
 */

/* ================================================================ */
/* 1. Styles                                                         */
/* ================================================================ */

const NH_CSS = `
  .nh-root, .nh-modal {
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

  .nh-root *, .nh-modal * { box-sizing: border-box; }

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
  /* 2.5.5 — clear backdrop: see AND touch the chat behind the notes window */
  .nh-overlay.nh-clearbg { pointer-events: none; }
  .nh-overlay.nh-clearbg .nh-modal { pointer-events: auto; }
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
  .nh-iconbtn svg { width: 17px; height: 17px; display: block; } /* 2.5.1 — real icons sit naturally in 30px buttons */
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
  .nh-modebtn { border: 0; background: transparent; color: var(--nh-muted); font-size: 11.5px; font-weight: 650; padding: 4px 11px; border-radius: 999px; cursor: pointer; transition: all .13s; display: inline-flex; align-items: center; gap: 4.5px; }
  .nh-modebtn svg { width: 12.5px; height: 12.5px; display: block; }
  .nh-mclose svg { width: 15px; height: 15px; display: block; } /* 2.5.2 vector close */
  .nh-modebtn:hover { color: var(--nh-text); }
  .nh-modebtn.is-active { background: var(--nh-accent); color: #1a1526; }

  .nh-toolbar {
    display: flex; align-items: center; gap: 2px; flex: 0 0 auto; flex-wrap: wrap;
    border-bottom: 1px dashed var(--nh-border); margin: 0 14px; padding: 2px 0 8px;
  }
  .nh-toolbar .nh-sep { width: 1px; height: 18px; background: var(--nh-border); margin: 0 5px; flex: 0 0 auto; }

  .nh-canvas { flex: 1; display: flex; min-height: 0; }
  .nh-surfacewrap { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; }
  .nh-preview { flex: 0 0 auto; padding: 14px 20px 44px; font-size: var(--nh-editor-fs, 13.5px); }
  .nh-preview:empty::before { content: 'Start writing… ✍️ images, [[links]] and ☑ checklists all render live as you type'; color: var(--nh-muted); font-size: 12.5px; }
  .nh-editor-surface { min-height: 100%; outline: none; -webkit-tap-highlight-color: transparent; }
  .nh-editor-surface[contenteditable="true"] { cursor: text; caret-color: var(--nh-accent); }
  .nh-editor-surface[contenteditable="false"] { cursor: default; }
  .nh-editor-surface::selection { background: color-mix(in srgb, var(--nh-accent) 32%, transparent); }
  .nh-editor-surface [contenteditable="false"] { -webkit-user-select: none; user-select: none; }
  /* 2.6.0 — iOS/WebKit REFUSES the caret entirely when any effective rule up the
     chain resolves to user-select: none (desktop Chrome shrugs that combo off,
     Safari does not). Say it out loud on every editable field. */
  .nh-editor-surface, .nh-source, .nh-title, .nh-search input, .nh-findbar input { -webkit-user-select: text; user-select: text; }

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

  /* phone sheet grab handle (visible only on phones) */
  .nh-sheeth { display: none; flex: 0 0 auto; align-items: center; justify-content: center;
    height: calc(16px + env(safe-area-inset-top, 0px));
    touch-action: none; cursor: ns-resize; padding-top: env(safe-area-inset-top, 0px); box-sizing: content-box; }
  .nh-sheeth::after { content: ''; width: 44px; height: 4.5px; border-radius: 99px; background: var(--nh-border); transition: background .15s, width .15s; }
  .nh-sheeth.nh-grab::after, .nh-sheeth:active::after { background: var(--nh-accent); width: 58px; }

  /* narrow modal: rail slides over the editor */
  @media (max-width: 760px) {
    .nh-listwrap { position: absolute; z-index: 6; top: 0; bottom: 0; left: 0; background: var(--nh-bg); box-shadow: 10px 0 30px rgba(0,0,0,.4); width: min(240px, 78vw); }
    .nh-overlay { padding: 8px; }
    .nh-mhead .nh-mtitle span.nh-mt-text { display: none; }
  }

  /* phones: bottom-anchored sheet, clear of the notch & home bar */
  @media (max-width: 560px) {
    /* 2.1.7 — the chat behind the sheet stays alive: the dim is visual-only,
       touches fall through so users can scroll the chat while writing */
    .nh-overlay { pointer-events: none; }
    .nh-overlay .nh-modal { pointer-events: auto; }
    .nh-pane, .nh-list, .nh-surfacewrap, .nh-nav-body, .nh-sbody { -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
    .nh-overlay { padding: 0; align-items: flex-end; }
    .nh-modal { width: 100vw; height: 100vh; height: var(--nh-sheet-h, var(--nh-vvh, 100dvh)); max-width: none; max-height: var(--nh-vvh, none); border-radius: 0; border: 0;
      padding-bottom: env(safe-area-inset-bottom, 0px); }
    .nh-modal.nh-sheet-win { border-radius: 18px 18px 0 0; border-top: 1px solid var(--nh-border); padding-top: 0;
      box-shadow: 0 -14px 50px rgba(0,0,0,.5); }
    .nh-sheeth { display: flex; }
    .nh-modal.nh-sheet-win .nh-sheeth { height: 16px; padding-top: 0; }
    /* 2.5.0 — phone float window: a real draggable window on phones too */
    .nh-modal.nh-floatwin { border-radius: 18px; border: 1px solid var(--nh-border); padding-bottom: 0;
      box-shadow: 0 24px 70px rgba(0,0,0,.62); max-height: none; }
    .nh-modal.nh-floatwin .nh-sheeth { height: 18px; cursor: grab; }
    .nh-modal.nh-floatwin .nh-sheeth::after { width: 66px; background: var(--nh-accent); }
    /* 2.6.0 — iOS can squash the writing box to ~0px while refitting around its
       keyboard; a hard floor keeps it tappable no matter what. */
    @supports (-webkit-touch-callout: none) {
      .nh-surfacewrap, .nh-srcwrap { min-height: 110px; }
    }
    .nh-mhead { flex-wrap: wrap; row-gap: 7px; }
    .nh-search { order: 5; flex-basis: 100%; }
    .nh-title { font-size: 16px; }
    .nh-statusbar { flex-wrap: wrap; row-gap: 4px; }
    .nh-toolbar { gap: 3px; row-gap: 5px; }
  }

  /* phone scroll affordances: a scrollbar you can SEE and drag (2.1.9) */
  @media (max-width: 760px), (pointer: coarse) {
    .nh-pane, .nh-surfacewrap, .nh-list, .nh-nav-body, .nh-sbody { scrollbar-width: thin; scrollbar-color: var(--nh-border) transparent; }
    .nh-pane::-webkit-scrollbar, .nh-surfacewrap::-webkit-scrollbar, .nh-list::-webkit-scrollbar, .nh-nav-body::-webkit-scrollbar, .nh-sbody::-webkit-scrollbar { width: 6px; }
    .nh-pane::-webkit-scrollbar-thumb, .nh-surfacewrap::-webkit-scrollbar-thumb, .nh-list::-webkit-scrollbar-thumb, .nh-nav-body::-webkit-scrollbar-thumb, .nh-sbody::-webkit-scrollbar-thumb { background: var(--nh-border); border-radius: 99px; }
    .nh-pane::-webkit-scrollbar-thumb:hover, .nh-surfacewrap::-webkit-scrollbar-thumb:hover { background: var(--nh-accent); }
  }
  /* ⤒ pill: one tap back to the top of a scrolled pane */
  .nh-topbtn { position: absolute; right: 15px; bottom: 58px; z-index: 40; display: none; align-items: center; justify-content: center;
    width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--nh-border);
    background: var(--nh-bg-2); color: var(--nh-accent); font-size: 17px; cursor: pointer;
    box-shadow: 0 8px 24px rgba(0,0,0,.42); opacity: .94; touch-action: manipulation; }
  .nh-topbtn.nh-show { display: flex; }
  .nh-topbtn:active { transform: scale(.93); }

  /* topbar swipes sideways on narrow screens — one row, no cramped wrap (2.1.6) */
  @media (max-width: 760px) {
    .nh-mhead { flex-wrap: nowrap !important; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; padding-bottom: 8px; }
    .nh-mhead::-webkit-scrollbar { display: none; }
    .nh-mhead > * { flex-shrink: 0; }
    .nh-mhead .nh-search { order: 0; flex: 0 0 auto; flex-basis: auto; width: 148px; min-width: 148px; }
    .nh-mhead .nh-search input { width: 100%; min-width: 0; }
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

  /* ---------- floating halo widget ---------- */
  .nh-halo { width: var(--halo-size, 64px); height: var(--halo-size, 64px); border-radius: 28%; position: relative; cursor: grab; user-select: none;
    background: color-mix(in srgb, var(--lumiverse-accent, #b28cff) 26%, rgba(14,12,22,.72)); /* 2.4.2 — a real body: never invisible glass */
    box-shadow: 0 4px 18px rgba(0,0,0,.5), inset 0 0 0 1.5px color-mix(in srgb, var(--lumiverse-accent, #b28cff) 80%, #fff); }
  .nh-halo:active { cursor: grabbing; }
  .nh-halo img { width: 100%; height: 100%; object-fit: contain; border-radius: inherit; filter: drop-shadow(0 4px 14px rgba(0,0,0,.45)); user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .nh-halo::after { content: ''; position: absolute; inset: -14%; background: radial-gradient(circle, color-mix(in srgb, var(--lumiverse-accent, #b28cff) 28%, transparent) 0%, transparent 70%); z-index: -1; opacity: 0; transition: opacity .25s; border-radius: 50%; }
  .nh-halo:hover::after { opacity: 1; }
  /* floating chat logo — fully self-rendered: no host widget, no permission */
  .nh-halo-float { position: fixed; z-index: 1200; touch-action: none; }
  .nh-halo-float.nh-settle { transition: left .22s ease-out, top .22s ease-out; }
  .nh-halo.nh-nobg { background: transparent; box-shadow: 0 4px 18px rgba(0,0,0,.45); } /* 2.5.4 — ghost mode */
  .nh-halo-float.nh-hi { animation: nh-halo-hi 1.1s ease-out 2; } /* 2.4.2 — 'I'm over here!' pulse */
  @keyframes nh-halo-hi { 0%,100% { transform: scale(1); } 35% { transform: scale(1.18); box-shadow: 0 0 0 10px color-mix(in srgb, var(--lumiverse-accent, #b28cff) 30%, transparent); } }

  /* ---------- image lightbox ---------- */
  .nh-lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(8,7,14,.82); display: flex; align-items: center; justify-content: center; cursor: zoom-out; backdrop-filter: blur(4px); }
  .nh-lightbox img { max-width: 92vw; max-height: 92vh; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,.6); }

  /* ================= WORKSPACE 2.0 ================= */
  .nh-ws { flex: 1; display: flex; min-width: 0; min-height: 0; }
  .nh-ws-groups { flex: 1; display: flex; min-width: 0; min-height: 0; }
  .nh-split { display: flex; flex: 1 1 0; min-width: 0; min-height: 0; }
  .nh-split.col { flex-direction: column; }
  .nh-splitwrap { display: flex; min-width: 0; min-height: 0; }
  .nh-divider { flex: 0 0 5px; margin: 0 -1px; cursor: col-resize; z-index: 5; border-radius: 3px; transition: background .15s; touch-action: none; }
  .nh-divider:hover, .nh-divider.active { background: var(--nh-accent); opacity: .45; }
  .nh-divider.v { margin: -1px 0; cursor: row-resize; }
  .nh-gframe { flex: 1; display: flex; flex-direction: column; min-width: 140px; min-height: 0; border: 1px solid transparent; border-radius: 10px; overflow: hidden; }
  .nh-gframe.focused { border-color: color-mix(in srgb, var(--nh-accent) 25%, transparent); }
  .nh-minitabs { display: flex; flex: 0 0 auto; gap: 4px; padding: 5px 6px; overflow-x: auto; border-bottom: 1px solid var(--nh-border); scrollbar-width: thin; }
  .nh-minitab { display: inline-flex; align-items: center; gap: 4px; max-width: 140px; padding: 3px 9px; border: 1px solid var(--nh-border); border-radius: 8px; background: transparent; color: var(--nh-muted); font-size: 11px; cursor: pointer; white-space: nowrap; }
  .nh-minitab span { overflow: hidden; text-overflow: ellipsis; }
  .nh-minitab.active { color: var(--nh-text); border-color: color-mix(in srgb, var(--nh-accent) 50%, var(--nh-border)); }
  .nh-minitab-empty { opacity: .5; font-size: 11px; padding: 2px 6px; }
  .nh-minitabs.nh-drop { outline: 1.5px dashed var(--nh-accent); }
  .nh-pane { flex: 1; overflow: auto; padding: 10px 14px; font-size: calc(var(--nh-editor-fs, 13.5px) - 0.5px); line-height: 1.65; cursor: pointer; }
  .nh-pane img { max-width: 100%; }
  .nh-pane-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; margin-bottom: 6px; }
  .nh-pane-title b { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nh-pane-edit { cursor: pointer; opacity: .55; }
  .nh-pane-edit:hover { opacity: 1; }
  .nh-pane-empty, .nh-pane-loading { display: block; opacity: .5; font-size: 12px; text-align: center; padding: 26px 8px; }
  .nh-nico { display: inline-flex; align-items: center; flex: 0 0 auto; }

  /* tabs strip (focused group) */
  .nh-tabs { display: flex; flex: 0 0 auto; align-items: flex-end; gap: 3px; padding: 6px 10px 0; overflow-x: auto; scrollbar-width: thin; }
  .nh-tab { display: inline-flex; align-items: center; gap: 5px; max-width: 180px; padding: 5px 9px; border: 1px solid var(--nh-border); border-bottom: 0; border-radius: 9px 9px 0 0; background: transparent; color: var(--nh-muted); font-size: 12px; cursor: pointer; user-select: none; white-space: nowrap; touch-action: manipulation; }
  .nh-tab:hover { color: var(--nh-text); }
  .nh-tab.active { background: color-mix(in srgb, var(--nh-accent) 12%, transparent); color: var(--nh-text); border-color: color-mix(in srgb, var(--nh-accent) 45%, var(--nh-border)); }
  .nh-tab.pinned .nh-tab-t { display: none; }
  .nh-tab-t { overflow: hidden; text-overflow: ellipsis; }
  .nh-tab-x { opacity: .45; padding: 0 2px; border-radius: 4px; }
  .nh-tab-x:hover { opacity: 1; color: #ff8f8f; }
  .nh-tab.nh-drop { outline: 1px dashed var(--nh-accent); }
  .nh-tab-plus { color: var(--nh-muted); border-style: dashed; padding: 5px 11px; }
  .nh-nico-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  /* source mode */
  .nh-source { display: none; }
  .nh-srcwrap { display: none; }
  .nh-mode-source .nh-surfacewrap { display: none; }
  .nh-mode-source .nh-srcwrap { display: flex; flex: 1; min-height: 0; }
  .nh-mode-source .nh-source { display: block; flex: 1; width: 100%; border: 0; outline: none; resize: none; background: var(--nh-bg); color: var(--nh-text); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--nh-editor-fs, 13.5px); line-height: var(--nh-editor-lh, 1.55); padding: 12px 14px; tab-size: 2; }
  .nh-linegutter { flex: 0 0 auto; width: 3.2em; margin: 0; padding: 12px 7px 12px 0; text-align: right; overflow: hidden; user-select: none; color: var(--nh-muted); opacity: .55; border-right: 1px solid var(--nh-border); background: color-mix(in srgb, var(--nh-bg) 70%, transparent); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: calc(var(--nh-editor-fs, 13.5px) - 1px); line-height: var(--nh-editor-lh, 1.55); white-space: pre; }
  .nh-linegutter .nh-gl { display: flex; justify-content: flex-end; align-items: flex-start; } /* 2.5.9 — wrap-aware rows */

  /* find & replace bar */
  .nh-findbar { display: none; flex: 0 0 auto; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--nh-border); flex-wrap: wrap; }
  .nh-findbar.on { display: flex; }
  .nh-findbar input { flex: 1 1 110px; min-width: 86px; background: color-mix(in srgb, var(--nh-bg) 55%, transparent); border: 1px solid var(--nh-border); color: var(--nh-text); border-radius: 8px; padding: 5px 8px; font-size: 12px; outline: none; }
  .nh-findbar input:focus { border-color: var(--nh-accent); }
  .nh-find-count { font-size: 11px; color: var(--nh-muted); min-width: 50px; text-align: center; flex: 0 0 auto; }
  .nh-findbar .nh-iconbtn { width: 26px; height: 26px; font-size: 12px; }

  /* window controls: drag / minimize / fullscreen / left grip */
  .nh-modal.nh-anchored { position: absolute; margin: 0; }
  .nh-modal.nh-min .nh-mbody { display: none; }
  .nh-modal.nh-min { height: auto !important; }
  .nh-modal.nh-min .nh-rsz, .nh-modal.nh-min .nh-mresize { display: none; }
  .nh-modal.nh-full { left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; border-radius: 0; position: absolute; margin: 0; }
  .nh-mhead { cursor: grab; }
  .nh-mhead.nh-grabbing { cursor: grabbing; user-select: none; }
  .nh-mresize-l { left: 4px; right: auto; bottom: 3px; cursor: nesw-resize; }
  .nh-iconbtn.is-active { border-color: var(--nh-accent); color: var(--nh-text); }
  .nh-iconbtn:disabled { opacity: .35; cursor: default; }

  /* folder pin chip + icon preview popover */
  .nh-fpin { font-size: 10px; flex: 0 0 auto; }
  .nh-icopop { position: fixed; z-index: 2147483000; width: 190px; background: var(--nh-bg, #17171f); color: var(--nh-text, #e8e6f0); border: 1px solid var(--nh-border, #2c2c3a); border-radius: 14px; padding: 12px; box-shadow: 0 18px 50px rgba(0,0,0,.55); text-align: center; }
  .nh-icopop-art { display: flex; justify-content: center; margin-bottom: 8px; }
  .nh-icopop-art .nh-fico { font-size: 42px; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 18px; background: color-mix(in srgb, var(--nh-accent, #b28cff) 10%, transparent); overflow: hidden; }
  .nh-icopop-art .nh-fico img { width: 64px; height: 64px; object-fit: cover; border-radius: 18px; }
  .nh-icopop-art .nh-fico svg { width: 42px !important; height: 42px !important; }
  .nh-icopop-name { font-weight: 700; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nh-icopop-meta { font-size: 11px; color: var(--nh-muted, #9aa0ab); margin-top: 3px; }

  /* ================= FILE TREE NAVIGATOR ================= */
  .nh-nav { display: flex; flex-direction: column; height: 100%; padding: 10px; gap: 8px; }
  .nh-nav-top { display: flex; gap: 5px; align-items: center; flex: 0 0 auto; }
  .nh-nav .nh-grow { flex: 1; }
  .nh-nav-sort { max-width: 128px; font-size: 12px; }
  .nh-nav-top .nh-iconbtn { width: 30px; height: 30px; font-size: 13px; }
  .nh-nav-searchrow { display: none; flex: 0 0 auto; }
  .nh-nav-q { width: 100%; font-size: 12px; padding: 7px 10px; }
  .nh-nav-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; padding-bottom: 30vh; }
  .nh-nav-sec { display: flex; align-items: center; gap: 6px; padding: 9px 6px 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: var(--nh-muted); cursor: pointer; user-select: none; }
  .nh-nav-sec .nh-nav-chev svg { transition: transform .18s; }
  .nh-nav-sec.collapsed .nh-nav-chev svg { transform: rotate(-90deg); }
  .nh-nav-row { display: flex; align-items: center; gap: 7px; width: 100%; text-align: left; background: transparent; border: 0; color: var(--nh-text); padding: 6px 8px 6px calc(8px + var(--depth, 0) * 15px); border-radius: 9px; cursor: pointer; font-size: 12.5px; font-family: inherit; }
  .nh-nav-row:hover { background: color-mix(in srgb, var(--nh-accent) 9%, transparent); }
  .nh-nav-row.active { background: color-mix(in srgb, var(--nh-accent) 16%, transparent); }
  .nh-nav-row .nh-nav-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nh-nav-chev { width: 13px; flex: 0 0 auto; display: inline-flex; align-items: center; color: var(--nh-muted); }
  .nh-nav-chev svg { transition: transform .18s; }
  .nh-nav-fold.collapsed > .nh-nav-chev svg { transform: rotate(-90deg); }
  .nh-nav-row.nh-drop { outline: 1.5px dashed var(--nh-accent); background: color-mix(in srgb, var(--nh-accent) 12%, transparent); }
  .nh-nav-ico { width: 16px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; }
  .nh-nbadge { font-size: 10px; color: var(--nh-muted); background: color-mix(in srgb, var(--nh-bg) 40%, transparent); border: 1px solid var(--nh-border); padding: 0 6px; border-radius: 8px; flex: 0 0 auto; }
  .nh-nav-rootdrop { margin: 2px 0 6px; padding: 5px 8px; border: 1px dashed var(--nh-border); border-radius: 8px; color: var(--nh-muted); font-size: 11px; text-align: center; flex: 0 0 auto; }
  .nh-nav-rootdrop.nh-drop { border-color: var(--nh-accent); color: var(--nh-text); background: color-mix(in srgb, var(--nh-accent) 10%, transparent); }
  .nh-nav-hint { font-size: 11px; color: var(--nh-muted); opacity: .75; padding: 4px 8px; }
  .nh-nav-tagswrap { padding: 2px 4px; }
  .nh-nav-tag { margin: 3px; cursor: pointer; }
  .nh-nav-fold .nh-fico { font-size: 13px; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 5px; flex: 0 0 auto; }
  .nh-nav-fold .nh-fico img { width: 18px; height: 18px; object-fit: cover; border-radius: 5px; }

  /* ============ 2.1 editor display prefs ============ */
  .nh-preview, .nh-source { line-height: var(--nh-editor-lh, 1.65); }
  .nh-rll .nh-preview, .nh-rll .nh-source, .nh-rll .nh-linegutter { max-width: 46rem; }
  .nh-rll .nh-surfacewrap, .nh-rll .nh-srcwrap { max-width: 46rem; margin: 0 auto; width: 100%; }
  .nh-guides-ed .nh-preview ul, .nh-guides-ed .nh-preview ol { border-left: 1px solid color-mix(in srgb, var(--nh-muted) 20%, transparent); padding-left: 1.25em; margin-left: .2em; }
  .nh-rtl, .nh-rtl input, .nh-rtl textarea { direction: rtl; text-align: right; }
  .nh-rtl .nh-toolbar, .nh-rtl .nh-statusbar { direction: ltr; }
  .nh-preview h1.nh-folded, .nh-preview h2.nh-folded, .nh-preview h3.nh-folded, .nh-preview h4.nh-folded, .nh-preview h5.nh-folded, .nh-preview h6.nh-folded { opacity: .65; cursor: pointer; }
  .nh-preview .nh-folded::after { content: ' ▸'; color: var(--nh-muted); font-size: .72em; }
  .nh-preview li.nh-folded-li { list-style: none; }
  .nh-preview li.nh-folded-li::before { content: '▸ '; color: var(--nh-muted); }
  .nh-crumb { flex: 0 1 auto; max-width: 128px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10.5px; border: 1px solid var(--nh-border); padding: 3px 8px; border-radius: 9px; color: var(--nh-muted); background: color-mix(in srgb, var(--nh-accent) 7%, transparent); }
  @media (max-width: 700px) { .nh-crumb { display: none; } }
  .nh-nbadge.nh-ext { text-transform: uppercase; letter-spacing: .05em; }
  .nh-pane.nh-drop { outline: 1.5px dashed var(--nh-accent); outline-offset: -4px; }
  .nh-color-labels .nh-nav-note .nh-nav-title { color: var(--rowc, inherit); }
  .nh-color-labels .nh-nav-fold .nh-nav-title { color: var(--rowc, inherit); }
  .nh-guides-tree .nh-nav-row { position: relative; }
  .nh-guides-tree .nh-nav-note::before { content: ''; position: absolute; left: calc(var(--depth, 0) * 15px - 1px); top: 2px; bottom: 2px; width: 1px; background: color-mix(in srgb, var(--nh-muted) 16%, transparent); }
  .nh-tag-ico { margin-right: 3px; }
  .nh-field input[type="text"].nh-sel { padding: 6px 10px; font-size: 12px; }
`;

/* ================================================================ */
/* 2. Icons                                                          */
/* ================================================================ */

/* SVG icon library for files & folders — line icons, color via currentColor */
const NH_ICON_LIB = {
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  quill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c-6 0-12 5-13 12-1 4 1 5 1 5s8-2 11-8c1.5-3 1-9 1-9z"/><path d="M7 17L4 20"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 4-4 6-4 10a4 4 0 0 0 8 0c0-1-.5-2-.5-2s4 2 4 6a7.5 7.5 0 0 1-15 0C4.5 9 11 6 12 2z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6.5 7 .8-5.2 4.7 1.5 6.9L12 17.5 5.7 21l1.5-6.9L2 9.3l7-.8z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.6 4c1.8 0 3.4 1 4.4 2.6C13 5 14.6 4 16.4 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 9l0 12"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c8 2 16-4 16-14-8-2-16 4-16 14z"/><path d="M4 20c2-6 6-10 10-12"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 3 3 4-4 4 4"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg>',
  sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L16 8M14 4l6 6-8 8-6-6z"/><path d="M6 14l4 4M4 20l3-1"/></svg>',
  potion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5l-5 8a3.5 3.5 0 0 0 3 5h8a3.5 3.5 0 0 0 3-5l-5-8V3"/><path d="M7.5 14h9"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18l-1-9 5 3 5-7 5 7 5-3-1 9z"/><path d="M3 21h18"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="7"/><circle cx="9" cy="10" r="1.3"/><circle cx="15" cy="10" r="1.3"/><path d="M9 17v3M15 17v3M12 17v4"/></svg>',
};

const ICONS = {
  // 2.5.1 — requested by a user: the theme toggle swaps its ☀️/🌙 emoji for
  // real vector icons (crisp at any size, they follow the accent color)
  sun: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>',
  // 2.5.2 — the whole header went vector (user request: emoji → SVG)
  chevL: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevR: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  minus: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  square: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>',
  expand: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  compress: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  moreH: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>',
  moreV: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>',
  pen: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  bookOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7Z"/></svg>',
  code: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
  link: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
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

/* Default halo logo — a lavender orb with a crescent moon over an open book
   (2.4.2: the old plain sparkle looked EXACTLY like the host's own floating
   buttons, so users couldn't pick the Halo out of the crowd). */
function defaultLogoDataUrl() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>
  <defs>
    <radialGradient id='g' cx='50%' cy='38%' r='75%'>
      <stop offset='0%' stop-color='#e6dbff'/><stop offset='55%' stop-color='#b28cff'/><stop offset='100%' stop-color='#6d4fc4'/>
    </radialGradient>
  </defs>
  <rect x='4' y='4' width='88' height='88' rx='26' fill='url(#g)'/>
  <path d='M54 20a19 19 0 1 0 6 37 15.5 15.5 0 0 1-6-37Z' fill='#fff' opacity='.96'/>
  <path d='M24 60c8-4.5 16-4.5 24 0 8-4.5 16-4.5 24 0v13c-8-4.5-16-4.5-24 0-8-4.5-16-4.5-24 0Z' fill='#fff' opacity='.92'/>
  <circle cx='70' cy='26' r='3.2' fill='#fff' opacity='.8'/>
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
  let sx = 0, sy = 0, st = 0, btn = 0;
  el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); btn = e.button; }, { passive: true });
  el.addEventListener('pointerup', (e) => {
    // 2.1.8 — only the primary button is a "tap". A right-click release is a
    // clean no-move press too, and used to open the notepad behind the menu.
    if (btn !== 0) return;
    const moved = Math.hypot(e.clientX - sx, e.clientY - sy);
    if (moved < 8 && Date.now() - st < 450) onTap(e);
  }, { passive: true });
}

function addLongPress(el, onPress) {
  let timer = null, sx = 0, sy = 0, fired = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // right/middle buttons never arm a long-press
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

/* [testable:mergeSoftBreaks:start] */
  // Strict line breaks (markdown spec): single \n collapses to a space.
  // Code fences are sacred — never touch their insides.
  function mergeSoftBreaks(src) {
    return String(src).split(/(```[\s\S]*?(?:```|$))/g)
      .map((p, i) => (i % 2 === 1 ? p : p.replace(/([^\n])\n(?!\n)/g, '$1 ')))
      .join('');
  }
  /* [testable:mergeSoftBreaks:end] */

  function renderMarkdown(src, opts) {
  const missing = new Set(opts?.missingTitles || []);
  if (opts?.strictBreaks) src = mergeSoftBreaks(src);
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

  // 2.6.4 — TOAST WALL KILLER. Lumiverse can re-run setup on navigation/re-init;
  // every run re-armed the boot timers → the SAME toast stacked N deep on screen
  // ("The Halo is hidden…" ×3). Identical toasts within a few seconds are
  // reminders, not information — dedupe them. Keyed on window so it survives
  // full module re-inits, not just one setup() lifetime.
  const toastSeen = (window.__nhToastSeen instanceof Map ? window.__nhToastSeen : (window.__nhToastSeen = new Map()));
  const toast = (level, message) => {
    const k = level + '|' + String(message);
    const now = Date.now();
    if (now - (toastSeen.get(k) || 0) < 9000) return Promise.resolve(); // already on screen — don't stack
    toastSeen.set(k, now);
    if (toastSeen.size > 60) toastSeen.clear(); // unbounded growth guard on long sessions
    return rpc('toast', { level, message }).catch(() => {});
  };

  /* ---------------- shared state ---------------- */

  const NH_EDITOR_DEFAULTS = {
    mode: 'write', defaultView: 'write', newTabOnCreate: true, showMode: true,
    readableLength: false, strictBreaks: false, foldHeading: false, foldIndent: false,
    lineNumbers: false, guidesEditor: false, rtl: false, lineHeight: 1.65,
    spellcheck: true, spellLang: 'en', autoPair: false, smartLists: false,
    indentTabs: false, indentWidth: 4, confirmDelete: true, trashMode: 'permanent',
  };
  const NH_UI_DEFAULTS = {
    customCSS: '', accent: '', modalOpacity: 1, backdropDim: 0.6, backdropBlur: 3,
    fontSize: 13.5, radius: 14, theme: 'auto', collapsed: [],
    navExpandSelect: true, navOneBranch: false, navCollapseScope: 'folders', navKeepSelected: false,
    navSpring: false, navColorIconsOnly: true, navShowShortcuts: true, navShortcutIcons: true,
    navShowRecent: true, navRecentCount: 5, navShowFolderIcons: true, navGuides: true,
    navShowTags: true, navTagIcons: true, navTagsFolder: false, navUntagged: false,
    navCounters: { wf: true, wF: true, cf: false, cF: false, tf: false, tF: false, nf: false },
    ifaceIcons: { folder: '', note: '', tag: '' },
    clearBackdrop: false, // 2.5.5 — park notes next to chat, no dim wall
    quietBoot: false, // 2.6.1 — mute the per-session "hello" load toast (Settings → Appearance → Quiet start)
    // 2.5.3 — FLOAT IS THE PHONE DEFAULT ("at 100% zoom it eats the whole
    // screen"): notes open in a centered, draggable window; `phoneDocked`
    // is the opt-out back to the classic bottom sheet.
    phoneDocked: false, floatX: null, floatY: null, floatW: null, floatH: null,
  };

  const state = {
    index: { notes: [] },
    settings: {
      logo: { size: 64, visible: true, snapToEdge: true, x: null, y: null },
      editor: { ...NH_EDITOR_DEFAULTS },
      ui: { ...NH_UI_DEFAULTS },
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
    bgSrc: null,
    booted: false,
    ws: null,            // { layout, focusGid } — tab groups & splits (2.0)
    hist: {},            // gid -> { back:[noteId], fwd:[noteId] }
    findIdx: -1, findMatches: [],
    fullscreen: false,
  };

  /* 2.1.3 — defaults as CONSTANTS, applied both at setup time (synchronous
     settings-card render reads them!) and at boot merge for older saves.
     v2.1.0..2.1.2 shipped a fatal race: cards rendered before boot backfilled
     lineHeight -> TypeError killed setup -> no modal, no tabs, no Halo. */
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
        <div class="nh-sheeth" title="Drag to resize · double-tap for full screen" aria-label="Resize panel"></div>
        <div class="nh-mhead">
          <span class="nh-mtitle">${ICONS.notebook.replace('width="20" height="20"', 'width="17" height="17"')}<span class="nh-mt-text">Notehaven</span></span>
          <div class="nh-search">${ICONS.search}<input type="text" placeholder="Search notes, #tags…" spellcheck="false"></div>
          <button class="nh-iconbtn nh-ws-back" title="Back in history">${ICONS.chevL}</button>
          <button class="nh-iconbtn nh-ws-fwd" title="Forward in history">${ICONS.chevR}</button>
          <button class="nh-iconbtn nh-rail-toggle" title="Toggle note list">${ICONS.list}</button>
          <button class="nh-iconbtn nh-ws-min" title="Minimize to header">${ICONS.minus}</button>
          <button class="nh-iconbtn nh-ws-full" title="Fullscreen workspace">${ICONS.expand}</button>
          <button class="nh-iconbtn nh-themebtn" title="Switch to light theme">${ICONS.sun}</button>
          <button class="nh-iconbtn nh-settings-btn" title="Notehaven settings — appearance, CSS, themes">${ICONS.gear}</button>
          <button class="nh-newbtn">${ICONS.plus}<span>New note</span></button>
          <button class="nh-iconbtn nh-morebtn" title="Import / Export">${ICONS.moreH}</button>
          <button class="nh-mclose" title="Close (Esc)">${ICONS.x}</button>
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
            <div class="nh-listhead"><span class="nh-lh-left"><span class="nh-view-label">All</span></span><span style="display:inline-flex;align-items:center;gap:4px"><button class="nh-iconbtn nh-import-notes" title="Import notes (.md / .json / .txt…)" style="width:26px;height:26px;font-size:12px">⬆</button><button class="nh-iconbtn nh-select-toggle" title="Select notes" style="width:26px;height:26px;font-size:12px">☑</button><span class="nh-count"></span></span></div>
            <div class="nh-list nh-scroll"></div>
            <div class="nh-rail-resizer" title="Drag to resize the rail"></div>
          </div>
          <div class="nh-ws">
            <div class="nh-ws-groups"></div>
          <div class="nh-editor">
            <div class="nh-tabs"></div>
            <div class="nh-editor-head">
              <span class="nh-crumb" title="Lives in this folder">📥</span>
              <input class="nh-title" type="text" placeholder="Untitled Note" spellcheck="false">
              <div class="nh-modegroup">
                <button class="nh-modebtn" data-mode="write">${ICONS.pen}<span>Live</span></button>
                <button class="nh-modebtn" data-mode="read">${ICONS.bookOpen}<span>Read</span></button>
                <button class="nh-modebtn" data-mode="source">${ICONS.code}<span>Source</span></button>
              </div>
              <button class="nh-iconbtn nh-ed-more" title="Note options — split, find, move, export…">${ICONS.moreV}</button>
              <button class="nh-iconbtn nh-pinbtn" title="Pin note">${ICONS.pin}</button>
              <button class="nh-iconbtn danger nh-delbtn" title="Delete note">${ICONS.trash}</button>
            </div>
            <div class="nh-toolbar"></div>
            <div class="nh-findbar">
              <input class="nh-find-in" type="text" placeholder="Find in note…" spellcheck="false">
              <span class="nh-find-count"></span>
              <button class="nh-iconbtn nh-find-prev" title="Previous match">↑</button>
              <button class="nh-iconbtn nh-find-next" title="Next match">↓</button>
              <input class="nh-replace-in" type="text" placeholder="Replace with…" spellcheck="false">
              <button class="nh-iconbtn nh-replace-one" title="Replace current match">⇄</button>
              <button class="nh-iconbtn nh-replace-all" title="Replace all">⇄⇄</button>
              <button class="nh-iconbtn nh-find-close" title="Close find">${ICONS.x}</button>
            </div>
            <div class="nh-canvas">
              <div class="nh-surfacewrap nh-scroll">
                <div class="nh-preview nh-editor-surface" contenteditable="true" spellcheck="true"></div>
              </div>
              <div class="nh-srcwrap"><pre class="nh-linegutter" aria-hidden="true"></pre><textarea class="nh-source nh-scroll" spellcheck="false" placeholder="# raw markdown source"></textarea></div>
            </div>
            <div class="nh-statusbar">
              <span class="nh-savestate"><span class="nh-pulse"></span><span class="nh-savetext">Saved</span></span>
              <span class="nh-tags"></span><span class="nh-grow"></span>
              <span class="nh-words"></span><span class="nh-when"></span>
            </div>
          </div>
          </div>
        </div>
        <div class="nh-rsz nh-rsz-e" title="Drag to resize width"></div>
        <div class="nh-rsz nh-rsz-s" title="Drag to resize height"></div>
        <div class="nh-mresize" title="Drag to resize the window">◢</div>
        <div class="nh-mresize nh-mresize-l" title="Drag to resize from the left">◣</div>
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
  overlayWrap.querySelector('.nh-import-notes').addEventListener('click', () => importFlow());
  const selectToggle = overlayWrap.querySelector('.nh-select-toggle');
  const railResizer = overlayWrap.querySelector('.nh-rail-resizer');
  const mResize = overlayWrap.querySelector('.nh-mresize');
  const mResizeL = overlayWrap.querySelector('.nh-mresize-l');
  const wsGroupsEl = overlayWrap.querySelector('.nh-ws-groups');
  const tabsEl = overlayWrap.querySelector('.nh-tabs');
  const editorEl = overlayWrap.querySelector('.nh-editor');
  const sourceEl = overlayWrap.querySelector('.nh-source');
  const findbar = overlayWrap.querySelector('.nh-findbar');
  const edMoreBtn = overlayWrap.querySelector('.nh-ed-more');
  const wsBackBtn = overlayWrap.querySelector('.nh-ws-back');
  const wsFwdBtn = overlayWrap.querySelector('.nh-ws-fwd');
  const wsMinBtn = overlayWrap.querySelector('.nh-ws-min');
  const wsFullBtn = overlayWrap.querySelector('.nh-ws-full');
  const mheadEl = overlayWrap.querySelector('.nh-mhead');

  /* 2.1.9 — phone scroll helpers: styled slim scrollbars (CSS above) plus a
     floating ⤒ pill that appears once any pane is scrolled, and hops it back
     to the top so the header/toolbar are always a tap away. */
  const nhTopBtn = document.createElement('button');
  nhTopBtn.className = 'nh-topbtn';
  nhTopBtn.type = 'button';
  nhTopBtn.title = 'Back to top';
  nhTopBtn.textContent = '⤒';
  modalEl.appendChild(nhTopBtn);
  const nhScrollers = () => [...modalEl.querySelectorAll('.nh-pane, .nh-surfacewrap')];
  const syncTopBtn = () => {
    nhTopBtn.classList.toggle('nh-show', nhScrollers().some((n) => (n.scrollTop || 0) > 160));
  };
  modalEl.addEventListener('scroll', (e) => {
    if ((e.target?.classList?.contains && e.target.classList.contains('nh-pane')) || e.target?.className?.includes?.('nh-surfacewrap')) syncTopBtn();
  }, true);
  nhTopBtn.addEventListener('click', () => {
    const target = nhScrollers().find((n) => (n.scrollTop || 0) > 4) || nhScrollers()[0];
    try { target?.scrollTo({ top: 0, behavior: 'smooth' }); } catch { if (target) target.scrollTop = 0; }
    setTimeout(syncTopBtn, 350);
  });

  /* 2.2.1 — portrait seat watchdog. Some phones/webviews report exotic
     viewport/inset values; if that math EVER pushes the header off-screen in
     portrait, we clear positioning and reseat the sheet instead of leaving
     the user with no topbar. Landscape (desktop modal path) is untouched. */
  const nurseSheetIntoView = () => {
    if ((window.innerWidth || 1280) > 560 || !state.modalOpen) return; // phones/portrait sheet only
    if (isPhoneFloat()) { if (!state._nhTyping) applyPhoneFloat(); return; } // 2.6.3 — the typing freeze covers the watchdog too
    const r = mheadEl.getBoundingClientRect();
    const bad = !r || r.height === 0 || r.top < -2 || r.bottom < 24 || r.top > nhViewH() - 24;
    if (!bad) return;
    state.settings.ui.sheetH = null;
    state.settings.ui.modalX = null;
    state.settings.ui.modalY = null;
    applySheetHeight(null);
    modalEl.classList.remove('nh-anchored');
    modalEl.style.left = '';
    modalEl.style.top = '';
    // 2.2.3 tier-2: webviews that ignore dvh AND vars get RAW measured pixels
    modalEl.style.height = nhViewH() + 'px';
    modalEl.style.marginTop = 'auto';
  };

  /* 2.5.0 — PHONE FLOAT WINDOW. The bottom sheet is great until it covers
     most of a small screen (user feedback: "sits in the middle instead").
     Float mode undocks the UI into a real, centered, DRAGGABLE window —
     the grab pill becomes a move handle (touch pointer events, works on any
     Android/iOS). Double-tap the pill to jump back to the middle. */
  const isPhoneFloat = () => (window.innerWidth || 1280) <= 560 && !state.settings.ui.phoneDocked; // 2.5.3 — float by default
  const applyPhoneFloat = () => {
    if (sheetDrag) return; // 2.5.7 — never fight the user's finger mid-drag
    const u = state.settings.ui;
    const vw = window.innerWidth || 390;
    const vh = nhViewH();
    const w = Math.max(260, Math.min(vw - 12, u.floatW || Math.min(vw - 12, 460)));
    const h = Math.max(280, Math.min(vh - 20, u.floatH || Math.round(Math.min(vh * 0.78, 640))));
    // first float (or reset): SIT IN THE MIDDLE — the exact ask
    const x0 = u.floatX == null ? Math.round((vw - w) / 2) : u.floatX;
    const y0 = u.floatY == null ? Math.round((vh - h) * 0.38) : u.floatY;
    // 2.5.7 — the WHOLE window must stay inside: the old desktop rule
    // (vw-90) let a phone-wide window park ~70% off the right edge and the
    // self-heal kept re-applying that same wrong max (the "desync" gif).
    const x = nhClamp(x0, 4, Math.max(4, vw - w - 4));
    const y = nhClamp(y0, 4, Math.max(4, vh - 46));
    modalEl.classList.add('nh-anchored', 'nh-floatwin');
    modalEl.classList.remove('nh-sheet-win');
    modalEl.style.left = `${Math.round(x)}px`;
    modalEl.style.top = `${Math.round(y)}px`;
    modalEl.style.width = `${Math.round(w)}px`;
    modalEl.style.height = `${Math.round(h)}px`;
    modalEl.style.marginTop = '';
    modalEl.style.removeProperty('--nh-sheet-h');
    sheetHandle.title = 'Drag to move · double-tap to re-center';
    if (u.floatX != null && (x !== u.floatX || y !== u.floatY)) { u.floatX = Math.round(x); u.floatY = Math.round(y); } // self-heal after rotate/keyboard
    if (!state._floatIntro && !state.settings.ui.quietBoot) { // 2.6.4 — quiet start mutes this intro too
      state._floatIntro = true;
      setTimeout(() => toast('info', '🎈 Notes now float in a draggable window on phones — move it by the top pill. Prefer the full sheet? ⋯ menu → Dock to bottom.'), 650);
    }
  };
  const clearPhoneFloat = () => {
    if (!modalEl.classList.contains('nh-floatwin')) return;
    modalEl.classList.remove('nh-floatwin');
    modalEl.style.marginTop = '';
    sheetHandle.title = 'Drag to resize · double-tap for full screen';
  };
  const togglePhoneFloat = () => {
    state.settings.ui.phoneDocked = !state.settings.ui.phoneDocked;
    saveSettingsSoon();
    applyUi();
    nurseSheetIntoView();
    toast('info', state.settings.ui.phoneDocked
      ? 'Docked to the bottom 📌 back to the classic phone sheet.'
      : 'Float window ON 🎈 drag the UI anywhere by the top pill · double-tap the pill to re-center.');
  };

  /* 2.1.5 — phone sheet: drag the grab pill to size 55%..100% of the screen,
     persisted per user; double-tap snaps back to full screen. Android and
     iOS both supported (same pointer events); desktop never sees the pill. */
  const sheetHandle = overlayWrap.querySelector('.nh-sheeth');
  const applySheetHeight = (px) => {
    const vh = nhViewH();
    modalEl.style.height = ''; // release any tier-2 watchdog override
    modalEl.style.setProperty('--nh-vvh', nhViewH() + 'px'); // CSS fallback chain starts from truth
    if (!px) {
      modalEl.style.removeProperty('--nh-sheet-h');
      modalEl.classList.remove('nh-sheet-win');
      return;
    }
    const h = Math.min(Math.max(px, Math.round(vh * 0.55)), vh);
    modalEl.style.setProperty('--nh-sheet-h', h + 'px');
    modalEl.classList.toggle('nh-sheet-win', h < vh - 4);
  };
  let sheetDrag = null;
  sheetHandle.addEventListener('pointerdown', (e) => {
    sheetDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, sh: modalEl.getBoundingClientRect().height, h: 0, fx: state.settings.ui.floatX, fy: state.settings.ui.floatY, moved: false };
    try { sheetHandle.setPointerCapture(e.pointerId); } catch { /* older engines */ }
    sheetHandle.classList.add('nh-grab');
  });
  sheetHandle.addEventListener('pointermove', (e) => {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    if (isPhoneFloat()) {
      // 2.5.0 — the pill is now a MOVE handle: drag the whole UI anywhere
      const vw = window.innerWidth || 390;
      const vh = nhViewH();
      const r = modalEl.getBoundingClientRect();
      const w = r.width || (vw - 12);
      const h = r.height || Math.round(vh * 0.78);
      const ox = sheetDrag.fx == null ? Math.round((vw - w) / 2) : sheetDrag.fx;
      const oy = sheetDrag.fy == null ? Math.round((vh - h) * 0.38) : sheetDrag.fy;
      const nx = nhClamp(ox + (e.clientX - sheetDrag.sx), 4, Math.max(4, vw - w - 4)); // 2.5.7 — window can never be dragged off-screen
      const ny = nhClamp(oy + (e.clientY - sheetDrag.sy), 4, Math.max(4, vh - 46));
      sheetDrag.nx = Math.round(nx); sheetDrag.ny = Math.round(ny); sheetDrag.moved = true;
      modalEl.style.left = `${sheetDrag.nx}px`;
      modalEl.style.top = `${sheetDrag.ny}px`;
      return;
    }
    sheetDrag.h = sheetDrag.sh + (sheetDrag.sy - e.clientY);
    applySheetHeight(sheetDrag.h);
  });
  const sheetEnd = (e) => {
    if (!sheetDrag || (e && e.pointerId !== undefined && e.pointerId !== sheetDrag.id)) return;
    sheetHandle.classList.remove('nh-grab');
    if (sheetDrag.moved && isPhoneFloat()) {
      state.settings.ui.floatX = sheetDrag.nx;
      state.settings.ui.floatY = sheetDrag.ny;
      saveSettingsSoon();
    }
    if (sheetDrag.h) {
      const vh = nhViewH();
      state.settings.ui.sheetH = sheetDrag.h >= vh - 4 ? null : Math.round(sheetDrag.h);
      if (sheetDrag.h >= vh - 4) applySheetHeight(null);
      saveSettingsSoon();
    }
    sheetDrag = null;
  };
  sheetHandle.addEventListener('pointerup', sheetEnd);
  sheetHandle.addEventListener('pointercancel', sheetEnd);
  sheetHandle.addEventListener('dblclick', () => {
    if (isPhoneFloat()) {
      state.settings.ui.floatX = null;
      state.settings.ui.floatY = null;
      applyPhoneFloat(); // 2.5.0 — back to the middle
    } else {
      state.settings.ui.sheetH = null;
      applySheetHeight(null);
    }
    saveSettingsSoon();
  });
  const crumbEl = overlayWrap.querySelector('.nh-crumb');
  const gutterEl = overlayWrap.querySelector('.nh-linegutter');
  const modeGroupEl = overlayWrap.querySelector('.nh-modegroup');
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

  /* 2.6.0 — THE iOS TYPING FREEZE. While ANY editable field inside the sheet has
     focus, notehaven refuses to refit its own geometry. Why: iOS fires viewport
     resize when its keyboard opens; reseating/resizing the focused surface in
     exactly that moment makes WebKit drop the caret and swallow every keystroke
     ("clicked the box, keyboard came up, nothing types"). */
  const nhIsEditable = (n) => !!(n && (n.isContentEditable || /^(INPUT|TEXTAREA)$/.test(n.tagName || '')));
  modalEl.addEventListener('focusin', (e) => {
    if (nhIsEditable(e.target)) state._nhTyping = true; // keyboard is coming — freeze geometry
  });
  modalEl.addEventListener('focusout', () => {
    setTimeout(() => {
      if (nhIsEditable(document.activeElement)) return; // focus hopped to another field — still typing
      if (!state._nhTyping) return;
      state._nhTyping = false;
      // keyboard gone — re-seat once into the full-height viewport
      if (state.modalOpen && (window.innerWidth || 1280) <= 560) { applyUi(); nurseSheetIntoView(); }
    }, 130);
  });

  /* ---------------- modal open/close ---------------- */

  function openModal(noteId) {
    state.modalOpen = true;
    state._nhTyping = false; // 2.6.0 — fresh session, never inherit a stale typing freeze
    overlay.classList.add('nh-open');
    setTimeout(nurseSheetIntoView, 60); // portrait: the topbar must exist
    setTimeout(nurseSheetIntoView, 480); // …and again once fonts/insets settle
    if (state.ws) buildWs(); // seats the editor into the focused pane
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
      <div class="nh-brandmark">${ICONS.moon}</div>
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
      <div class="nh-li-meta"><span>${fmtDate(meta.updatedAt)}</span><span>${meta.words ?? 0}w · ~${meta.tokens ?? Math.ceil((meta.words || 0) * 1.25) ?? 0}t</span></div>`;
    item.addEventListener('click', (e) => { if (Date.now() - state.lastLPAt < 900) return; onClick(e); }); // 2.6.3 — long-press follow-through guard
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
  // One scannable "All" view: 📌 pinned notes OWN THE TOP (their own smart
  // section), then Inbox, then folders — pinned folders first. Pinned notes
  // leave their folder section so nothing shows twice.
  function buildSections(notes, folders) {
    const sections = [];
    const pinned = notes.filter((n) => n.pinned);
    const rest = notes.filter((n) => !n.pinned);
    if (pinned.length) sections.push({ id: 'pinned', name: 'Pinned', icon: '📌', folder: null, items: pinned });
    const unfiled = rest.filter((n) => !n.folderId);
    if (unfiled.length) sections.push({ id: 'inbox', name: 'Inbox', icon: '📥', folder: null, items: unfiled });
    const ordered = [...folders].sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    for (const folder of ordered) {
      sections.push({ id: folder.id, name: folder.name, icon: folder.icon, color: folder.color, folder, items: rest.filter((n) => n.folderId === folder.id) });
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
    hdr.innerHTML = `${ico}<span class="nh-fname">${escapeHtml(section.name)}</span>${section.folder && section.folder.pinned ? '<span class="nh-fpin" title="Pinned folder">📌</span>' : ''}<span class="nh-fcount">${section.items.length}</span><span class="nh-fchev">${ICONS.chev}</span>`;
    // folder picture preview: tap the icon chip (not the row) for a little popover — works on PC *and* touch
    const icoChip = hdr.querySelector('.nh-fico');
    if (icoChip && section.folder) {
      icoChip.style.cursor = 'zoom-in';
      icoChip.title = 'Preview this folder’s look';
      icoChip.addEventListener('click', (e) => {
        e.stopPropagation();
        folderIconPreview(section.folder, icoChip);
      });
    }
    // dropdown behavior: tap (anywhere on the row, chevron included) hides/shows its notes
    hdr.title = collapsed ? `Show notes in “${section.name}”` : `Hide notes in “${section.name}”`;
    hdr.addEventListener('click', () => { if (Date.now() - state.lastLPAt < 900) return; toggleCollapse(section.id); }); // 2.6.3
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

  // every list refresh also refreshes the surfaces that mirror the index
  const renderListCore = renderList;
  renderList = function () {
    renderListCore();
    renderTabs();
    renderNavIfActive();
  };

  /* ---------------- folders (categories) ---------------- */

  function folderIconHtml(folder) {
    const icon = folder?.icon || '';
    if (icon.startsWith('svg:')) {
      const svg = NH_ICON_LIB[icon.slice(4)];
      if (svg) return `<span class="nh-fico" style="color:${folder?.color || '#b28cff'}">${svg.replace('<svg', '<svg width="15" height="15"')}</span>`;
    }
    if (icon.startsWith('img:')) return `<span class="nh-fico"><img data-folder-ico="${icon.slice(4)}" alt=""></span>`;
    if (icon) return `<span class="nh-fico">${escapeHtml(icon)}</span>`;
    const iface = state.settings?.ui?.ifaceIcons?.folder || '';
    if (iface.startsWith('svg:') && NH_ICON_LIB[iface.slice(4)]) {
      return `<span class="nh-fico" style="color:${folder?.color || '#b28cff'}">${NH_ICON_LIB[iface.slice(4)].replace('<svg', '<svg width="15" height="15"')}</span>`;
    }
    if (iface) return `<span class="nh-fico">${escapeHtml(iface)}</span>`;
    return `<span class="nh-fico" style="background:${folder?.color || '#b28cff'}30">📁</span>`;
  }

  // Little popover that shows the folder's icon/picture big — tap-away closes it.
  let icoPop = null;
  function folderIconPreview(folder, anchor) {
    if (icoPop) { icoPop.remove(); icoPop = null; }
    const pop = document.createElement('div');
    pop.className = 'nh-icopop';
    const big = folderIconHtml(folder);
    pop.innerHTML = `<div class="nh-icopop-art">${big}</div><div class="nh-icopop-name">${escapeHtml(folder.name)}</div><div class="nh-icopop-meta">${state.index.notes.filter((n) => n.folderId === folder.id).length} note(s)${folder.pinned ? ' · 📌 pinned' : ''}</div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const pw = 190;
    pop.style.left = `${Math.min(Math.max(8, r.left), (window.innerWidth || 1280) - pw - 8)}px`;
    pop.style.top = `${Math.min(r.bottom + 8, (window.innerHeight || 800) - 150)}px`;
    icoPop = pop;
    // img icons hydrate async into the popover too
    pop.querySelectorAll('img[data-folder-ico]').forEach(async (img) => {
      const id = img.getAttribute('data-folder-ico');
      if (!state.imageCache.has(id)) {
        try { const { dataUrl } = await rpc('get_image', { imageId: id }, 25000); state.imageCache.set(id, dataUrl || ''); } catch (_) { state.imageCache.set(id, ''); }
      }
      const src = state.imageCache.get(id);
      if (src) img.src = src;
    });
    const close = (e) => { if (icoPop && !icoPop.contains(e.target)) { icoPop.remove(); icoPop = null; window.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => window.addEventListener('pointerdown', close, true), 10);
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
      else { const chip = img.closest('.nh-fico'); if (chip) chip.outerHTML = folderIconHtml({}); } // stale picture → 📁
    });
  }

  /* One icon picker for folders AND notes: emoji ▸, svg library ▸, upload, clear.
   * Returns the icon string to save, or null when the user backed out. */
  async function pickIconFlow(x, y, current, { allowImage } = {}) {
    const emojis = ['📁', '📂', '📝', '🌙', '⭐', '💼', '❤️', '📚', '🎨', '🎮', '💡', '🔥', '🌸', '🧙', '🐉', '🗡'];
    const first = await ctx.ui.showContextMenu({
      position: { x, y },
      items: [
        { key: 'emoji', label: '😀 Emoji icon…' },
        { key: 'svg', label: '🧩 Icon library (svg, colored)…' },
        ...(allowImage ? [{ key: 'upload', label: '📷 Upload image…' }] : []),
        ...(current ? [{ key: 'clear', label: '✖ Remove icon' }] : []),
      ],
    });
    if (!first.selectedKey) return null;
    if (first.selectedKey === 'clear') return '';
    if (first.selectedKey === 'emoji') {
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: emojis.map((e) => ({ key: `e:${e}`, label: `${e}${current === e ? ' ✓' : ''}`, active: current === e })),
      });
      return sub.selectedKey && sub.selectedKey.startsWith('e:') ? sub.selectedKey.slice(2) : null;
    }
    if (first.selectedKey === 'svg') {
      const keys = Object.keys(NH_ICON_LIB);
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: keys.map((k) => ({ key: `s:${k}`, label: `${current === 'svg:' + k ? '✓ ' : ''}${k}`, active: current === 'svg:' + k })),
      });
      return sub.selectedKey && sub.selectedKey.startsWith('s:') ? 'svg:' + sub.selectedKey.slice(2) : null;
    }
    if (first.selectedKey === 'upload') {
      try {
        const files = await ctx.uploads.pickFile({
          accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
          multiple: false,
          maxSizeBytes: 2 * 1024 * 1024,
        });
        const file = files[0];
        if (!file) return null;
        const dataUrl = await downscaleImage(file, 256);
        if (!dataUrl) { toast('error', 'Could not read that image'); return null; }
        const { imageId } = await rpc('put_image', { name: file.name, dataUrl }, 30000);
        state.imageCache.set(imageId, dataUrl);
        return `img:${imageId}`;
      } catch (err) {
        if (err && !/cancel|abort/i.test(err.message || '')) toast('error', err.message || 'Icon upload failed');
        return null;
      }
    }
    return null;
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
        { key: 'newfile', label: '📄 New file (.txt/.json/.xml/.yaml)…' },
        { key: 'newsub', label: '🗂 New subfolder' },
        { key: 'pin', label: folder.pinned ? '📌 Unpin folder' : '📌 Pin folder to top', active: !!folder.pinned },
        { key: 'rename', label: '✏️ Rename folder' },
        { key: 'icon', label: '🎨 Icon & picture…' },
        { key: 'color', label: '🌈 Change color…' },
        { key: 'moveto', label: '🚚 Move folder into…' },
        { key: 'dupfolder', label: '📑 Duplicate folder (with notes)' },
        { key: 'div1', label: '', type: 'divider' },
        { key: 'del-keep', label: '🗑 Delete folder (keep notes)', danger: true },
        { key: 'del-all', label: '🔥 Delete folder AND its notes', danger: true },
      ],
    });
    if (!selectedKey) return;
    if (selectedKey === 'pin') await setFolderMeta(folder.id, { pinned: !folder.pinned });
    else if (selectedKey === 'newsub') {
      try {
        const { index } = await rpc('create_folder', { name: 'New folder', parentId: folder.id });
        state.index = index;
        // 2.6.2 — a subfolder born inside a COLLAPSED parent looked invisible;
        // unfold the parent so the child is on screen the moment it exists
        const cl = state.settings.ui.collapsed || (state.settings.ui.collapsed = []);
        const ci = cl.indexOf('ft:' + folder.id);
        if (ci >= 0) { cl.splice(ci, 1); saveSettingsSoon(); }
        renderList();
        toast('success', `Subfolder created inside “${folder.name}” 🗂`);
      } catch (err) { toast('error', err.message || 'Could not create subfolder'); }
    }
    else if (selectedKey === 'newfile') {
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: ['.txt', '.json', '.xml', '.yaml'].map((ext) => ({ key: ext, label: `📄 untitled${ext}` })),
      });
      if (sub.selectedKey) {
        try {
          const res = await rpc('create_note', { title: `untitled${sub.selectedKey}`, folderId: folder.id });
          state.index = res.index;
          renderList();
          await openNote(res.note.id);
          setTimeout(() => { titleInput.focus(); titleInput.select(); }, 80);
        } catch (err) { toast('error', err.message); }
      }
    }
    else if (selectedKey === 'moveto') {
      const cands = state.index.folders.filter((f) => f.id !== folder.id && !isFolderAncestor(state.index.folders, folder.id, f.id));
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: [
          { key: 'root', label: '🏠 Move to root level', active: !folder.parentId },
          ...cands.map((f) => ({ key: f.id, label: `📁 ${f.parentId ? '↳ ' : ''}${f.name}`, active: folder.parentId === f.id })),
        ],
      });
      if (sub.selectedKey) {
        try {
          await setFolderMeta(folder.id, { parentId: sub.selectedKey === 'root' ? null : sub.selectedKey });
          toast('success', sub.selectedKey === 'root' ? 'Folder lives at the root now 🏠' : 'Folder nested 🗂');
        } catch (err) { toast('error', err.message); }
      }
    }
    else if (selectedKey === 'dupfolder') {
      try {
        const titles = state.index.folders.map((f) => f.name);
        const copyName = nextCopyName(titles, folder.name);
        const src = state.index.notes.filter((n) => n.folderId === folder.id);
        const { folder: nf } = await rpc('create_folder', { name: copyName, parentId: folder.parentId });
        await setFolderMeta(nf.id, { color: folder.color, icon: folder.icon && !folder.icon.startsWith('img:') ? folder.icon : '' });
        for (const meta of src) {
          const { note } = await rpc('get_note', { id: meta.id });
          await rpc('create_note', { title: meta.title, content: note ? note.content : '', folderId: nf.id });
        }
        state.index = (await rpc('list_notes')).index || state.index;
        renderList();
        toast('success', `Folder duplicated as “${copyName}” (${src.length} notes)`);
      } catch (err) { toast('error', err.message || 'Could not duplicate folder'); }
    }
    else if (selectedKey === 'color') {
      const swatches = ['#b28cff', '#ff8fb3', '#8fe3c0', '#8fc9ff', '#ffc98f', '#f28f8f', '#d6c98f', '#9aa0ab'];
      const sub = await ctx.ui.showContextMenu({
        position: { x, y },
        items: swatches.map((c) => ({ key: c, label: `${folder.color === c ? '✓ ' : ''}● ${c}`, active: folder.color === c })),
      });
      if (sub.selectedKey) await setFolderMeta(folder.id, { color: sub.selectedKey });
    }
    else if (selectedKey === 'rename') startFolderRename(folder.id);
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
      const picked = await pickIconFlow(x, y, folder.icon || '', { allowImage: true });
      if (picked !== null) {
        await setFolderMeta(folder.id, { icon: picked });
        if (picked) toast('success', 'Folder look updated 🎨');
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

  // 2.6.0 — many iOS versions ALSO fire window resize for the keyboard; same freeze
  const onWinResize = debounce(() => {
    if (state._nhTyping && (window.innerWidth || 1280) <= 560) return;
    applyUi();
  }, 160);
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
        { key: 'open-newtab', label: '🗖 Open in new tab' },
        { key: 'open-right', label: '↔ Open to the right (split view)' },
        { key: 'pin', label: meta.pinned ? '📌 Unpin' : '📌 Pin to top' },
        { key: 'icon', label: '🖼 Change icon…' },
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
    if (selectedKey === 'open-newtab') {
      openInNewTabFlow(meta.id);
      return;
    }
    if (selectedKey === 'open-right') {
      openModal(meta.id);
      setTimeout(() => splitCurrent('row', meta.id), 80); // pane twins the note instantly
      return;
    }
    if (selectedKey === 'icon') {
      const picked = await pickIconFlow(x, y, meta.icon || '', { allowImage: true });
      if (picked !== null) {
        await rpc('set_meta', { id: meta.id, icon: picked });
        meta.icon = picked;
        renderList();
      }
      return;
    }
    if (selectedKey === 'rename') {
      if (!state.modalOpen) openModal(meta.id);
      else await openNote(meta.id);
      titleInput.focus(); titleInput.select();
    } else if (selectedKey === 'pin') {
      await rpc('set_meta', { id: meta.id, pinned: !meta.pinned });
      meta.pinned = !meta.pinned;
      renderList(); refreshPinBtn();
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
      try {
        const n = await duplicateNoteSequential(meta); // "name.txt" → "name (1).txt", always max+1
        if (n && meta.id === state.currentId) await openNote(n.id);
      } catch (err) { toast('error', err.message || 'Could not duplicate'); }
    } else if (selectedKey === 'export') {
      exportNoteMarkdown(meta);
    } else if (selectedKey === 'delete') {
      await deleteNote(meta.id);
    }
  }

  function refreshPinBtn() {
    const meta = metaOf(state.currentId);
    pinBtn.classList.toggle('is-active', !!meta?.pinned);
    pinBtn.title = meta?.pinned ? 'Unpin from the list top' : 'Pin to the top of the list 📌';
  }

  function renderStatus() {
    const meta = metaOf(state.currentId);
    if (!meta) { tagsEl.innerHTML = ''; wordsEl.textContent = ''; whenEl.textContent = ''; return; }
    tagsEl.innerHTML = (meta.tags || []).slice(0, 8).map((t) => `<span class="nh-tag">#${escapeHtml(t)}</span>`).join('');
    const chars = (state.current?.content || '').length;
    const words = state.current ? (state.current.content.trim() ? state.current.content.trim().split(/\s+/).length : 0) : 0;
    const tokens = Math.ceil(chars / 4); // ≈ until Lumiverse exposes its tokenizer to extensions
    const nls = ((state.current?.content || '').match(/\n/g) || []).length;
    wordsEl.textContent = `${words} words · ~${tokens} tokens · ${nls} ↵`;
    whenEl.textContent = `edited ${fmtDate(meta.updatedAt)}`;
    refreshCrumb();
  }

  function renderPreview() {
    if (!state.current) { preview.innerHTML = ''; return; }
    const titles = new Set(state.index.notes.map((n) => n.title.toLowerCase()));
    const allTargets = [...state.current.content.matchAll(/\[\[([^\][|]{1,120})/g)].map((m) => unescapeHtml(m[1]).trim().toLowerCase());
    const missing = allTargets.filter((t) => !titles.has(t));
    preview.innerHTML = renderMarkdown(state.current.content, { missingTitles: missing, strictBreaks: state.settings.editor.strictBreaks });
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
      state.currentId = id;
      state.current = { id, title: note.title, content: note.content };
      titleInput.value = note.title;
      renderList(); refreshPinBtn(); renderStatus(); renderPreview();
      applyMode(state.settings.editor.mode);
      wsNoteShown(id); // the workspace watches which note is on stage
      if (state._freshTabView) {
        const v = state._freshTabView;
        state._freshTabView = null;
        if (v !== state.settings.editor.mode) applyMode(v);
      }
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
    // 🗑 Trash folder mode: move instead of erase (but deleting FROM trash is final)
    if (state.settings.editor.trashMode === 'trash-folder') {
      try {
        let trash = (state.index.folders || []).find((f) => f.name === '🗑 Trash');
        const meta = metaOf(id);
        if (trash && meta && meta.folderId === trash.id) {
          // already in trash → fall through to real deletion
        } else {
          if (!trash) {
            const r = await rpc('create_folder', { name: '🗑 Trash' });
            trash = r.folder; state.index = r.index;
          }
          await moveNotes([id], trash.id);
          toast('info', 'Moved to 🗑 Trash — delete it there to really erase');
          return;
        }
      } catch (err) { toast('error', err.message || 'Could not move to trash'); return; }
    }
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

  sourceEl.addEventListener('input', () => {
    if (!state.current) return;
    state.current.content = sourceEl.value;
    setSaveState(true, 'Saving…');
    renderStatus();
    saveNoteSoon();
    // live markdown under the hood stays fresh for other panes/tabs
  });

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

  /* 2.6.0 — iOS caret fallback. WebKit's own hit-test on a contenteditable whiffs
     on EMPTY notes and on taps BELOW the last line: no caret, sometimes not even
     the keyboard. Focus the surface ourselves inside the real gesture and aim
     the caret at the tap point (or at the text end when tapping empty space). */
  const surfaceWrap = overlayWrap.querySelector('.nh-surfacewrap');
  surfaceWrap.addEventListener('pointerup', (e) => {
    if (preview.getAttribute('contenteditable') !== 'true') return; // read/source mode — nothing to focus
    if (e.button > 0) return;
    if (e.target.closest('button, a, input, textarea, .nh-wikilink, .nh-task, .nh-imgbox')) return; // widgets handle themselves
    if (document.activeElement === preview) return; // already editing — never clobber a live caret
    preview.focus(); // legal on iOS from inside a genuine user gesture
    let aimed = false;
    try {
      const r = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      if (r && preview.contains(r.startContainer)) {
        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(r); aimed = true; }
      }
    } catch (_) {}
    if (!aimed) { // tap landed in empty space — park the caret at the very end
      try {
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(preview); r.collapse(false);
        if (sel) { sel.removeAllRanges(); sel.addRange(r); }
      } catch (_) {}
    }
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

  // 📌 one click = pinned. No menu, no dismiss-rejection dead end — and any
  // backend error now surfaces as a toast instead of dying silently (the 1.11 bug).
  pinBtn.addEventListener('click', async () => {
    const meta = metaOf(state.currentId);
    if (!meta || pinBtn.dataset.busy) return; // ignore double-taps while saving
    pinBtn.dataset.busy = '1';
    try {
      await rpc('set_meta', { id: meta.id, pinned: !meta.pinned });
      meta.pinned = !meta.pinned;
      renderList(); refreshPinBtn();
      toast('success', meta.pinned ? 'Pinned to the top of the list 📌' : 'Unpinned');
    } catch (e) {
      toast('error', `Pin failed: ${e?.message || e}`); // no more silent fails
    } finally {
      delete pinBtn.dataset.busy;
    }
  });

  let delArmed = null;
  delBtn.addEventListener('click', () => {
    const id = state.currentId;
    if (!id) return;
    if (state.settings.editor.confirmDelete === false) { deleteNote(id); return; } // one-tap, per setting
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
    if (!['write', 'read', 'source'].includes(mode)) mode = 'write';
    const prev = state.settings.editor.mode;
    // entering source: mirror the live content into the textarea
    if (mode === 'source' && prev !== 'source') sourceEl.value = state.current?.content || '';
    state.settings.editor.mode = mode;
    canvas.classList.remove('nh-mode-write', 'nh-mode-read', 'nh-mode-source');
    canvas.classList.add(`nh-mode-${mode}`);
    modeBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.mode === mode));
    preview.setAttribute('contenteditable', mode === 'write' ? 'true' : 'false');
    toolbar.style.display = mode === 'write' ? '' : 'none';
    // leaving source: the textarea already kept state.current.content in sync
    if (prev === 'source' && mode !== 'source') renderPreview();
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
    items.push({ key: 'd9', label: '', type: 'divider' });
    items.push({ key: 'clear-bg', label: state.settings.ui.clearBackdrop ? '🌫 Bring back the dim backdrop' : '👁 Clear backdrop — park notes next to chat', active: !!state.settings.ui.clearBackdrop }); // 2.5.5
    if ((window.innerWidth || 1280) <= 560) { // 2.5.0 — the drag-anywhere window, one tap away
      items.push({ key: 'phone-float', label: state.settings.ui.phoneDocked ? '🎈 Float window — drag the UI around' : '📌 Dock the UI to the bottom', active: !state.settings.ui.phoneDocked });
    }
    const rect = moreBtn.getBoundingClientRect();
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: Math.max(12, rect.right - 250), y: rect.bottom + 8 },
      items,
    });
    if (selectedKey === 'exp-md' && meta) exportNoteMarkdown(meta);
    else if (selectedKey === 'exp-json' && meta) exportNoteJson(meta);
    else if (selectedKey === 'exp-all') exportAll();
    else if (selectedKey === 'import') importFlow();
    else if (selectedKey === 'phone-float') togglePhoneFloat();
    else if (selectedKey === 'clear-bg') { // 2.5.5
      state.settings.ui.clearBackdrop = !state.settings.ui.clearBackdrop;
      saveSettingsSoon();
      applyUi();
      toast('info', state.settings.ui.clearBackdrop
        ? 'Clear backdrop ON 👁 chat stays visible & clickable behind your notes.'
        : 'Backdrop restored 🌫 focus mode.');
    }
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
  tb(ICONS.link, 'Wiki link [[Note]]', () => { // 2.5.8 — vector link
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
  /* FILE TREE NAVIGATOR — second drawer tab: sortable,    */
  /* searchable (words / -exclude / #tag / folder:name /   */
  /* OR), reorderable sections, nested folders, badges,    */
  /* drag & drop. Mobile = tap/long-press, PC = full dnd.  */
  /* ==================================================== */

  /* [testable:navPure:start] */
  function sortNotes(notes, mode) {
    const arr = [...notes];
    const byDate = (k, dir) => arr.sort((a, b) => (new Date(a[k]) - new Date(b[k])) * dir);
    switch (mode) {
      case 'name-asc': return arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
      case 'name-desc': return arr.sort((a, b) => String(b.title).localeCompare(String(a.title)));
      case 'updated-asc': return byDate('updatedAt', 1);
      case 'created-desc': return byDate('createdAt', -1);
      case 'created-asc': return byDate('createdAt', 1);
      case 'updated-desc':
      default: return byDate('updatedAt', -1);
    }
  }
  // query grammar: `word1 word2` every word must hit the title · `-word` exclude ·
  // `#tag` must have tag · `folder:name` scopes by folder · `OR` splits groups
  function parseNavQuery(str) {
    const tokens = String(str || '').trim().split(/\s+/).filter(Boolean);
    const groups = [[]];
    for (const tok of tokens) {
      if (tok.toUpperCase() === 'OR' && groups[groups.length - 1].length) { groups.push([]); continue; }
      groups[groups.length - 1].push(tok);
    }
    return groups.map((grp) => {
      const o = { and: [], not: [], tags: [], folder: null, untagged: false };
      for (const t of grp) {
        if (t.startsWith('-') && t.length > 1) o.not.push(t.slice(1).toLowerCase());
        else if (t.startsWith('#') && t.length > 1) o.tags.push(t.slice(1).toLowerCase());
        else if (/^folder:/i.test(t) && t.length > 7) o.folder = t.slice(7).toLowerCase();
        else if (/^is:untagged$/i.test(t)) o.untagged = true;
        else o.and.push(t.toLowerCase());
      }
      return o;
    }).filter((g) => g.and.length || g.not.length || g.tags.length || g.folder || g.untagged);
  }
  function navGroupMatch(meta, folders, g) {
    const title = String(meta.title || '').toLowerCase();
    if (g.untagged && (meta.tags || []).length) return false;
    if (g.not.some((w) => title.includes(w))) return false;
    if (!g.and.every((w) => title.includes(w))) return false;
    if (!g.tags.every((t) => (meta.tags || []).some((x) => x.toLowerCase() === t))) return false;
    if (g.folder) {
      const f = folders.find((x) => x.id === meta.folderId);
      if (!f || !f.name.toLowerCase().includes(g.folder)) return false;
    }
    return true;
  }
  function navQueryMatch(meta, folders, groups) {
    if (!groups.length) return true;
    return groups.some((g) => navGroupMatch(meta, folders, g));
  }
  // nested folders → tree. roots have parentId null/missing (byParent key '')
  function buildFolderTree(folders, notes) {
    const byParent = new Map();
    for (const f of folders) {
      const k = f.parentId || '';
      if (!byParent.has(k)) byParent.set(k, []);
      byParent.get(k).push(f);
    }
    const ordered = (list) => [...list].sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || String(a.name).localeCompare(String(b.name)));
    // 2.6.2 — TREE ARMOR so subfolders can NEVER silently not-render:
    //  · ORPHAN RESCUE — a folder whose parentId points at a GONE folder (ghost
    //    parent: legacy data, partial import, sync race) used to vanish from the
    //    tree TOGETHER WITH its whole subtree and every note inside. Any folder
    //    the root walk never reaches is reattached at root depth, subtree intact.
    //  · CYCLE ARMOR — a visited set stops A→B→A parent loops from recursing
    //    forever and hard-crashing the entire tree render (blank pane).
    const go = (f, depth, seen) => ({ folder: f, depth, notes: notes.filter((n) => n.folderId === f.id), children: walk(f.id, depth + 1, seen) });
    function walk(pid, depth, seen) {
      return ordered(byParent.get(pid) || [])
        .filter((f) => f.id !== pid && !seen.has(f.id)) // self-parent & already-placed never descend
        .map((f) => { seen.add(f.id); return go(f, depth, seen); });
    }
    const seen = new Set();
    const children = walk('', 0, seen);
    for (const f of folders) { // orphans (incl. cycle-trapped) reattach at root
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      children.push(go(f, 0, seen));
    }
    return { notes: notes.filter((n) => !n.folderId), children };
  }
  function folderTotals(node) {
    let words = 0, tokens = 0, chars = 0, subs = node.children.length, count = node.notes.length;
    for (const n of node.notes) { words += n.words || 0; tokens += n.tokens || 0; chars += n.chars != null ? n.chars : (n.tokens || 0) * 4; }
    for (const c of node.children) {
      const t = folderTotals(c);
      words += t.words; tokens += t.tokens; chars += t.chars; subs += t.subs; count += t.count;
    }
    return { words, tokens, chars, subs, count };
  }
  function isFolderAncestor(folders, maybeAncestorId, folderId) {
    let cur = folders.find((f) => f.id === folderId);
    let hops = 0;
    while (cur && hops < 12) {
      if (!cur.parentId) return false;
      if (cur.parentId === maybeAncestorId) return true;
      cur = folders.find((f) => f.id === cur.parentId);
      hops++;
    }
    return false;
  }
  // every folder id living under `id` (for one-branch collapsing)
  function folderSubtreeIds(folders, id) {
    const out = [];
    const walk = (p) => { for (const f of folders) if (f.parentId === p) { out.push(f.id); walk(f.id); } };
    walk(id);
    return out;
  }
  /* [testable:navPure:end] */

  const navTab = ctx.ui.registerDrawerTab({
    id: 'tree',
    title: 'Notehaven File Tree',
    shortName: 'Tree',
    description: 'Obsidian-style file tree — folders, subfolders, tags, search, drag & drop',
    keywords: ['notes', 'tree', 'files', 'folders', 'tags', 'navigator', 'search'],
    headerTitle: 'File Tree',
    iconSvg: ICONS.list,
  });
  disposers.push(() => navTab.destroy());

  const navRoot = document.createElement('div');
  navRoot.className = 'nh-root nh-nav';
  navRoot.innerHTML = `
    <div class="nh-nav-top">
      <select class="nh-sel nh-nav-sort" title="Change sort order">
        <option value="updated-desc">Modified ↓</option>
        <option value="updated-asc">Modified ↑</option>
        <option value="created-desc">Created ↓</option>
        <option value="created-asc">Created ↑</option>
        <option value="name-asc">Name A→Z</option>
        <option value="name-desc">Name Z→A</option>
      </select>
      <span class="nh-grow"></span>
      <button class="nh-iconbtn nh-nav-sbtn" title="Toggle search">🔍</button>
      <button class="nh-iconbtn nh-nav-exp" title="Expand / collapse all folders">⇅</button>
      <button class="nh-iconbtn nh-nav-ord" title="Reorder sections">↕</button>
      <button class="nh-iconbtn nh-nav-newf" title="New folder">📁+</button>
    </div>
    <div class="nh-nav-searchrow"><input class="nh-nav-q nh-sel" type="text" spellcheck="false" placeholder="words -exclude #tag folder:name · OR splits groups"></div>
    <div class="nh-nav-body nh-scroll"></div>`;
  navTab.root.appendChild(navRoot);

  const navBody = navRoot.querySelector('.nh-nav-body');
  const navQ = navRoot.querySelector('.nh-nav-q');
  const navSearchRow = navRoot.querySelector('.nh-nav-searchrow');
  const navSortSel = navRoot.querySelector('.nh-nav-sort');
  let navBuilt = false;

  const NAV_SECTIONS = { shortcuts: '📌 Shortcuts', recent: '🕘 Recent', tree: '🗂 Notes', tags: '🏷 Tags' };
  const navOrder = () => {
    const def = ['shortcuts', 'recent', 'tree', 'tags'];
    const o = state.settings.ui.navOrder;
    if (!Array.isArray(o)) return def;
    return [...o.filter((k) => def.includes(k)), ...def.filter((k) => !o.includes(k))];
  };
  const navCollapsed = (key) => (state.settings.ui.collapsed || []).includes(key);
  function navToggleCollapse(key) {
    const list = state.settings.ui.collapsed || (state.settings.ui.collapsed = []);
    const i = list.indexOf(key);
    if (i >= 0) {
      list.splice(i, 1);
      // "One expanded branch": unfolding a folder folds its siblings (+subtrees)
      if (state.settings.ui.navOneBranch && key.startsWith('ft:')) {
        const fid = key.slice(3);
        const f = (state.index.folders || []).find((x) => x.id === fid);
        if (f) {
          const sibs = (state.index.folders || []).filter((x) => x.id !== fid && (x.parentId || null) === (f.parentId || null));
          for (const s of sibs) {
            for (const id of [s.id, ...folderSubtreeIds(state.index.folders, s.id)]) {
              if (!list.includes('ft:' + id)) list.push('ft:' + id);
            }
          }
        }
      }
    } else list.push(key);
    saveSettingsSoon();
    renderNav();
  }

  function navFileBadgeHtml(meta) {
    const c = state.settings.ui.navCounters;
    const bits = [];
    if (c.wf) bits.push((meta.words || 0) + 'w');
    if (c.tf) bits.push('~' + (meta.tokens != null ? meta.tokens : Math.ceil((meta.words || 0) * 1.25)) + 't');
    if (c.cf) bits.push((meta.chars || 0) + 'c');
    if (c.nf) bits.push((meta.newlines || 0) + '↵');
    const extM = String(meta.title).match(/\.([a-z0-9]{1,5})$/i);
    const ext = extM ? `<span class="nh-nbadge nh-ext">${extM[1].toLowerCase()}</span>` : '';
    return `${ext}<span class="nh-nbadge">${bits.join(' · ') || ((meta.words || 0) + 'w')}</span>`;
  }

  function navNoteRow(meta, depth, showIcon = true) {
    const row = document.createElement('button');
    row.className = 'nh-nav-row nh-nav-note' + (meta.id === state.currentId ? ' active' : '');
    row.style.setProperty('--depth', depth);
    row.style.setProperty('--rowc', meta.color || 'inherit');
    row.draggable = true;
    row.innerHTML = `<span class="nh-nav-ico">${showIcon ? (noteIconHtml(meta, 13) || '<span class="nh-nico-dot" style="background:' + (meta.color || '#b28cff') + ';width:8px;height:8px;border-radius:50%;display:inline-block"></span>') : ''}</span><span class="nh-nav-title">${escapeHtml(meta.title)}</span>${navFileBadgeHtml(meta)}`;
    row.title = `${meta.title} — ${meta.words ?? 0} words · ~${meta.tokens ?? 0} tokens · ${meta.chars ?? 0} chars · ${meta.newlines ?? 0} ↵ · ${fmtDate(meta.updatedAt)}`;
    row.addEventListener('click', () => {
      if (Date.now() - state.lastLPAt < 900) return; // 2.6.3 — no follow-through tap after a long-press menu
      // Expand-on-selection: unfold the note's folder chain
      if (state.settings.ui.navExpandSelect !== false && meta.folderId) {
        const list = state.settings.ui.collapsed || [];
        let changed = false;
        let pid = meta.folderId, hops = 0;
        while (pid && hops++ < 12) {
          const i = list.indexOf('ft:' + pid);
          if (i >= 0) { list.splice(i, 1); changed = true; }
          pid = ((state.index.folders || []).find((f) => f.id === pid) || {}).parentId || null;
        }
        if (changed) { state.settings.ui.collapsed = list; saveSettingsSoon(); }
      }
      openModal(meta.id);
    });
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (Date.now() - state.lastLPAt < 900) return;
      noteContextMenu(e.clientX, e.clientY, meta);
    });
    addLongPress(row, (pt) => { state.lastLPAt = Date.now(); noteContextMenu(pt.x, pt.y, meta); });
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/nh-note', meta.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    return row;
  }

  function navFolderRow(node) {
    const { folder, depth, children, notes } = node;
    const frag = document.createDocumentFragment();
    const key = 'ft:' + folder.id;
    const collapsed = navCollapsed(key);
    const totals = folderTotals(node);
    const c = state.settings.ui.navCounters;
    const cbits = [];
    if (c.wF) cbits.push(`${totals.words}w`);
    if (c.tF) cbits.push(`~${totals.tokens}t`);
    if (c.cF) cbits.push(`${totals.chars || 0}c`);
    const fBadge = cbits.length ? `${totals.count} · ${cbits.join(' ')}` : (totals.count > 99 ? '99+' : totals.count);
    const row = document.createElement('div');
    row.className = 'nh-nav-row nh-nav-fold' + (collapsed ? ' collapsed' : '') + (folder.pinned ? ' pinned' : '');
    row.style.setProperty('--depth', depth);
    row.style.setProperty('--rowc', folder.color || 'inherit');
    row.draggable = true;
    row.dataset.folderId = folder.id;
    const fico = state.settings.ui.navShowFolderIcons === false ? '' : folderIconHtml(folder);
    row.innerHTML = `<span class="nh-nav-chev">${ICONS.chev}</span>${fico}<span class="nh-nav-title">${escapeHtml(folder.name)}</span>${folder.pinned ? '<span class="nh-fpin">📌</span>' : ''}<span class="nh-nbadge" title="${totals.count} note(s) · ${cbits.join(' · ') || 'counters off'}${totals.subs ? ` · ${totals.subs} subfolder(s)` : ''}">${fBadge}</span>`;
    row.addEventListener('click', () => { if (Date.now() - state.lastLPAt < 900) return; navToggleCollapse(key); }); // 2.6.3
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (Date.now() - state.lastLPAt < 900) return;
      folderContextMenu(e.clientX, e.clientY, folder);
    });
    addLongPress(row, (pt) => { state.lastLPAt = Date.now(); folderContextMenu(pt.x, pt.y, folder); });
    // folder icon = preview popover (mobile + pc)
    const chip = row.querySelector('.nh-fico');
    if (chip) {
      chip.style.cursor = 'zoom-in';
      chip.addEventListener('click', (e) => { e.stopPropagation(); folderIconPreview(folder, chip); });
    }
    // dnd: this row eats notes (file them) AND folders (nest into it)
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/nh-folder', folder.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('text/nh-note') || e.dataTransfer.types.includes('text/nh-folder')) {
        e.preventDefault();
        row.classList.add('nh-drop');
        // spring-loaded: hover while dragging unfolds the folder after a beat
        if (state.settings.ui.navSpring && collapsed && !row._spring) {
          row._spring = setTimeout(() => { row._spring = null; navToggleCollapse(key); }, 550);
        }
      }
    });
    const springOff = () => { if (row._spring) { clearTimeout(row._spring); row._spring = null; } };
    row.addEventListener('dragleave', () => { row.classList.remove('nh-drop'); springOff(); });
    row.addEventListener('drop', async (e) => {
      e.preventDefault();
      row.classList.remove('nh-drop');
      springOff();
      const noteId = e.dataTransfer.getData('text/nh-note');
      if (noteId) { await moveNotes([noteId], folder.id); return; }
      const foldId = e.dataTransfer.getData('text/nh-folder');
      if (foldId && foldId !== folder.id) {
        if (isFolderAncestor(state.index.folders, foldId, folder.id)) { toast('warning', 'A folder cannot live inside its own subfolder'); return; }
        await setFolderMeta(foldId, { parentId: folder.id });
      }
    });
    frag.appendChild(row);
    if (!collapsed) {
      // 2.6.2 — one poisoned row (corrupt icon/title data) must never take
      // down the rest of the branch or everything rendered after it
      for (const n of sortNotes(notes, state.settings.ui.navSort)) {
        try { frag.appendChild(navNoteRow(n, depth + 1)); } catch (_) { /* skip the one bad row */ }
      }
      for (const c of children) {
        try { frag.appendChild(navFolderRow(c)); } catch (_) { /* skip the one bad row */ }
      }
    }
    return frag;
  }

  function navSectionHead(key, count) {
    const head = document.createElement('div');
    const collapsed = navCollapsed('nav:' + key);
    head.className = 'nh-nav-sec' + (collapsed ? ' collapsed' : '');
    head.innerHTML = `<span class="nh-nav-chev">${ICONS.chev}</span><span>${NAV_SECTIONS[key]}</span><span class="nh-nbadge">${count}</span>`;
    head.addEventListener('click', () => navToggleCollapse('nav:' + key));
    return head;
  }

  function renderNav() {
    const notes = state.index.notes || [];
    const folders = state.index.folders || [];
    const groups = parseNavQuery(navQ.value);
    const searching = groups.length > 0;
    navBody.innerHTML = '';
    navSortSel.value = state.settings.ui.navSort || 'updated-desc';
    navSearchRow.style.display = state.settings.ui.navSearch ? '' : 'none';

    if (searching) {
      const matched = sortNotes(notes.filter((n) => navQueryMatch(n, folders, groups)), state.settings.ui.navSort);
      navBody.appendChild(navSectionHead('tree', matched.length));
      const lbl = document.createElement('div');
      lbl.className = 'nh-nav-hint';
      lbl.textContent = `${matched.length} result(s) for “${navQ.value.trim()}”`;
      navBody.appendChild(lbl);
      for (const n of matched) navBody.appendChild(navNoteRow(n, 0));
      const fHits = folders.filter((f) => groups.some((g) => g.and.length && g.and.every((w) => f.name.toLowerCase().includes(w))));
      for (const f of fHits) {
        const row = document.createElement('div');
        row.className = 'nh-nav-row nh-nav-fold';
        row.style.setProperty('--depth', 0);
        row.innerHTML = `<span class="nh-nav-chev"></span>${folderIconHtml(f)}<span class="nh-nav-title">${escapeHtml(f.name)}</span>`;
        row.addEventListener('click', () => { expandSection(f.id); openModal(); });
        navBody.appendChild(row);
      }
      return;
    }

    for (const key of navOrder()) {
      if (key === 'shortcuts') {
        if (state.settings.ui.navShowShortcuts === false) continue;
        const pinned = sortNotes(notes.filter((n) => n.pinned), state.settings.ui.navSort);
        const pinnedFolds = folders.filter((f) => f.pinned);
        navBody.appendChild(navSectionHead('shortcuts', pinned.length + pinnedFolds.length));
        if (navCollapsed('nav:shortcuts')) continue;
        if (!pinned.length && !pinnedFolds.length) {
          const e = document.createElement('div');
          e.className = 'nh-nav-hint';
          e.textContent = 'Pin notes or folders (📌) and they camp here.';
          navBody.appendChild(e);
        }
        for (const f of pinnedFolds) {
          const row = document.createElement('div');
          row.className = 'nh-nav-row nh-nav-fold pinned';
          row.style.setProperty('--depth', 0);
          row.innerHTML = `<span class="nh-nav-chev"></span>${folderIconHtml(f)}<span class="nh-nav-title">${escapeHtml(f.name)}</span><span class="nh-fpin">📌</span>`;
          row.addEventListener('click', () => { expandSection(f.id); openModal(); });
          row.addEventListener('contextmenu', (e) => { e.preventDefault(); folderContextMenu(e.clientX, e.clientY, f); });
          navBody.appendChild(row);
        }
        for (const n of pinned) navBody.appendChild(navNoteRow(n, 0, state.settings.ui.navShortcutIcons !== false));
      } else if (key === 'recent') {
        if (state.settings.ui.navShowRecent === false) continue;
        const recent = sortNotes(notes, 'updated-desc').slice(0, Math.max(1, state.settings.ui.navRecentCount || 5));
        navBody.appendChild(navSectionHead('recent', recent.length));
        if (navCollapsed('nav:recent')) continue;
        for (const n of recent) navBody.appendChild(navNoteRow(n, 0, state.settings.ui.navShortcutIcons !== false));
      } else if (key === 'tree') {
        const tree = buildFolderTree(folders, notes);
        navBody.appendChild(navSectionHead('tree', notes.length));
        if (navCollapsed('nav:tree')) continue;
        // root drop slot — drag anything here to unfile/unnest it
        const rootDrop = document.createElement('div');
        rootDrop.className = 'nh-nav-rootdrop';
        rootDrop.textContent = '⤒ drop here = root (unfile / unnest)';
        rootDrop.addEventListener('dragover', (e) => {
          if (e.dataTransfer.types.includes('text/nh-note') || e.dataTransfer.types.includes('text/nh-folder')) { e.preventDefault(); rootDrop.classList.add('nh-drop'); }
        });
        rootDrop.addEventListener('dragleave', () => rootDrop.classList.remove('nh-drop'));
        rootDrop.addEventListener('drop', async (e) => {
          e.preventDefault(); rootDrop.classList.remove('nh-drop');
          const noteId = e.dataTransfer.getData('text/nh-note');
          if (noteId) { await moveNotes([noteId], null); return; }
          const foldId = e.dataTransfer.getData('text/nh-folder');
          if (foldId) await setFolderMeta(foldId, { parentId: null });
        });
        navBody.appendChild(rootDrop);
        for (const c of tree.children) navBody.appendChild(navFolderRow(c));
        if (tree.notes.length) {
          const lbl = document.createElement('div');
          lbl.className = 'nh-nav-hint';
          lbl.textContent = '📄 unfiled';
          navBody.appendChild(lbl);
          for (const n of sortNotes(tree.notes, state.settings.ui.navSort)) navBody.appendChild(navNoteRow(n, 0));
        }
      } else if (key === 'tags') {
        if (state.settings.ui.navShowTags === false) continue;
        const counts = new Map();
        for (const n of notes) for (const t of n.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const untagged = notes.filter((n) => !(n.tags || []).length).length;
        navBody.appendChild(navSectionHead('tags', sorted.length));
        if (navCollapsed('nav:tags')) continue;
        const tagIco = () => {
          if (state.settings.ui.navTagIcons === false) return '';
          const iface = state.settings.ui.ifaceIcons && state.settings.ui.ifaceIcons.tag;
          if (iface && iface.startsWith('svg:') && NH_ICON_LIB[iface.slice(4)]) return `<span class="nh-nav-ico" style="color:var(--nh-accent)">${NH_ICON_LIB[iface.slice(4)].replace('<svg', '<svg width="12" height="12"')}</span>`;
          if (iface) return `<span class="nh-nav-ico">${escapeHtml(iface)}</span>`;
          return '<span class="nh-nav-ico">🏷</span>';
        };
        const searchTag = (q) => { state.settings.ui.navSearch = true; navQ.value = q; renderNav(); };
        const tagRow = (tag, n, depth) => {
          const r2 = document.createElement('button');
          r2.className = 'nh-nav-row nh-nav-note';
          r2.style.setProperty('--depth', depth);
          r2.innerHTML = `${tagIco()}<span class="nh-nav-title">#${escapeHtml(tag)}</span><span class="nh-nbadge">${n}</span>`;
          r2.addEventListener('click', () => searchTag(`#${tag}`));
          return r2;
        };
        const untaggedRow = (depth) => {
          if (!state.settings.ui.navUntagged || !untagged) return null;
          const r3 = document.createElement('button');
          r3.className = 'nh-nav-row nh-nav-note';
          r3.style.setProperty('--depth', depth);
          r3.innerHTML = `<span class="nh-nav-ico">∅</span><span class="nh-nav-title">Untagged</span><span class="nh-nbadge">${untagged}</span>`;
          r3.addEventListener('click', () => searchTag('is:untagged'));
          return r3;
        };
        if (state.settings.ui.navTagsFolder) {
          // "Tags as a collapsible folder" — folder row, tags nested inside
          const fr = document.createElement('div');
          const fcollapsed = navCollapsed('ft:__tags');
          fr.className = 'nh-nav-row nh-nav-fold' + (fcollapsed ? ' collapsed' : '');
          fr.style.setProperty('--depth', 0);
          fr.innerHTML = `<span class="nh-nav-chev">${ICONS.chev}</span>${tagIco()}<span class="nh-nav-title">Tags</span><span class="nh-nbadge">${sorted.length}</span>`;
          fr.addEventListener('click', () => navToggleCollapse('ft:__tags'));
          navBody.appendChild(fr);
          if (!fcollapsed) {
            for (const [tag, n] of sorted.slice(0, 60)) navBody.appendChild(tagRow(tag, n, 1));
            const ur = untaggedRow(1);
            if (ur) navBody.appendChild(ur);
          }
        } else {
          if (!sorted.length && !untagged) {
            const e = document.createElement('div');
            e.className = 'nh-nav-hint';
            e.textContent = 'Use #tags inside notes and they appear here.';
            navBody.appendChild(e);
          }
          const wrap = document.createElement('div');
          wrap.className = 'nh-nav-tagswrap';
          for (const [tag, n] of sorted.slice(0, 60)) {
            const chip = document.createElement('button');
            chip.className = 'nh-tag nh-nav-tag';
            chip.innerHTML = `${tagIco().replace('nh-nav-ico', 'nh-nav-ico nh-tag-ico')}#${escapeHtml(tag)} (${n})`;
            chip.addEventListener('click', () => searchTag(`#${tag}`));
            wrap.appendChild(chip);
          }
          navBody.appendChild(wrap);
          const ur = untaggedRow(0);
          if (ur) navBody.appendChild(ur);
        }
      }
    }
  }

  function renderNavIfActive() { if (navBuilt) renderNav(); }

  navQ.addEventListener('input', () => renderNav());
  navSortSel.addEventListener('change', () => {
    state.settings.ui.navSort = navSortSel.value;
    saveSettingsSoon();
    renderNav();
  });
  navRoot.querySelector('.nh-nav-sbtn').addEventListener('click', () => {
    state.settings.ui.navSearch = !state.settings.ui.navSearch;
    saveSettingsSoon();
    renderNav();
    if (state.settings.ui.navSearch) setTimeout(() => navQ.focus(), 40);
  });
  navRoot.querySelector('.nh-nav-exp').addEventListener('click', () => {
    const list = state.settings.ui.collapsed || (state.settings.ui.collapsed = []);
    const scopeAll = state.settings.ui.navCollapseScope === 'all';
    const hits = (k) => k.startsWith('ft:') || (scopeAll && k.startsWith('nav:'));
    const anyCollapsed = list.some(hits);
    if (anyCollapsed) {
      state.settings.ui.collapsed = list.filter((k) => !hits(k));
    } else {
      // keep the open note's branch expanded when asked
      const keep = new Set();
      if (state.settings.ui.navKeepSelected) {
        const meta = metaOf(state.currentId);
        let pid = meta && meta.folderId, hops = 0;
        while (pid && hops++ < 12) {
          keep.add('ft:' + pid);
          pid = ((state.index.folders || []).find((f) => f.id === pid) || {}).parentId || null;
        }
      }
      for (const f of state.index.folders) if (!keep.has('ft:' + f.id) && !list.includes('ft:' + f.id)) list.push('ft:' + f.id);
      if (scopeAll) for (const k of Object.keys(NAV_SECTIONS)) if (!list.includes('nav:' + k)) list.push('nav:' + k);
    }
    saveSettingsSoon();
    renderNav();
  });
  navRoot.querySelector('.nh-nav-ord').addEventListener('click', async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const order = navOrder();
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: rect.left, y: rect.bottom + 6 },
      items: order.map((k, i) => ({ key: k, label: `${i + 1}. ${NAV_SECTIONS[k]}${i > 0 ? ' — tap to move up' : ''}` })),
    });
    if (!selectedKey) return;
    const i = order.indexOf(selectedKey);
    if (i > 0) {
      [order[i - 1], order[i]] = [order[i], order[i - 1]];
      state.settings.ui.navOrder = order;
      saveSettingsSoon();
      renderNav();
    }
  });
  navRoot.querySelector('.nh-nav-newf').addEventListener('click', () => createFolderFlow());
  disposers.push(navTab.onActivate(() => renderNav()));
  navBuilt = true;

  /* ==================================================== */
  /* Halo controls — live inside Notehaven Settings now    */
  /* (no separate drawer tab: everything in one place)     */
  /* ==================================================== */

  const haloRoot = document.createElement('div');
  haloRoot.className = 'nh-root nh-halo-root';
  haloRoot.innerHTML = `
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
        <div><label>Transparency</label><div class="nh-desc">Faint ghost (15%) to fully solid (100%).</div></div>
        <div class="nh-slider"><input type="range" class="nh-opacity" min="15" max="100" step="5"><output class="nh-opacity-out">100%</output></div>
      </div>
      <div class="nh-field">
        <div><label>Backdrop ring</label><div class="nh-desc">The tinted body + ring behind the logo. Off: clean transparent orb — perfect for most custom icons.</div></div>
        <span class="nh-switch"><input type="checkbox" class="nh-bgswitch" checked><span class="nh-track"></span></span>
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


  /* ==================================================== */
  /* Halo widget — the floating logo                       */
  /* ==================================================== */

  let haloBubbleEl = null;   // the floating logo — fully ours, no host widget
  let haloImgEl = null;

  function haloDefaultPos() {
    const size = state.settings.logo.size;
    return {
      x: Math.max(16, (window.innerWidth || 1280) - size - 40),
      y: Math.max(16, (window.innerHeight || 800) - size - 96),
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
    opacityRange.value = String(Math.round((logo.opacity ?? 1) * 100));
    opacityOut.textContent = `${opacityRange.value}%`;
    bgSwitch.checked = logo.backdrop !== false; // 2.5.4
    haloPreviewImg.src = state.logoSrc;
    const p = haloPos();
    posRead.textContent = `x: ${Math.round(p.x)}, y: ${Math.round(p.y)}`;
  }

  function destroyHalo() {
    if (haloBubbleEl) { haloBubbleEl.remove(); haloBubbleEl = null; }
    haloImgEl = null;
    // 2.5.6 — THE HALO IS A SINGLETON. An in-place extension Update leaves the
    // old module's bubble orphaned in the DOM (the new instance can't see it),
    // and a raced watchdog could double-mount. So (re)creation sweeps EVERY
    // stray bubble on the page, not just the one this instance tracks.
    try { document.querySelectorAll('.nh-halo-float').forEach((n) => n.remove()); } catch (_) {}
  }

  function buildHaloEl() {
    const { logo } = state.settings;
    const el = document.createElement('div');
    el.className = 'nh-halo nh-halo-float';
    el.style.setProperty('--halo-size', `${logo.size}px`);
    el.title = 'Notehaven — tap for notes · drag to move · right-click / long-press: menu'; // 2.4.2
    const img = document.createElement('img');
    img.src = state.logoSrc;
    img.alt = 'Notehaven';
    img.draggable = false;
    // 2.4.2 — a dead logo image used to leave INVISIBLE GLASS (div had no
    // body of its own). Swap to the built-in moon-book and say it happened.
    img.addEventListener('error', () => {
      if (img.src === defaultLogoDataUrl()) return; // already on the fallback
      state.logoSrc = defaultLogoDataUrl();
      img.src = state.logoSrc;
      if (!state._logoHealToasted) {
        state._logoHealToasted = true;
        toast('info', 'Notehaven logo image failed to load — restored the built-in moon-book orb.');
      }
    });
    el.appendChild(img);
    haloImgEl = img;
    return el;
  }

  // --- open-note triggers: several paths, all funneled into one deduped
  // open, because browsers may retarget pointer events around drags
  const openFromHalo = () => {
    if (Date.now() - (state.haloResizeAt || 0) < 500) return; // just finished resizing/dragging
    if (Date.now() - state.lastLPAt < 600) return; // long-press menu owns this gesture
    const now = Date.now();
    if (now - (state.lastHaloOpenAt || 0) < 450) return; // dedupe tap+click double-fire
    state.lastHaloOpenAt = now;
    openModal();
  };

  function wireHaloTriggers(el) {
    addTapListener(el, openFromHalo); // classic small-move tap
    let pdown = null;
    el.addEventListener('pointerdown', (e) => { pdown = { x: e.clientX, y: e.clientY }; }, { passive: true });
    el.addEventListener('click', (e) => { // safety net: fires even if pointerup got retargeted
      if (pdown && Math.hypot(e.clientX - pdown.x, e.clientY - pdown.y) >= 8) return; // that was a drag
      openFromHalo();
    });

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
  }

  const nhClamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  // 2.2.2 — the ONLY trustworthy height on a phone: visualViewport (excludes
  // URL bars/insets/keyboard). innerHeight & even 100dvh lie on some
  // webviews; falling back gracefully when the API is missing.
  const nhViewH = () => {
    const vv = window.visualViewport && window.visualViewport.height;
    const ih = window.innerHeight;
    const h = Math.min(vv || Infinity, ih || Infinity);
    return Math.round(Number.isFinite(h) ? h : 700);
  };

  function placeHaloBubble(px, py) {
    if (!haloBubbleEl) return;
    const size = state.settings.logo.size;
    const d = haloDefaultPos();
    const x = nhClamp(Number.isFinite(px) ? px : d.x, 4, (window.innerWidth || 320) - size - 4);
    const y = nhClamp(Number.isFinite(py) ? py : d.y, 4, (window.innerHeight || 480) - size - 4);
    haloBubbleEl.style.left = `${Math.round(x)}px`;
    haloBubbleEl.style.top = `${Math.round(y)}px`;
  }

  // pointer-drag + snap-to-edge + persist — works with mouse AND touch
  function wireHaloDrag(el) {
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) { drag = null; return; } // right-click is MENU business, never drag/open
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, st: Date.now(), ox: parseFloat(el.style.left) || 0, oy: parseFloat(el.style.top) || 0, moved: false };
      // NOTE: no setPointerCapture yet — capturing on touchstart makes some
      // mobile browsers swallow the tap's synthetic click entirely
    }, { passive: true });
    el.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return; // still a tap
      if (!drag.moved) try { el.setPointerCapture(e.pointerId); } catch { /* older engines */ }
      drag.moved = true;
      state.haloResizeAt = Date.now(); // suppress the tap that ends a drag
      const size = state.settings.logo.size;
      drag.nx = nhClamp(drag.ox + dx, 4, (window.innerWidth || 320) - size - 4);
      drag.ny = nhClamp(drag.oy + dy, 4, (window.innerHeight || 480) - size - 4);
      el.style.left = `${Math.round(drag.nx)}px`;
      el.style.top = `${Math.round(drag.ny)}px`;
    }, { passive: true });
    const finish = (e) => {
      if (!drag) return;
      if (e && e.pointerId !== undefined && e.pointerId !== drag.id) return;
      if (!drag.moved) {
        // v2.1.4 — a clean up-without-move IS the tap. Mobile browsers often
        // eat the synthetic click (capture quirks / gesture layers), so the
        // pointerup path opens directly; openFromHalo dedupes the real click.
        if (e && e.type === 'pointerup' && Date.now() - (drag.st || 0) < 800) openFromHalo();
        drag = null;
        return;
      }
      {
        let nx = drag.nx;
        const ny = drag.ny;
        if (state.settings.logo.snapToEdge) {
          const size = state.settings.logo.size;
          nx = (nx + size / 2 < (window.innerWidth || 320) / 2)
            ? 12
            : Math.max(12, (window.innerWidth || 320) - size - 12);
          el.classList.add('nh-settle');
          requestAnimationFrame(() => {
            el.style.left = `${Math.round(nx)}px`;
            setTimeout(() => el.classList.remove('nh-settle'), 260);
          });
        }
        state.settings.logo.x = nx;
        state.settings.logo.y = ny;
        posRead.textContent = `x: ${Math.round(nx)}, y: ${Math.round(ny)}`;
        saveSettingsSoon();
      }
      drag = null;
    };
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  }

  /* v2.1.2 — the Halo is 100% Notehaven-rendered. The host float-widget
     API is gone from the picture: on hosts where the widget permission was ungranted
     (or widgets unsupported, e.g. phones) the widget was swallowed
     SILENTLY — users saw no logo at all. One direct <div> in body with
     our own drag/snap/tap logic works everywhere, guaranteed. */

  function createHalo() {
    destroyHalo();
    const { logo } = state.settings;
    const pos = haloPos();
    let el = null;
    try {
      el = buildHaloEl();
      (document.body || document.documentElement).appendChild(el);
    } catch (err) {
      // absolute last resort: retry once on the next frame
      setTimeout(() => { try { if (!haloBubbleEl) createHalo(); } catch (_) {} }, 400);
      return;
    }
    haloBubbleEl = el;
    placeHaloBubble(pos.x, pos.y);
    syncHaloChrome(); // 2.5.4 — opacity + backdrop on every (re)birth
    el.style.display = logo.visible ? '' : 'none';
    wireHaloDrag(el);
    wireHaloTriggers(el);

    // say hello once per session so first-time users know it's alive
    if (!state._haloSaidHello && logo.visible) {
      state._haloSaidHello = true;
      el.classList.add('nh-hi'); // 2.4.2 visual "here I am!"
      setTimeout(() => el.classList.remove('nh-hi'), 2600);
      if (!state.settings.ui.quietBoot) setTimeout(() => toast('info', 'Notehaven is the pulsing moon-book orb 🌙📖 tap it for your notes'), 900); // 2.6.1
    }

    // self-heal watchdog: if the host somehow eats the bubble (detached or
    // zero-sized), rebuild it — a few tries, then warn once and stop trying
    state._haloWdAttempts = state._haloWdAttempts || 0;
    setTimeout(() => {
      const cur = haloBubbleEl;
      const ok = cur && cur.isConnected && (state.settings.logo.visible ? cur.getBoundingClientRect().width > 0 : true); // hidden on purpose = healthy
      if (ok) { state._haloWdAttempts = 0; return; }
      if (state._haloWdAttempts < 3) {
        state._haloWdAttempts += 1;
        createHalo();
      } else if (!state._haloWdWarned) {
        state._haloWdWarned = true;
        toast('warning', "Notehaven: your browser blocked the floating logo — notes open anytime via input-bar Extras → 'Open Notes'.");
      }
    }, 1600);
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

  // 2.5.4 — transparency + backdrop live here so every path (create, settings,
  // rescue timer) paints the same orb; the custom logo image is never altered.
  const opacityRange = haloRoot.querySelector('input.nh-opacity');
  const opacityOut = haloRoot.querySelector('.nh-opacity-out');
  const bgSwitch = haloRoot.querySelector('.nh-bgswitch');
  function syncHaloChrome() {
    const { logo } = state.settings;
    if (haloBubbleEl) {
      haloBubbleEl.style.opacity = String(logo.opacity ?? 1);
      haloBubbleEl.classList.toggle('nh-nobg', logo.backdrop === false);
    }
  }
  opacityRange.addEventListener('input', () => {
    state.settings.logo.opacity = Number(opacityRange.value) / 100;
    opacityOut.textContent = `${opacityRange.value}%`;
    syncHaloChrome();
    saveSettingsSoon();
  });
  bgSwitch.addEventListener('change', () => {
    state.settings.logo.backdrop = bgSwitch.checked;
    syncHaloChrome();
    saveSettingsSoon();
  });

  function setHaloVisible(v) {
    state.settings.logo.visible = v;
    visibleSwitch.checked = v;
    if (haloBubbleEl) haloBubbleEl.style.display = v ? '' : 'none';
    saveSettingsSoon();
    syncInputBarLabel();
  }

  function resetHaloPosition() {
    state.settings.logo.x = null;
    state.settings.logo.y = null;
    if (!state.settings.logo.visible) setHaloVisible(true); // 2.4.1 — 'reset' also un-hides
    const d = haloDefaultPos();
    placeHaloBubble(d.x, d.y);
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
          <button class="nh-mclose nh-sc-close" title="Close">${ICONS.x}</button>
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
              <div><label>Background image</label><div class="nh-desc">A picture behind your notes — the veil below keeps text readable.</div></div>
              <span class="nh-colorwrap"><button class="nh-btn nh-ui-bg-upload">🖼 Upload</button><button class="nh-btn nh-ui-bg-clear" title="Remove background">✕</button></span>
            </div>
            <div class="nh-field">
              <div><label>Background veil</label><div class="nh-desc">Higher = more solid · lower = more picture showing through.</div></div>
              <div class="nh-slider"><input type="range" class="nh-ui-bgdim" min="0.3" max="0.98" step="0.01"><output></output></div>
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
              <div><label>Clear backdrop</label><div class="nh-desc">No dim, no blur — the chat stays visible and CLICKABLE behind your notes. Park the window next to the conversation and keep typing.</div></div>
              <span class="nh-switch"><input type="checkbox" class="nh-clearbg-sw"><span class="nh-track"></span></span>
            </div>
            <div class="nh-field">
              <div><label>Quiet start</label><div class="nh-desc">Mute Notehaven's load-time chatter: the hello toast, halo reminders (“hidden / rescued”), and the phone-float intro. Errors and warnings ALWAYS still show — and identical toasts never stack (2.6.4).</div></div>
              <span class="nh-switch"><input type="checkbox" class="nh-quietboot-sw"><span class="nh-track"></span></span>
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
  const clearBgSw = settingsWrap.querySelector('.nh-clearbg-sw'); // 2.5.5
  const quietBootSw = settingsWrap.querySelector('.nh-quietboot-sw'); // 2.6.1
  // the Halo's controls live at the top of Settings — one cozy home for everything
  settingsWrap.querySelector('.nh-sbody').prepend(haloRoot);

  /* ================= 2.1 settings cards: Editor / Navigator / Trash ================= */
  function prefSwitch(label, desc, get, set, after) {
    const row = document.createElement('div');
    row.className = 'nh-field';
    row.innerHTML = `<div><label>${escapeHtml(label)}</label>${desc ? `<div class="nh-desc">${escapeHtml(desc)}</div>` : ''}</div>`;
    const wrap = document.createElement('span');
    wrap.className = 'nh-switch';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!get();
    const track = document.createElement('span');
    track.className = 'nh-track';
    wrap.append(cb, track);
    row.appendChild(wrap);
    cb.addEventListener('change', () => { set(cb.checked); saveSettingsSoon(); applyEditorPrefs(); renderNavIfActive(); if (after) after(); });
    return row;
  }
  function prefSlider(label, desc, get, set, min, max, step, fmt) {
    const row = document.createElement('div');
    row.className = 'nh-field';
    row.innerHTML = `<div><label>${escapeHtml(label)}</label>${desc ? `<div class="nh-desc">${escapeHtml(desc)}</div>` : ''}</div>`;
    const box = document.createElement('div');
    box.className = 'nh-slider';
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = String(get());
    const out = document.createElement('output');
    out.textContent = (fmt || ((v) => String(v)))(get() ?? min);
    box.append(input, out);
    row.appendChild(box);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      set(v);
      out.textContent = (fmt || ((x) => String(x)))(v);
      saveSettingsSoon(); applyEditorPrefs(); renderNavIfActive();
    });
    return row;
  }
  function prefSelect(label, desc, get, set, options) {
    const row = document.createElement('div');
    row.className = 'nh-field';
    row.innerHTML = `<div><label>${escapeHtml(label)}</label>${desc ? `<div class="nh-desc">${escapeHtml(desc)}</div>` : ''}</div>`;
    const sel = document.createElement('select');
    sel.className = 'nh-sel';
    for (const [val, text] of options) {
      const o = document.createElement('option');
      o.value = val; o.textContent = text;
      sel.appendChild(o);
    }
    sel.value = String(get());
    row.appendChild(sel);
    sel.addEventListener('change', () => { set(sel.value); saveSettingsSoon(); applyEditorPrefs(); renderNavIfActive(); });
    return row;
  }
  function prefText(label, desc, get, set, placeholder) {
    const row = document.createElement('div');
    row.className = 'nh-field';
    row.innerHTML = `<div><label>${escapeHtml(label)}</label>${desc ? `<div class="nh-desc">${escapeHtml(desc)}</div>` : ''}</div>`;
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'nh-sel';
    inp.style.maxWidth = '140px';
    inp.value = get() || '';
    inp.placeholder = placeholder || '';
    row.appendChild(inp);
    inp.addEventListener('change', () => { set(inp.value.trim()); saveSettingsSoon(); applyEditorPrefs(); });
    return row;
  }

  const E2 = () => state.settings.editor;
  const U2 = () => state.settings.ui;

  const editorCard = document.createElement('div');
  editorCard.className = 'nh-card';
  editorCard.innerHTML = '<h3>⌨ Editor</h3><div class="nh-sub">How writing looks and behaves — every toggle applies instantly.</div>';
  editorCard.append(
    prefSwitch('Open new notes in new tab', 'Off: opening a note replaces the current tab like a pager.', () => E2().newTabOnCreate, (v) => { E2().newTabOnCreate = v; }),
    prefSelect('Default view for new tabs', 'A brand-new tab opens in this mode.', () => E2().defaultView, (v) => { E2().defaultView = v; }, [['write', '✍ Live preview'], ['read', '📖 Reading'], ['source', '⌨ Source']]),
    prefSwitch('Show editing mode in header', 'The ✍/📖/⌨ group above the editor.', () => E2().showMode, (v) => { E2().showMode = v; }),
    prefSwitch('Readable line length', 'Limit how wide text runs — long paragraphs get comfier.', () => E2().readableLength, (v) => { E2().readableLength = v; }),
    prefSwitch('Strict line breaks', 'On: single line breaks collapse in reading view (markdown spec).', () => E2().strictBreaks, (v) => { E2().strictBreaks = v; }, () => renderPreview()),
    prefSwitch('Fold headings (reading)', 'Tap a heading to fold everything under it.', () => E2().foldHeading, (v) => { E2().foldHeading = v; }),
    prefSwitch('Fold nested lists (reading)', 'Tap a list item to fold its children.', () => E2().foldIndent, (v) => { E2().foldIndent = v; }),
    prefSwitch('Line numbers', 'Gutter numbers in ⌨ Source view.', () => E2().lineNumbers, (v) => { E2().lineNumbers = v; }),
    prefSwitch('Indentation guides (editor)', 'Faint rails behind nested lists.', () => E2().guidesEditor, (v) => { E2().guidesEditor = v; }),
    prefSwitch('Right-to-left (RTL)', 'Flip editing & reading direction.', () => E2().rtl, (v) => { E2().rtl = v; }),
    prefSlider('Editor line height', '1.65 is the Lumiverse default.', () => E2().lineHeight, (v) => { E2().lineHeight = v; }, 1.2, 2.2, 0.05, (v) => v.toFixed(2)),
    prefSwitch('Spellcheck', 'Browser spellchecker on editor surfaces.', () => E2().spellcheck, (v) => { E2().spellcheck = v; }),
    prefText('Spellcheck languages', 'BCP-47 codes, comma-separated: e.g. "en, tl, ja".', () => E2().spellLang, (v) => { E2().spellLang = v; }, 'en'),
    prefSwitch('Auto-pair brackets (source)', 'Typing ( [ { " \' ` closes itself.', () => E2().autoPair, (v) => { E2().autoPair = v; }),
    prefSwitch('Smart lists (source)', 'Enter continues -, 1. and - [ ] markers; Enter on an empty item drops it.', () => E2().smartLists, (v) => { E2().smartLists = v; }),
    prefSwitch('Indent using tabs', 'Off: Tab inserts spaces instead.', () => E2().indentTabs, (v) => { E2().indentTabs = v; }),
    prefSlider('Indent visual width', 'Spaces a tab renders as.', () => E2().indentWidth, (v) => { E2().indentWidth = v; }, 2, 8, 1, (v) => `${v}sp`),
  );
  const wsResetField = document.createElement('div');
  wsResetField.className = 'nh-field';
  wsResetField.innerHTML = `<div><label>Panes & splits</label><div class="nh-desc">Workspace full of empty panes? One click back to a single clean editor.</div></div>
    <button class="nh-btn nh-ws-reset">🧹 Reset to one pane</button>`;
  editorCard.appendChild(wsResetField);
  wsResetField.querySelector('.nh-ws-reset').addEventListener('click', () => resetWorkspaceLayout());
  editorCard.appendChild(prefSwitch('📌 Dock to bottom — classic sheet (phones)', 'Phones now open notes in a centered floating window you drag by the top pill. Turn this on to use the old full-screen bottom sheet instead.', () => !!U2().phoneDocked, (v) => { U2().phoneDocked = v; }, () => { applyUi(); nurseSheetIntoView(); }));

  const navCard = document.createElement('div');
  navCard.className = 'nh-card';
  navCard.innerHTML = '<h3>🗂 Navigator & File Tree</h3><div class="nh-sub">Everything from your File Tree spec — collapse logic, counters, icons, sections.</div>';
  const C = () => state.settings.ui.navCounters;
  navCard.append(
    prefSwitch('Expand on selection', 'Opening a note unfolds its folder chain.', () => U2().navExpandSelect, (v) => { U2().navExpandSelect = v; }),
    prefSwitch('One expanded branch', 'Opening a folder folds its siblings.', () => U2().navOneBranch, (v) => { U2().navOneBranch = v; }),
    prefSelect('Expand/collapse all affects', 'What the ⇅ button touches.', () => U2().navCollapseScope, (v) => { U2().navCollapseScope = v; }, [['folders', 'Folders only'], ['all', 'All sections']]),
    prefSwitch('Keep selected expanded', 'Collapsing keeps the open note’s branch out.', () => U2().navKeepSelected, (v) => { U2().navKeepSelected = v; }),
    prefSwitch('Spring-loaded folders', 'Dragging over a folder opens it after a beat.', () => U2().navSpring, (v) => { U2().navSpring = v; }),
    prefSwitch('Apply color to icons only', 'Off: custom colors tint text labels too.', () => U2().navColorIconsOnly, (v) => { U2().navColorIconsOnly = v; }),
    prefSwitch('Show Shortcuts section', '', () => U2().navShowShortcuts, (v) => { U2().navShowShortcuts = v; }),
    prefSwitch('Icons in Shortcuts & Recent', '', () => U2().navShortcutIcons, (v) => { U2().navShortcutIcons = v; }),
    prefSwitch('Show Recent section', '', () => U2().navShowRecent, (v) => { U2().navShowRecent = v; }),
    prefSlider('Recent files count', 'How many live there.', () => U2().navRecentCount, (v) => { U2().navRecentCount = v; }, 1, 9, 1, (v) => `${v}`),
    prefSwitch('Show folder icons', '', () => U2().navShowFolderIcons, (v) => { U2().navShowFolderIcons = v; }),
    prefSwitch('Indent guides (file tree)', 'Vertical rails between levels.', () => U2().navGuides, (v) => { U2().navGuides = v; }),
    prefSwitch('Show Tags section', '', () => U2().navShowTags, (v) => { U2().navShowTags = v; }),
    prefSwitch('Show tag icons', '', () => U2().navTagIcons, (v) => { U2().navTagIcons = v; }),
    prefSwitch('Tags as a folder', 'Render tags like a collapsible folder instead of chips.', () => U2().navTagsFolder, (v) => { U2().navTagsFolder = v; }),
    prefSwitch('Show “Untagged” item', 'A shortcut listing notes with no tags.', () => U2().navUntagged, (v) => { U2().navUntagged = v; }),
  );
  const ctrTitle = document.createElement('h3');
  ctrTitle.textContent = 'Counter badges';
  ctrTitle.style.marginTop = '10px';
  navCard.append(
    ctrTitle,
    prefSwitch('Words — files', '', () => C().wf, (v) => { C().wf = v; }),
    prefSwitch('Words — folders (sum)', '', () => C().wF, (v) => { C().wF = v; }),
    prefSwitch('Characters — files', '', () => C().cf, (v) => { C().cf = v; }),
    prefSwitch('Characters — folders (sum)', '', () => C().cF, (v) => { C().cF = v; }),
    prefSwitch('Tokens — files', '', () => C().tf, (v) => { C().tf = v; }),
    prefSwitch('Tokens — folders (sum)', '', () => C().tF, (v) => { C().tF = v; }),
    prefSwitch('Newlines — files', '', () => C().nf, (v) => { C().nf = v; }),
  );
  const ifaceBtn = document.createElement('button');
  ifaceBtn.className = 'nh-btn';
  ifaceBtn.innerHTML = '🧩 Interface icons…';
  ifaceBtn.title = 'Default icons for folders, notes and tags';
  ifaceBtn.addEventListener('click', async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: rect.left, y: rect.bottom + 6 },
      items: [
        { key: 'folder', label: '📁 Default folder icon…' },
        { key: 'note', label: '📝 Default note icon…' },
        { key: 'tag', label: '🏷 Tag icon…' },
      ],
    });
    if (!selectedKey) return;
    const picked = await pickIconFlow(rect.left, rect.bottom + 6, state.settings.ui.ifaceIcons[selectedKey] || '', { allowImage: false });
    if (picked !== null) {
      state.settings.ui.ifaceIcons[selectedKey] = picked;
      saveSettingsSoon(); renderNavIfActive(); renderList();
    }
  });
  navCard.appendChild(ifaceBtn);

  const trashCard = document.createElement('div');
  trashCard.className = 'nh-card';
  trashCard.innerHTML = '<h3>🗑 Delete & trash</h3><div class="nh-sub">How merciful the delete button is.</div>';
  trashCard.append(
    prefSwitch('Confirm before deleting', 'Two-tap delete everywhere — no accidents.', () => E2().confirmDelete, (v) => { E2().confirmDelete = v; }),
    prefSelect('Deleted files go…', '“Trash folder” moves notes into a 📂 Trash folder you create once; delete from there to really erase.', () => E2().trashMode, (v) => { E2().trashMode = v; }, [['permanent', 'Gone forever (default)'], ['trash-folder', 'Into a 🗑 Trash folder']]),
  );

  settingsWrap.querySelector('.nh-sbody').append(editorCard, navCard, trashCard);

  const uiCss = settingsWrap.querySelector('.nh-cssbox');
  const uiSliders = {
    opacity: settingsWrap.querySelector('.nh-ui-opacity'),
    dim: settingsWrap.querySelector('.nh-ui-dim'),
    blur: settingsWrap.querySelector('.nh-ui-blur'),
    font: settingsWrap.querySelector('.nh-ui-font'),
    radius: settingsWrap.querySelector('.nh-ui-radius'),
    rail: settingsWrap.querySelector('.nh-ui-rail'),
    bgdim: settingsWrap.querySelector('.nh-ui-bgdim'),
  };

  let removeUiCss = null;

  function applyUi() {
    const u = state.settings.ui;
    const clearBg = !!u.clearBackdrop; // 2.5.5
    overlay.classList.toggle('nh-clearbg', clearBg);
    overlay.style.background = clearBg ? 'transparent' : `rgba(9, 8, 15, ${u.backdropDim})`;
    overlay.style.backdropFilter = clearBg ? 'none' : (u.backdropBlur > 0 ? `blur(${u.backdropBlur}px)` : 'none');
    modalEl.style.opacity = String(u.modalOpacity);
    const light = u.theme === 'light';
    for (const rootEl of [modalEl, launchRoot, haloRoot, spanelEl, typeof navRoot !== 'undefined' ? navRoot : null]) {
      if (!rootEl) continue;
      rootEl.classList.toggle('nh-th-light', light);
      rootEl.style.setProperty('--nh-radius', `${u.radius}px`);
      if (u.accent) rootEl.style.setProperty('--lumiverse-accent', u.accent);
      else rootEl.style.removeProperty('--lumiverse-accent');
    }
    themeBtn.innerHTML = light ? ICONS.moon : ICONS.sun; // 2.5.1 — real vectors, no emoji
    themeBtn.title = light ? 'Switch to dark theme' : 'Switch to light theme';
    if (uiTheme) uiTheme.value = u.theme || 'auto';
    if (clearBgSw) clearBgSw.checked = clearBg; // 2.5.5
    if (quietBootSw) quietBootSw.checked = !!u.quietBoot; // 2.6.1
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
    const showSheet = vw > 560;
    const mw = u.modalW ? Math.min(u.modalW, Math.max(400, vw - 16)) : 0;
    const mh = u.modalH ? Math.min(u.modalH, Math.max(280, vh - 12)) : 0;
    if (u.modalW && mw !== u.modalW) state.settings.ui.modalW = mw; // self-heal bad values
    if (u.modalH && mh !== u.modalH) state.settings.ui.modalH = mh;
    modalEl.style.width = showSheet && mw ? `${mw}px` : '';
    modalEl.style.height = showSheet && mh ? `${mh}px` : '';

    // remembered drag position — clamped so the header never leaves the screen
    if (showSheet && !state.fullscreen && u.modalX != null && u.modalY != null) {
      modalEl.classList.add('nh-anchored');
      modalEl.style.left = `${Math.min(Math.max(8, u.modalX), Math.max(8, vw - 90))}px`;
      modalEl.style.top = `${Math.min(Math.max(8, u.modalY), Math.max(8, vh - 46))}px`;
    } else {
      modalEl.classList.remove('nh-anchored');
      modalEl.style.left = '';
      modalEl.style.top = '';
    }
    // 2.5.0 — phones choose: bottom sheet (default) or a real FLOATING window
    // 2.6.0 — typing freeze: geometry NEVER refits mid-keystroke (iOS caret death)
    if (!showSheet && isPhoneFloat()) { if (!state._nhTyping) applyPhoneFloat(); }
    else { clearPhoneFloat(); if (!showSheet && !state._nhTyping) applySheetHeight(u.sheetH || null); }
    nurseSheetIntoView();
    modalEl.classList.toggle('nh-min', !!u.minimized);
    wsMinBtn.innerHTML = u.minimized ? ICONS.square : ICONS.minus; // 2.5.2 — vector states
    wsMinBtn.title = u.minimized ? 'Restore the workspace' : 'Minimize to header';

    // custom background picture — a theme-aware "veil" (color-mix of --nh-bg)
    // sits on top so notes stay readable in dark AND light mode
    if (state.bgSrc) {
      const dim = Math.min(0.98, Math.max(0.3, u.bgDim == null ? 0.85 : u.bgDim));
      const veil = `color-mix(in srgb, var(--nh-bg) ${Math.round(dim * 100)}%, transparent)`;
      modalEl.style.backgroundImage = `linear-gradient(${veil}, ${veil}), url("${state.bgSrc}")`;
      modalEl.style.backgroundSize = 'cover';
      modalEl.style.backgroundPosition = 'center';
    } else {
      modalEl.style.backgroundImage = '';
      modalEl.style.backgroundSize = '';
      modalEl.style.backgroundPosition = '';
    }

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
      [uiSliders.bgdim, u.bgDim == null ? 0.85 : u.bgDim, (v) => `${Math.round(v * 100)}% veil`],
    ];
    for (const [input, val, fmt] of pairs) {
      input.value = String(val);
      input.nextElementSibling.textContent = fmt(val);
    }
    uiCss.value = u.customCSS;
    syncBgButtons();
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

  clearBgSw.addEventListener('change', () => {
    state.settings.ui.clearBackdrop = clearBgSw.checked; // 2.5.5
    saveSettingsSoon();
    applyUi();
  });
  quietBootSw.addEventListener('change', () => {
    state.settings.ui.quietBoot = quietBootSw.checked; // 2.6.1 — no more load toast when on
    saveSettingsSoon();
    toast('info', quietBootSw.checked ? 'Quiet start on — load & halo-reminder toasts muted 🤫' : 'Load chatter is back — Notehaven will say hi again 🌙');
  });
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
  bindSlider(uiSliders.bgdim, 'bgDim', (v) => `${Math.round(v * 100)}% veil`);

  /* ---------- background image upload / clear ---------- */
  const bgUploadBtn = settingsWrap.querySelector('.nh-ui-bg-upload');
  const bgClearBtn = settingsWrap.querySelector('.nh-ui-bg-clear');
  function syncBgButtons() {
    const has = !!state.settings.ui.bgImageId;
    bgUploadBtn.textContent = has ? '🖼 Change' : '🖼 Upload';
    bgClearBtn.style.display = has ? '' : 'none';
  }
  bgUploadBtn.addEventListener('click', async () => {
    try {
      const files = await ctx.uploads.pickFile({
        accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        multiple: false,
        maxSizeBytes: 12 * 1024 * 1024,
      });
      const file = files[0];
      if (!file) return;
      const mime = fileMime(file);
      const dataUrl = /gif|apng/.test(mime)
        ? bytesToDataUrl(file.bytes, mime) // keep gifs alive
        : (await downscaleImage(file, 1920)) || bytesToDataUrl(file.bytes, mime);
      const { imageId } = await uploadMedia(file.name, dataUrl);
      const old = state.settings.ui.bgImageId;
      state.settings.ui.bgImageId = imageId;
      state.bgSrc = dataUrl;
      if (old && old !== imageId) rpc('delete_image', { imageId: old }).catch(() => {});
      saveSettingsSoon(); applyUi(); syncBgButtons();
      toast('success', 'Background set — cozy in here 🖼✨');
    } catch (e) {
      toast('error', e?.message || 'Could not set that background');
    }
  });
  bgClearBtn.addEventListener('click', () => {
    const old = state.settings.ui.bgImageId;
    state.settings.ui.bgImageId = '';
    state.bgSrc = null;
    if (old) rpc('delete_image', { imageId: old }).catch(() => {});
    saveSettingsSoon(); applyUi(); syncBgButtons();
  });
  syncBgButtons();

  settingsWrap.querySelector('.nh-winsize-reset').addEventListener('click', () => {
    state.settings.ui.modalW = 0;
    state.settings.ui.modalH = 0;
    state.settings.ui.modalX = null;
    state.settings.ui.modalY = null;
    state.settings.ui.minimized = false;
    state.fullscreen = false;
    modalEl.classList.remove('nh-full');
    applyUi();
    saveSettingsSoon();
    toast('info', 'Window size & position reset — back to center');
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

  // keep the self-rendered bubble inside the viewport on rotate/resize
  const onViewportResizeHalo = debounce(() => {
    if (haloBubbleEl && Number.isFinite(state.settings.logo.x)) {
      placeHaloBubble(state.settings.logo.x, state.settings.logo.y);
    }
    // rotating the phone: re-clamp the sheet/modal and verify the header seat
    // 2.6.0 — this very listener ALSO fires when iOS shows/hides its keyboard;
    // refitting then murders the caret. Frozen while typing.
    if (state._nhTyping) return;
    applyUi();
    nurseSheetIntoView();
  }, 120);
  window.addEventListener('resize', onViewportResizeHalo);
  window.addEventListener('orientationchange', onViewportResizeHalo);
  disposers.push(() => window.removeEventListener('resize', onViewportResizeHalo));
  disposers.push(() => window.removeEventListener('orientationchange', onViewportResizeHalo));
  // mobile truth channel: URL bar show/hide, pinch zoom, and the keyboard
  if (window.visualViewport && window.visualViewport.addEventListener) {
    window.visualViewport.addEventListener('resize', onViewportResizeHalo);
    disposers.push(() => window.visualViewport.removeEventListener('resize', onViewportResizeHalo));
  }

  // a folder picture that 404s (deleted/GC'd image) becomes 📁, never a broken box
  const nhFolderIconErr = (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.hasAttribute && img.hasAttribute('data-folder-ico')) {
      const chip = img.closest && img.closest('.nh-fico');
      if (chip) chip.outerHTML = folderIconHtml({});
    }
  };
  window.addEventListener('error', nhFolderIconErr, true);
  disposers.push(() => window.removeEventListener('error', nhFolderIconErr, true));


  /* ==================================================== */
  /* WORKSPACE 2.0 — tabs · tab groups · splits · window   */
  /* controls. One live editor surface serves the FOCUSED  */
  /* group; other panes render a live reading view.        */
  /* ==================================================== */

  /* [testable:wsOps:start] */
  // Pure workspace-tree operations (unit-tested: no DOM in here).
  function wsNewGid() { return 'g' + Math.random().toString(36).slice(2, 9); }
  function wsFindGroup(node, gid) {
    if (!node) return null;
    if (node.type === 'group') return node.gid === gid ? node : null;
    return wsFindGroup(node.a, gid) || wsFindGroup(node.b, gid);
  }
  function wsAllGroups(node, out = []) {
    if (!node) return out;
    if (node.type === 'group') out.push(node);
    else { wsAllGroups(node.a, out); wsAllGroups(node.b, out); }
    return out;
  }
  function wsFirstGroup(node) { return node.type === 'group' ? node : wsFirstGroup(node.a); }
  // returns a NEW tree with the group spliced out (parent split collapses)
  function wsRemoveGroup(node, gid) {
    if (!node || node.type === 'group') return node;
    if (node.a.type === 'group' && node.a.gid === gid) return node.b;
    if (node.b.type === 'group' && node.b.gid === gid) return node.a;
    const na = wsRemoveGroup(node.a, gid), nb = wsRemoveGroup(node.b, gid);
    return (na !== node.a || nb !== node.b) ? { ...node, a: na, b: nb } : node;
  }
  // split a group: original keeps 60%, the brand-new twin pane takes 40%
  function wsSplit(node, gid, dir, newGid, noteId) {
    if (node.type === 'group') {
      if (node.gid !== gid) return node;
      const twin = { type: 'group', gid: newGid, tabs: noteId ? [{ noteId, pinned: false }] : [], activeId: noteId || null };
      return { type: 'split', dir, ratio: 0.6, a: node, b: twin };
    }
    return { ...node, a: wsSplit(node.a, gid, dir, newGid, noteId), b: wsSplit(node.b, gid, dir, newGid, noteId) };
  }
  // drop dead tabs/notes everywhere; returns null when the whole tree died
  function wsNormalize(node, noteIds) {
    if (!node || (node.type !== 'split' && node.type !== 'group')) return null;
    if (node.type === 'group') {
      node.tabs = (node.tabs || []).filter((t) => noteIds.has(t.noteId));
      if (node.activeId && !noteIds.has(node.activeId)) node.activeId = null;
      if (!node.activeId && node.tabs.length) node.activeId = node.tabs[0].noteId;
      return node;
    }
    node.a = wsNormalize(node.a, noteIds);
    node.b = wsNormalize(node.b, noteIds);
    if (!node.a) return node.b || null;
    if (!node.b) return node.a || null;
    if (typeof node.ratio !== 'number' || node.ratio <= 0.05 || node.ratio >= 0.95) node.ratio = 0.5;
    return node;
  }
  // duplication naming: "name.txt" → "name (1).txt", always max N + 1
  function nextCopyName(existingTitles, title) {
    const m = String(title || '').match(/^(.*?)\s*(?:\((\d+)\))?(\.[a-z0-9]{1,5})?$/i);
    const stem = (m && m[1] ? m[1].trim() : '') || 'note';
    const ext = (m && m[3]) || '';
    let max = m && m[2] ? parseInt(m[2], 10) : 0;
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp('^' + esc(stem) + '\\s*\\((\\d+)\\)' + esc(ext) + '$', 'i');
    for (const t of existingTitles) {
      const r = String(t).match(rx);
      if (r) max = Math.max(max, parseInt(r[1], 10));
    }
    return stem + ' (' + (max + 1) + ')' + ext;
  }
  /* [testable:wsOps:end] */

  function wsDefault() {
    return { layout: { type: 'group', gid: 'g_main', tabs: [], activeId: null }, focusGid: 'g_main' };
  }

  /* One clean pane, whenever the workspace degenerates into split graveyards.
     Also auto-heals at boot when EVERY pane is empty (the 2.1.0-era race and
     rapid split clicking both produced those). */
  function resetWorkspaceLayout(msg) {
    const fresh = wsDefault();
    const cur = state.currentId && metaOf(state.currentId) ? state.currentId : null;
    if (cur) { fresh.layout.tabs = [{ noteId: cur, pinned: false }]; fresh.layout.activeId = cur; }
    state.ws = { layout: fresh.layout, focusGid: fresh.focusGid };
    persistWs();
    buildWs();
    renderTabs();
    if (cur) wsNoteShown(cur);
    toast('info', msg || 'Workspace reset — one clean pane ✨');
  }

  function wsInit() {
    const saved = state.settings.editor && state.settings.editor.workspace;
    state.ws = (saved && saved.layout) ? { layout: saved.layout, focusGid: saved.focusGid || 'g_main' } : wsDefault();
    const noteIds = new Set(state.index.notes.map((n) => n.id));
    state.ws.layout = wsNormalize(state.ws.layout, noteIds) || wsDefault().layout;
    wsPruneDead();
    if (!wsFindGroup(state.ws.layout, state.ws.focusGid)) state.ws.focusGid = wsFirstGroup(state.ws.layout).gid;
    // split graveyard cleanup: several panes and not a single tab anywhere
    const deadGroups = wsAllGroups(state.ws.layout);
    if (deadGroups.length > 1 && deadGroups.every((g) => !(g.tabs || []).length)) {
      state.ws = wsDefault();
      state._wsHealed = true;
    }
  }

  function wsPruneDead() {
    // empty groups fold away unless they're the only one left or focused
    let groups = wsAllGroups(state.ws.layout);
    for (const g of groups) {
      if (groups.length <= 1) break;
      if (!g.tabs.length && g.gid !== state.ws.focusGid && g.gid !== 'g_main') {
        state.ws.layout = wsRemoveGroup(state.ws.layout, g.gid);
      }
      groups = wsAllGroups(state.ws.layout);
    }
  }

  let wsSaveSoon = null;
  function persistWs() {
    state.settings.editor.workspace = JSON.parse(JSON.stringify({ layout: state.ws.layout, focusGid: state.ws.focusGid }));
    if (!wsSaveSoon) wsSaveSoon = debounce(() => saveSettingsSoon(), 350);
    wsSaveSoon();
  }

  /* ---------------- history (per tab group) ---------------- */
  function histPush(gid, noteId) {
    if (state._histNav) return;
    const h = state.hist[gid] || (state.hist[gid] = { back: [], fwd: [] });
    if (h.back[h.back.length - 1] === noteId) return;
    h.back.push(noteId);
    if (h.back.length > 60) h.back.shift();
    h.fwd.length = 0;
  }
  function histGo(dir) {
    if (!state.ws) return;
    const gid = state.ws.focusGid;
    const h = state.hist[gid];
    if (!h) return;
    if (dir < 0) {
      if (h.back.length < 2) { syncHistBtns(); return; }
      h.fwd.push(h.back.pop());
      const target = h.back[h.back.length - 1];
      state._histNav = true;
      openNote(target).finally(() => { state._histNav = false; syncHistBtns(); });
    } else {
      if (!h.fwd.length) { syncHistBtns(); return; }
      const target = h.fwd.pop();
      h.back.push(target);
      state._histNav = true;
      openNote(target).finally(() => { state._histNav = false; syncHistBtns(); });
    }
    syncHistBtns();
  }
  function syncHistBtns() {
    const h = state.ws ? state.hist[state.ws.focusGid] : null;
    wsBackBtn.disabled = !(h && h.back.length > 1);
    wsFwdBtn.disabled = !(h && h.fwd.length);
  }
  wsBackBtn.addEventListener('click', () => histGo(-1));
  wsFwdBtn.addEventListener('click', () => histGo(1));

  /* ---------------- tabs ---------------- */
  function wsNoteShown(noteId) {
    if (!state.ws) return;
    let g = wsFindGroup(state.ws.layout, state.ws.focusGid) || wsFirstGroup(state.ws.layout);
    state.ws.focusGid = g.gid;
    let fresh = false;
    if (!g.tabs.some((t) => t.noteId === noteId)) {
      fresh = true;
      // "Open new notes in new tab" OFF → swap the current tab's note in place
      const replace = !state._forceTab && state.settings.editor.newTabOnCreate === false;
      const cur = replace ? g.tabs.findIndex((t) => t.noteId === g.activeId && !t.pinned) : -1;
      if (cur >= 0) g.tabs[cur] = { noteId, pinned: g.tabs[cur].pinned };
      else g.tabs.push({ noteId, pinned: false });
    }
    g.activeId = noteId;
    histPush(g.gid, noteId);
    persistWs();
    renderTabs();
    if (fresh) state._freshTabView = state.settings.editor.defaultView || null; // openNote applies it
  }

  /* "Open in new tab" — always spawns a fresh tab, even if the note has one */
  function openInNewTabFlow(noteId) {
    state._forceTab = true;
    openModal();
    openNote(noteId).finally(() => { state._forceTab = false; });
  }

  function noteIconHtml(meta, size = 13) {
    const icon = (meta && meta.icon) || '';
    const color = (meta && meta.color) || 'var(--nh-muted)';
    if (icon.startsWith('svg:')) {
      const key = icon.slice(4);
      const svg = (typeof NH_ICON_LIB !== 'undefined' && NH_ICON_LIB[key]) || '';
      if (svg) return `<span class="nh-nico" style="color:${color}">${svg.replace('<svg', `<svg width="${size}" height="${size}"`)}</span>`;
    }
    if (icon) return `<span class="nh-nico">${escapeHtml(icon)}</span>`;
    const iface = state.settings?.ui?.ifaceIcons?.note || '';
    if (iface.startsWith('svg:') && NH_ICON_LIB[iface.slice(4)]) {
      return `<span class="nh-nico" style="color:${color}">${NH_ICON_LIB[iface.slice(4)].replace('<svg', `<svg width="${size}" height="${size}"`)}</span>`;
    }
    if (iface) return `<span class="nh-nico">${escapeHtml(iface)}</span>`;
    return '';
  }

  function renderTabs() {
    if (!state.ws) return;
    const g = wsFindGroup(state.ws.layout, state.ws.focusGid) || wsFirstGroup(state.ws.layout);
    tabsEl.innerHTML = '';
    for (const tab of g.tabs) {
      const meta = metaOf(tab.noteId);
      if (!meta) continue;
      const el = document.createElement('div');
      el.className = 'nh-tab' + (tab.noteId === g.activeId ? ' active' : '') + (tab.pinned ? ' pinned' : '');
      el.draggable = true;
      el.dataset.noteId = tab.noteId;
      el.innerHTML = `${noteIconHtml(meta) || '<span class="nh-nico nh-nico-dot" style="background:' + (meta.color || '#b28cff') + '"></span>'}<span class="nh-tab-t">${escapeHtml(meta.title)}</span>${tab.pinned ? '' : '<span class="nh-tab-x">✕</span>'}`;
      el.title = meta.title;
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('nh-tab-x')) { void closeTab(tab.noteId, g.gid); return; }
        if (tab.noteId !== state.currentId) void openNote(tab.noteId);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        void tabContextMenu(e.clientX, e.clientY, tab, g);
      });
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/nh-tab', JSON.stringify({ noteId: tab.noteId, gid: g.gid }));
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragover', (e) => {
        if (e.dataTransfer.types.includes('text/nh-tab')) { e.preventDefault(); el.classList.add('nh-drop'); }
      });
      el.addEventListener('dragleave', () => el.classList.remove('nh-drop'));
      el.addEventListener('drop', (e) => {
        e.preventDefault(); el.classList.remove('nh-drop');
        try {
          const d = JSON.parse(e.dataTransfer.getData('text/nh-tab'));
          moveTabWithin(d.noteId, g.gid, tab.noteId);
        } catch (_) { /* noop */ }
      });
      tabsEl.appendChild(el);
    }
    const plus = document.createElement('button');
    plus.className = 'nh-tab nh-tab-plus';
    plus.textContent = '＋';
    plus.title = 'New tab (new note)';
    plus.addEventListener('click', async () => {
      const note = await createNote();
      if (note) { await openNote(note.id); setTimeout(() => { titleInput.focus(); titleInput.select(); }, 80); }
    });
    tabsEl.appendChild(plus);
    syncHistBtns();
    // minis in other panes refresh their active label too
    wsGroupsEl.querySelectorAll('.nh-minitab').forEach((mt) => {
      const gid = mt.closest('.nh-gframe')?.dataset.gid;
      const gg = gid ? wsFindGroup(state.ws.layout, gid) : null;
      if (gg) mt.classList.toggle('active', mt.dataset.noteId === gg.activeId);
    });
  }

  function moveTabWithin(noteId, gid, beforeId) {
    const g = wsFindGroup(state.ws.layout, gid);
    if (!g) return;
    const from = g.tabs.findIndex((t) => t.noteId === noteId);
    if (from < 0) return;
    const [tab] = g.tabs.splice(from, 1);
    let to = g.tabs.findIndex((t) => t.noteId === beforeId);
    if (to < 0) to = g.tabs.length;
    g.tabs.splice(to, 0, tab);
    persistWs(); renderTabs();
  }

  async function closeTab(noteId, gid) {
    const g = wsFindGroup(state.ws.layout, gid);
    if (!g) return;
    const idx = g.tabs.findIndex((t) => t.noteId === noteId);
    if (idx < 0) return;
    if (noteId === state.currentId && gid === state.ws.focusGid) saveNoteSoon.flush();
    g.tabs.splice(idx, 1);
    if (g.activeId === noteId) g.activeId = (g.tabs[Math.max(0, idx - 1)] || g.tabs[0] || {}).noteId || null;
    persistWs(); buildWs();
    if (noteId === state.currentId && gid === state.ws.focusGid && g.activeId) await openNote(g.activeId);
    else renderTabs();
  }

  async function tabContextMenu(x, y, tab, group) {
    const meta = metaOf(tab.noteId);
    if (!meta) return;
    const groupCount = wsAllGroups(state.ws.layout).length;
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x, y },
      items: [
        { key: 'pin', label: tab.pinned ? '📌 Unpin tab' : '📌 Pin tab', active: tab.pinned },
        { key: 'split-r', label: '↔ Split right' },
        { key: 'split-d', label: '↕ Split down' },
        ...(groupCount > 1 ? [{ key: 'close-group', label: '✖ Close this pane' }] : []),
        { key: 'd1', label: '', type: 'divider' },
        { key: 'close', label: '✕ Close tab' },
        { key: 'close-others', label: '🧹 Close other tabs' },
      ],
    });
    if (!selectedKey) return;
    if (selectedKey === 'pin') { tab.pinned = !tab.pinned; persistWs(); renderTabs(); }
    else if (selectedKey === 'split-r') splitCurrent('row', tab.noteId);
    else if (selectedKey === 'split-d') splitCurrent('col', tab.noteId);
    else if (selectedKey === 'close-group') closePane(group.gid);
    else if (selectedKey === 'close') await closeTab(tab.noteId, group.gid);
    else if (selectedKey === 'close-others') {
      group.tabs = group.tabs.filter((t) => t.noteId === tab.noteId || t.pinned);
      if (!group.tabs.some((t) => t.noteId === group.activeId)) group.activeId = tab.noteId;
      persistWs(); buildWs(); renderTabs();
    }
  }

  /* ---------------- panes / splits ---------------- */
  function splitCurrent(dir, noteId) {
    if (!state.ws) return;
    noteId = noteId || state.currentId;
    const gid = wsNewGid();
    state.ws.layout = wsSplit(state.ws.layout, state.ws.focusGid, dir, gid, noteId);
    state.ws.focusGid = gid;
    if (noteId) { histPush(gid, noteId); }
    persistWs(); buildWs();
    if (noteId) wsNoteShown(noteId);
    toast('info', dir === 'row' ? 'Split right — panes side by side ↔' : 'Split down — panes stacked ↕');
  }

  function closePane(gid) {
    if (!state.ws) return;
    const groups = wsAllGroups(state.ws.layout);
    if (groups.length <= 1) return;
    state.ws.layout = wsRemoveGroup(state.ws.layout, gid);
    if (state.ws.focusGid === gid) {
      const first = wsFirstGroup(state.ws.layout);
      state.ws.focusGid = first.gid;
      buildWs();
      if (first.activeId) void openNote(first.activeId);
    } else buildWs();
    persistWs();
  }

  async function focusGroup(gid) {
    if (!state.ws || gid === state.ws.focusGid) return;
    saveNoteSoon.flush();
    state.ws.focusGid = gid;
    persistWs(); buildWs(); renderTabs();
    const g = wsFindGroup(state.ws.layout, gid);
    if (g && g.activeId && g.activeId !== state.currentId) await openNote(g.activeId);
  }

  const paneCache = new Map(); // noteId+updatedAt -> html

  function moveTabToGroup(d, group) {
    if (d.gid === group.gid) return;
    const from = wsFindGroup(state.ws.layout, d.gid);
    const tab = from && from.tabs.find((t) => t.noteId === d.noteId);
    if (!tab) return;
    from.tabs = from.tabs.filter((t) => t.noteId !== d.noteId);
    if (from.activeId === d.noteId) from.activeId = (from.tabs[0] || {}).noteId || null;
    group.tabs.push(tab);
    group.activeId = tab.noteId;
    persistWs(); buildWs(); renderTabs();
  }

  // spec: dragging a tab to the BOTTOM of another pane splits it downward
  function paneTabDrop(e, group) {
    try {
      const d = JSON.parse(e.dataTransfer.getData('text/nh-tab'));
      const rect = e.currentTarget.getBoundingClientRect();
      const frac = (e.clientY - rect.top) / Math.max(1, rect.height);
      if (frac > 0.55) {
        const gidNew = wsNewGid();
        state.ws.layout = wsSplit(state.ws.layout, group.gid, 'col', gidNew, d.noteId);
        const from = wsFindGroup(state.ws.layout, d.gid);
        if (from && d.gid !== group.gid) {
          from.tabs = from.tabs.filter((t) => t.noteId !== d.noteId);
          if (from.activeId === d.noteId) from.activeId = (from.tabs[0] || {}).noteId || null;
        }
        state.ws.focusGid = gidNew;
        persistWs(); buildWs(); renderTabs();
        if (d.noteId !== state.currentId) void openNote(d.noteId);
        toast('info', 'Dropped into a fresh split ↕');
      } else {
        moveTabToGroup(d, group);
      }
    } catch (_) { /* noop */ }
  }
  function buildGroupFrame(group) {
    const focused = group.gid === (state.ws && state.ws.focusGid);
    const fr = document.createElement('div');
    fr.className = 'nh-gframe' + (focused ? ' focused' : '');
    fr.dataset.gid = group.gid;
    if (focused) {
      fr.appendChild(editorEl);
      return fr;
    }
    // unfocused: mini tab strip + reading pane
    const strip = document.createElement('div');
    strip.className = 'nh-minitabs';
    for (const t of group.tabs) {
      const meta = metaOf(t.noteId);
      if (!meta) continue;
      const b = document.createElement('button');
      b.className = 'nh-minitab' + (t.noteId === group.activeId ? ' active' : '');
      b.dataset.noteId = t.noteId;
      b.innerHTML = `${noteIconHtml(meta, 11)}<span>${escapeHtml(meta.title)}</span>`;
      b.title = meta.title;
      b.addEventListener('click', () => {
        group.activeId = t.noteId;
        void focusGroup(group.gid);
      });
      strip.appendChild(b);
    }
    if (!group.tabs.length) strip.innerHTML = '<span class="nh-minitab-empty">empty pane</span>';
    // accept tabs dropped from other strips
    strip.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/nh-tab')) { e.preventDefault(); strip.classList.add('nh-drop'); } });
    strip.addEventListener('dragleave', () => strip.classList.remove('nh-drop'));
    strip.addEventListener('drop', (e) => {
      e.preventDefault(); strip.classList.remove('nh-drop');
      try {
        const d = JSON.parse(e.dataTransfer.getData('text/nh-tab'));
        moveTabToGroup(d, group);
      } catch (_) { /* noop */ }
    });
    const pane = document.createElement('div');
    pane.className = 'nh-pane nh-scroll';
    const meta = metaOf(group.activeId);
    if (meta) {
      const cacheKey = `${meta.id}@${meta.updatedAt}`;
      pane.innerHTML = `<div class="nh-pane-title">${noteIconHtml(meta, 14)}<b>${escapeHtml(meta.title)}</b><span class="nh-pane-edit" title="Edit in this pane">✏️</span></div><div class="nh-pane-body">${paneCache.get(cacheKey) || '<span class="nh-pane-loading">rendering…</span>'}</div>`;
      if (!paneCache.has(cacheKey)) {
        rpc('get_note', { id: meta.id }).then(({ note }) => {
          const html = note ? renderMarkdown(note.content, {}) : '';
          paneCache.set(cacheKey, html);
          const body = pane.querySelector('.nh-pane-body');
          if (body && paneCache.size < 40) { body.innerHTML = html; hydratePaneImages(body); }
        }).catch(() => {});
      } else {
        hydratePaneImages(pane.querySelector('.nh-pane-body'));
      }
      pane.querySelector('.nh-pane-edit').addEventListener('click', (e) => { e.stopPropagation(); void focusGroup(group.gid); });
    } else {
      pane.innerHTML = '<div class="nh-pane-empty">Nothing pinned here.<br>Drop a tab onto this pane, or click a note with the pane focused.</div>';
    }
    pane.addEventListener('click', () => void focusGroup(group.gid));
    pane.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('text/nh-tab')) { e.preventDefault(); pane.classList.add('nh-drop'); }
    });
    pane.addEventListener('dragleave', () => pane.classList.remove('nh-drop'));
    pane.addEventListener('drop', (e) => {
      e.preventDefault(); pane.classList.remove('nh-drop');
      paneTabDrop(e, group);
    });
    fr.append(strip, pane);
    return fr;
  }

  async function hydratePaneImages(rootEl) {
    if (!rootEl) return;
    const imgs = [...rootEl.querySelectorAll('[data-img-id]')];
    const missing = [...new Set(imgs.map((c) => c.getAttribute('data-img-id')).filter(Boolean))].filter((id) => !state.imageCache.has(id));
    await Promise.all(missing.map(async (id) => {
      try { const { dataUrl } = await rpc('get_image', { imageId: id }, 25000); state.imageCache.set(id, dataUrl || ''); }
      catch (_) { state.imageCache.set(id, ''); }
    }));
    rootEl.querySelectorAll('[data-img-id]').forEach((el) => {
      const src = state.imageCache.get(el.getAttribute('data-img-id'));
      if (!src || el.dataset.done) return;
      el.dataset.done = '1';
      const kind = mediaKindOf(src);
      if (el.tagName === 'IMG' && kind === 'image') { el.src = src; el.style.display = ''; }
    });
  }

  function buildWs() {
    if (!state.ws) return;
    wsGroupsEl.innerHTML = '';
    wsGroupsEl.appendChild(buildNode(state.ws.layout));
    renderTabs();
  }

  function buildNode(node) {
    if (node.type === 'group') return buildGroupFrame(node);
    const wrap = document.createElement('div');
    wrap.className = 'nh-split ' + (node.dir === 'col' ? 'col' : 'row');
    const wa = document.createElement('div');
    const wb = document.createElement('div');
    wa.className = 'nh-splitwrap'; wb.className = 'nh-splitwrap';
    wa.style.flexGrow = String(node.ratio); wa.style.flexBasis = '0';
    wb.style.flexGrow = String(1 - node.ratio); wb.style.flexBasis = '0';
    wa.appendChild(buildNode(node.a));
    wb.appendChild(buildNode(node.b));
    const dv = document.createElement('div');
    dv.className = 'nh-divider' + (node.dir === 'col' ? ' v' : '');
    dv.title = 'Drag to resize panes';
    dv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { dv.setPointerCapture(e.pointerId); } catch (_) {}
      dv.classList.add('active');
      const rect = wrap.getBoundingClientRect();
      const onMove = (ev) => {
        const size = node.dir === 'col' ? rect.height : rect.width;
        const pos = (node.dir === 'col' ? ev.clientY - rect.top : ev.clientX - rect.left);
        node.ratio = Math.min(0.85, Math.max(0.15, pos / Math.max(40, size)));
        wa.style.flexGrow = String(node.ratio);
        wb.style.flexGrow = String(1 - node.ratio);
      };
      const onUp = () => {
        dv.classList.remove('active');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        persistWs();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    wrap.append(wa, dv, wb);
    return wrap;
  }

  /* ---------------- window controls: drag · minimize · fullscreen · left grip ---------------- */
  wsMinBtn.addEventListener('click', () => {
    state.settings.ui.minimized = !state.settings.ui.minimized;
    applyUi(); saveSettingsSoon();
  });
  wsFullBtn.addEventListener('click', () => {
    state.fullscreen = !state.fullscreen;
    modalEl.classList.toggle('nh-full', state.fullscreen);
    wsFullBtn.classList.toggle('is-active', state.fullscreen);
    wsFullBtn.innerHTML = state.fullscreen ? ICONS.compress : ICONS.expand; // 2.5.2 — vector states
  });

  let dragPos = null;
  mheadEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || state.fullscreen) return;
    if (e.target.closest('button, input, select, a, .nh-search')) return;
    if ((window.innerWidth || 1280) <= 560) return; // phones keep the sheet
    dragPos = { x: e.clientX, y: e.clientY, rect: modalEl.getBoundingClientRect(), moved: false };
    const onMove = (ev) => {
      if (!dragPos) return;
      const dx = ev.clientX - dragPos.x, dy = ev.clientY - dragPos.y;
      if (!dragPos.moved && Math.hypot(dx, dy) < 5) return;
      dragPos.moved = true;
      mheadEl.classList.add('nh-grabbing');
      modalEl.classList.add('nh-anchored');
      const vw = window.innerWidth || 1280, vh = window.innerHeight || 800;
      const L = Math.min(Math.max(8, dragPos.rect.left + dx), vw - 90);
      const T = Math.min(Math.max(8, dragPos.rect.top + dy), vh - 46);
      modalEl.style.left = `${L}px`;
      modalEl.style.top = `${T}px`;
      dragPos.L = L; dragPos.T = T;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      mheadEl.classList.remove('nh-grabbing');
      if (dragPos && dragPos.moved) {
        state.settings.ui.modalX = dragPos.L;
        state.settings.ui.modalY = dragPos.T;
        saveSettingsSoon();
      }
      dragPos = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  mResizeL.addEventListener('pointerdown', (e) => {
    if ((window.innerWidth || 1280) <= 560) return;
    e.preventDefault(); e.stopPropagation();
    const rect = modalEl.getBoundingClientRect();
    modalEl.classList.add('nh-anchored'); // anchor so the RIGHT edge stays put
    modalEl.style.left = `${rect.left}px`;
    modalEl.style.top = `${rect.top}px`;
    modalEl.style.width = `${rect.width}px`;
    modalEl.style.height = `${rect.height}px`;
    try { mResizeL.setPointerCapture(e.pointerId); } catch (_) {}
    mResizeL.classList.add('active');
    const sx = e.clientX, sy = e.clientY;
    const onMove = (ev) => {
      const vw = window.innerWidth || 1280, vh = window.innerHeight || 800;
      const newL = Math.min(Math.max(8, rect.left + (ev.clientX - sx)), rect.right - 400);
      const w = Math.round(Math.min(Math.max(400, rect.right - newL), vw - 16, 2400));
      const h = Math.round(Math.min(Math.max(320, rect.height + (ev.clientY - sy)), vh - 12, 1600));
      modalEl.style.left = `${newL}px`;
      modalEl.style.width = `${w}px`;
      modalEl.style.height = `${h}px`;
      state.settings.ui.modalX = newL;
      state.settings.ui.modalY = Math.max(8, rect.top);
      state.settings.ui.modalW = w;
      state.settings.ui.modalH = h;
    };
    const onUp = () => {
      mResizeL.classList.remove('active');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      saveSettingsSoon();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  /* ---------------- editor ⋮ menu ---------------- */
  async function duplicateNoteSequential(meta) {
    const titles = state.index.notes.map((n) => n.title);
    const copyTitle = nextCopyName(titles, meta.title);
    const { note } = await rpc('get_note', { id: meta.id });
    const res = await rpc('create_note', { title: copyTitle, content: note ? note.content : '', folderId: meta.folderId });
    state.index = res.index;
    renderList();
    if (state.ws) { const g = wsFindGroup(state.ws.layout, state.ws.focusGid); if (g && !g.tabs.some((t) => t.noteId === res.note.id)) g.tabs.push({ noteId: res.note.id, pinned: false }); persistWs(); renderTabs(); }
    toast('success', `Duplicated as “${copyTitle}”`);
    return res.note;
  }

  edMoreBtn.addEventListener('click', async () => {
    const meta = metaOf(state.currentId);
    if (!meta) return;
    const rect = edMoreBtn.getBoundingClientRect();
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x: Math.max(12, rect.right - 220), y: rect.bottom + 6 },
      items: [
        { key: 'm-read', label: '📖 Reading view', active: state.settings.editor.mode === 'read' },
        { key: 'm-live', label: '✍ Live preview', active: state.settings.editor.mode === 'write' },
        { key: 'm-source', label: '⌨ Source view', active: state.settings.editor.mode === 'source' },
        { key: 'd1', label: '', type: 'divider' },
        { key: 'split-r', label: '↔ Split right' },
        { key: 'split-d', label: '↕ Split down' },
        { key: 'ws-reset', label: '🧹 Reset panes to one' },
        { key: 'd0', label: '', type: 'divider' },
        { key: 'rename', label: '✏️ Rename' },
        { key: 'dup', label: '📑 Duplicate (sequential name)' },
        { key: 'move', label: '📁 Move note to…' },
        { key: 'export', label: '⬇ Export as…' },
        { key: 'find', label: '🔍 Find in note…' },
        { key: 'replace', label: '⇄ Replace…' },
        { key: 'd2', label: '', type: 'divider' },
        { key: 'del', label: '🗑 Delete note', danger: true },
      ],
    });
    if (!selectedKey) return;
    if (selectedKey === 'm-read') applyMode('read');
    else if (selectedKey === 'm-live') applyMode('write');
    else if (selectedKey === 'm-source') applyMode('source');
    else if (selectedKey === 'split-r') splitCurrent('row');
    else if (selectedKey === 'split-d') splitCurrent('col');
    else if (selectedKey === 'ws-reset') resetWorkspaceLayout();
    else if (selectedKey === 'rename') { titleInput.focus(); titleInput.select(); }
    else if (selectedKey === 'dup') { try { await duplicateNoteSequential(meta); } catch (e) { toast('error', e.message); } }
    else if (selectedKey === 'export') {
      const sub = await ctx.ui.showContextMenu({
        position: { x: Math.max(12, rect.right - 220), y: rect.bottom + 6 },
        items: [
          { key: 'md', label: '⬇ Markdown (.md)' },
          { key: 'txt', label: '⬇ Plain text (.txt)' },
        ],
      });
      if (sub.selectedKey === 'md') exportNoteMarkdown(meta);
      else if (sub.selectedKey === 'txt') {
        try {
          const { note } = await rpc('get_note', { id: meta.id });
          if (note) {
            downloadText(safeFilename(meta.title, 'txt'), note.content, 'text/plain');
            toast('success', 'Exported as plain .txt');
          }
        } catch (err) { toast('error', err.message); }
      }
    }
    else if (selectedKey === 'find') openFind(true);
    else if (selectedKey === 'replace') { openFind(false); replaceIn.focus(); }
    else if (selectedKey === 'del') deleteNote(meta.id);
    else if (selectedKey === 'move') {
      const sub = await ctx.ui.showContextMenu({
        position: { x: Math.max(12, rect.right - 220), y: rect.bottom + 6 },
        items: [
          { key: 'inbox', label: '📥 Inbox', active: !meta.folderId },
          ...state.index.folders.map((f) => ({ key: f.id, label: `${f.icon && !f.icon.startsWith('img:') ? f.icon.replace('svg:', '🔧 ') : '📁'} ${f.name}`, active: meta.folderId === f.id })),
        ],
      });
      if (sub.selectedKey) await moveNotes([meta.id], sub.selectedKey === 'inbox' ? null : sub.selectedKey);
    }
  });

  /* ---------------- find & replace (operates on the source of truth) ---------------- */
  const findIn = findbar.querySelector('.nh-find-in');
  const findCount = findbar.querySelector('.nh-find-count');
  const replaceIn = findbar.querySelector('.nh-replace-in');

  function findEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function findAll(q) {
    if (!q || !state.current) return [];
    const rx = new RegExp(findEsc(q), 'gi');
    const out = [];
    let m;
    const c = state.current.content;
    while ((m = rx.exec(c))) {
      out.push([m.index, m.index + m[0].length]);
      if (m[0].length === 0) rx.lastIndex++;
      if (out.length > 5000) break;
    }
    return out;
  }
  function syncFindCount() {
    state.findMatches = findAll(findIn.value);
    if (state.findIdx >= state.findMatches.length) state.findIdx = state.findMatches.length - 1;
    findCount.textContent = state.findMatches.length
      ? `${state.findIdx + 1}/${state.findMatches.length}`
      : (findIn.value ? '0 matches' : '');
  }
  function openFind(focusIt) {
    findbar.classList.add('on');
    if (focusIt) { findIn.focus(); findIn.select(); }
  }
  function closeFind() { findbar.classList.remove('on'); }
  function jumpToMatch() {
    const m = state.findMatches[state.findIdx];
    if (!m) return;
    if (state.settings.editor.mode !== 'source') applyMode('source'); // selection lives in the textarea
    sourceEl.value = state.current.content;
    sourceEl.focus();
    sourceEl.setSelectionRange(m[0], m[1]);
    // approximate scroll so the match is in view
    const lines = state.current.content.slice(0, m[0]).split('\n').length;
    sourceEl.scrollTop = Math.max(0, lines - 4) * 19;
  }
  function stepMatch(dir) {
    syncFindCount();
    if (!state.findMatches.length) return;
    state.findIdx = (state.findIdx + dir + state.findMatches.length) % state.findMatches.length;
    syncFindCount();
    jumpToMatch();
  }
  function applyContentSynced(content) {
    if (!state.current) return;
    state.current.content = content;
    sourceEl.value = content;
    renderStatus();
    saveNoteSoon();
    if (state.settings.editor.mode !== 'source') renderPreview();
  }
  findbar.querySelector('.nh-find-next').addEventListener('click', () => stepMatch(1));
  findbar.querySelector('.nh-find-prev').addEventListener('click', () => stepMatch(-1));
  findbar.querySelector('.nh-find-close').addEventListener('click', closeFind);
  findbar.querySelector('.nh-replace-one').addEventListener('click', () => {
    syncFindCount();
    const m = state.findMatches[state.findIdx];
    if (!m || !state.current) return;
    const c = state.current.content;
    applyContentSynced(c.slice(0, m[0]) + replaceIn.value + c.slice(m[1]));
    syncFindCount();
    jumpToMatch();
  });
  findbar.querySelector('.nh-replace-all').addEventListener('click', () => {
    const q = findIn.value;
    if (!q || !state.current) return;
    const n = findAll(q).length;
    applyContentSynced(state.current.content.replace(new RegExp(findEsc(q), 'gi'), replaceIn.value));
    syncFindCount();
    toast('success', `Replaced ${n} occurrence(s)`);
  });
  findIn.addEventListener('input', () => { state.findIdx = 0; syncFindCount(); });
  findIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); stepMatch(e.shiftKey ? -1 : 1); }
    else if (e.key === 'Escape') { e.stopPropagation(); closeFind(); }
  });
  replaceIn.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeFind(); } });
  modalEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      if (e.target === findIn || e.target === replaceIn) return;
      if (e.target === searchInput) return; // don't steal from the note search
      e.preventDefault();
      openFind(true);
    }
  });


  /* ==================================================== */
  /* 2.1 EXTENSION SETTINGS — editor behaviour & display   */
  /* ==================================================== */
  function applyEditorPrefs() {
    const e = state.settings.editor;
    const u = state.settings.ui;
    modeGroupEl.style.display = e.showMode === false ? 'none' : '';
    preview.spellcheck = !!e.spellcheck;
    sourceEl.spellcheck = !!e.spellcheck;
    try { preview.lang = e.spellLang || ''; sourceEl.lang = e.spellLang || ''; } catch (_) {}
    canvas.classList.toggle('nh-rll', !!e.readableLength);
    canvas.classList.toggle('nh-guides-ed', !!e.guidesEditor);
    canvas.classList.toggle('nh-rtl', !!e.rtl);
    modalEl.style.setProperty('--nh-editor-lh', String(e.lineHeight || 1.65));
    sourceEl.style.tabSize = String(e.indentWidth || 4);
    gutterEl.style.display = e.lineNumbers ? '' : 'none';
    navBody.classList.toggle('nh-guides-tree', u.navGuides !== false);
    navBody.classList.toggle('nh-color-labels', u.navColorIconsOnly === false);
    syncGutter();
  }

  /* 2.5.9 — wrap-aware line numbers. A long paragraph WRAPS into several
     visual rows, but the old gutter numbered only logical lines, so every
     number below drifted off its text (your screenshot). We measure each
     logical line's real wrapped height in a hidden mirror styled exactly
     like the textarea, and give each gutter row that exact pixel height.
     Per-line caching + a typing debounce keep big notes fast. */
  const gutterMirror = document.createElement('div');
  gutterMirror.setAttribute('aria-hidden', 'true');
  gutterMirror.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;margin:0;border:0;padding:0;white-space:pre-wrap;overflow-wrap:break-word;';
  (document.body || document.documentElement).appendChild(gutterMirror);
  disposers.push(() => gutterMirror.remove());
  const gLineHCache = new Map();
  const gFontKey = { v: '' };
  function syncGutter() {
    if (!state.settings.editor.lineNumbers) { gutterEl.textContent = ''; return; }
    const lines = (sourceEl.value || '').split('\n');
    const cs = getComputedStyle(sourceEl);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const w = Math.max(40, sourceEl.clientWidth - padL - padR); // the textarea's real content width
    const fk = `${cs.fontSize}|${cs.lineHeight}|${cs.fontFamily}|${cs.tabSize}|${Math.round(w)}`;
    if (fk !== gFontKey.v) { gLineHCache.clear(); gFontKey.v = fk; } // font/zoom/width changed
    const ms = gutterMirror.style;
    ms.fontFamily = cs.fontFamily; ms.fontSize = cs.fontSize; ms.lineHeight = cs.lineHeight;
    ms.letterSpacing = cs.letterSpacing; ms.tabSize = cs.tabSize; ms.width = `${Math.round(w)}px`;
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i];
      const key = fk + '|' + t;
      let h = gLineHCache.get(key);
      if (!h) {
        gutterMirror.textContent = t === '' ? ' ' : t;
        h = gutterMirror.offsetHeight || (parseFloat(cs.lineHeight) || 22);
        if (gLineHCache.size > 6000) gLineHCache.clear();
        gLineHCache.set(key, h);
      }
      rows.push(`<div class="nh-gl" style="height:${h}px">${i + 1}</div>`);
    }
    gutterEl.innerHTML = rows.join('');
    gutterEl.scrollTop = sourceEl.scrollTop;
  }
  const syncGutterSoon = debounce(() => syncGutter(), 110);
  sourceEl.addEventListener('scroll', () => { gutterEl.scrollTop = sourceEl.scrollTop; });
  sourceEl.addEventListener('input', syncGutterSoon);

  /* smart source-mode keys: Tab indent, auto-pair, smart lists */
  const NH_PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
  sourceEl.addEventListener('keydown', (e) => {
    const ed = state.settings.editor;
    if (e.key === 'Tab') {
      e.preventDefault();
      const piece = ed.indentTabs ? '\t' : ' '.repeat(Math.max(1, ed.indentWidth || 4));
      const s = sourceEl.selectionStart, en = sourceEl.selectionEnd;
      if (s === en) sourceEl.setRangeText(piece, s, en, 'end');
      else {
        const start = sourceEl.value.lastIndexOf('\n', s - 1) + 1;
        const chunk = sourceEl.value.slice(start, en).split('\n').map((l) => piece + l).join('\n');
        sourceEl.setRangeText(chunk, start, en, 'end');
      }
      sourceEl.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (ed.autoPair && NH_PAIRS[e.key] && !e.ctrlKey && !e.metaKey) {
      const s = sourceEl.selectionStart, en = sourceEl.selectionEnd;
      const close = NH_PAIRS[e.key];
      if (s === en && close !== e.key && sourceEl.value[s] === close) { sourceEl.setSelectionRange(s + 1, s + 1); e.preventDefault(); return; }
      e.preventDefault();
      const sel = sourceEl.value.slice(s, en);
      sourceEl.setRangeText(e.key + sel + close, s, en, sel ? 'end' : 'start');
      if (!sel) sourceEl.setSelectionRange(s + 1, s + 1);
      else sourceEl.setSelectionRange(s + 1, en + 1);
      sourceEl.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (e.key === 'Enter' && ed.smartLists && !e.shiftKey && !e.ctrlKey) {
      const v = sourceEl.value, s = sourceEl.selectionStart;
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const line = v.slice(lineStart, s);
      const m = line.match(/^(\s*)((?:[-*+]|\d+\.)\s+(?:\[[ x]\]\s+)?)/);
      if (m) {
        const [, indent, marker] = m;
        e.preventDefault();
        if (line.trim() === marker.trim()) {
          // empty item → drop the marker, leave a clean newline
          sourceEl.setRangeText('', lineStart, s, 'end');
          sourceEl.setRangeText('\n', lineStart, lineStart, 'end');
          sourceEl.setSelectionRange(lineStart + 1, lineStart + 1);
        } else {
          let next = marker.replace(/^\d+/, (d) => String(+d + 1)).replace(/\[[ x]\]/, '[ ]');
          sourceEl.setRangeText('\n' + indent + next, s, sourceEl.selectionEnd, 'end');
        }
        sourceEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  /* fold headings & indents — reading view, tap-to-collapse (session-scoped) */
  preview.addEventListener('click', (e) => {
    const ed = state.settings.editor;
    if (state.settings.editor.mode !== 'read') return;
    if (e.target.closest('input, a, button')) return;
    const h = e.target.closest('h1,h2,h3,h4,h5,h6');
    if (h && ed.foldHeading) {
      const lvl = Number(h.tagName[1]);
      const hide = !h.classList.contains('nh-folded');
      h.classList.toggle('nh-folded', hide);
      let sib = h.nextElementSibling;
      while (sib) {
        if (/^H[1-6]$/.test(sib.tagName) && Number(sib.tagName[1]) <= lvl) break;
        sib.style.display = hide ? 'none' : '';
        sib = sib.nextElementSibling;
      }
      return;
    }
    if (ed.foldIndent) {
      const li = e.target.closest('li');
      if (li) {
        const sub = li.querySelector(':scope > ul, :scope > ol');
        if (sub) {
          const hide = sub.style.display !== 'none';
          sub.style.display = hide ? 'none' : '';
          li.classList.toggle('nh-folded-li', hide);
        }
      }
    }
  });

  /* folder breadcrumb chip */
  function refreshCrumb() {
    const meta = metaOf(state.currentId);
    const f = meta && meta.folderId ? (state.index.folders || []).find((x) => x.id === meta.folderId) : null;
    crumbEl.textContent = `${f ? '📁' : '📥'} ${f ? f.name : 'Inbox'}`;
    crumbEl.title = f ? `In folder “${f.name}” — long-press/right-click the 🗂 tree to organize` : 'Unfiled — lives in Inbox';
    crumbEl.style.color = f && f.color ? f.color : 'var(--nh-muted)';
  }

  /* ==================================================== */
  /* Boot                                                  */
  /* ==================================================== */

  (async () => {
    try {
      // 2.2.4 — the backend may still be waking up (fresh update / cold
      // worker): retry the handshake, then DEGRADE instead of dying. A red
      // "failed to start: request timed out" toast + a dead extension was the
      // old behavior; now the UI always opens and simply re-syncs on reopen.
      const attemptLoad = () => Promise.all([
        rpc('get_settings', {}, 45000),
        rpc('list_notes', {}, 45000),
        rpc('get_logo', {}, 45000),
      ]);
      let settings = null, index = { notes: [], folders: [] }, dataUrl = null, awake = false, lastErr = null;
      for (let attempt = 1; attempt <= 3 && !awake; attempt++) {
        try {
          const pack = await attemptLoad();
          settings = pack[0] ? pack[0].settings : null;
          index = (pack[1] && pack[1].index) || { notes: [], folders: [] };
          dataUrl = pack[2] ? pack[2].dataUrl : null;
          awake = true;
        } catch (err) {
          lastErr = err;
          if (attempt < 3) {
            toast('info', `Notehaven is waking the backend… (attempt ${attempt}/3)`);
            await new Promise((r) => setTimeout(r, 1800));
          }
        }
      }
      if (!awake) {
        toast('warning', `Notehaven backend didn't answer (${lastErr?.message || 'timeout'}) — opened with defaults; your notes are safe, close & reopen in a few seconds.`);
      } else if (!settings) {
        toast('warning', 'Notehaven: saved settings unreadable — using defaults (your notes are safe).');
      }
      state.settings = settings || JSON.parse(JSON.stringify(state.settings));
      // forward-compatible defaults for older saves (theme & collapsed arrive with 1.6)
      state.settings.ui = { theme: 'auto', collapsed: [], bgImageId: '', bgDim: 0.85, navSort: 'updated-desc', navOrder: ['shortcuts', 'recent', 'tree', 'tags'], navSearch: false, ...state.settings.ui };
      if (!Array.isArray(state.settings.ui.collapsed)) state.settings.ui.collapsed = [];
      state.index = index;
      if (dataUrl) state.logoSrc = dataUrl;
      if (state.settings.ui.bgImageId) {
        try {
          const bg = await rpc('get_image', { imageId: state.settings.ui.bgImageId });
          state.bgSrc = bg.dataUrl || null;
        } catch (_) { state.bgSrc = null; }
      }

      if (!['write', 'read', 'source'].includes(state.settings.editor.mode)) state.settings.editor.mode = 'write';
      // 2.1 editor preferences (merge keeps older saves alive)
      state.settings.editor = { ...NH_EDITOR_DEFAULTS, ...state.settings.editor };
      state.settings.ui = { ...NH_UI_DEFAULTS, ...state.settings.ui };
      state.settings.ui.navCounters = { ...NH_UI_DEFAULTS.navCounters, ...(state.settings.ui.navCounters || {}) };
      state.settings.ui.ifaceIcons = { ...NH_UI_DEFAULTS.ifaceIcons, ...(state.settings.ui.ifaceIcons || {}) };
      // 2.4.1 — the logo block was never merged at boot: an old/corrupt save
      // without it (or a garbage size) made createHalo() throw and the Halo
      // silently never existed. Merge it like every other settings section.
      if ('phoneFloat' in state.settings.ui) delete state.settings.ui.phoneFloat; // 2.5.3 — legacy key, semantics inverted
      state.settings.logo = { size: 64, visible: true, snapToEdge: true, x: null, y: null, opacity: 1, backdrop: true, ...(state.settings.logo || {}) }; // 2.5.4 — new keys default in without touching saved ones
      if (!Number.isFinite(state.settings.logo.size) || state.settings.logo.size < 24 || state.settings.logo.size > 256) state.settings.logo.size = 64;
      wsInit(); // rebuild tabs/groups/splits from the saved layout
      canvas.classList.add(`nh-mode-${state.settings.editor.mode}`);
      modeBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.mode === state.settings.editor.mode));
      preview.setAttribute('contenteditable', state.settings.editor.mode === 'write' ? 'true' : 'false');
      toolbar.style.display = state.settings.editor.mode === 'read' ? 'none' : '';
      applyUi();

      try { createHalo(); } catch (haloErr) {
        // the logo must survive even if the rest of boot had a hiccup
        toast('warning', `Notehaven logo failed: ${haloErr?.message || haloErr}`);
      }
      // 2.4.1 — rescue kit: if the bubble STILL isn't on the page a moment
      // later, force sane defaults and rebuild it, out loud. This can only
      // make the Halo APPEAR, never hide it.
      setTimeout(() => {
        try {
          if (!haloBubbleEl || !haloBubbleEl.isConnected) {
            state.settings.logo.visible = true;
            state.settings.logo.x = null;
            state.settings.logo.y = null;
            createHalo();
            if (!state.settings.ui.quietBoot) toast('info', 'Halo rescued ✨ the floating logo is back — drag it anywhere.'); // 2.6.4
          } else if (!state.settings.logo.visible && !state.settings.ui.quietBoot) {
            toast('info', "The Halo is hidden by your settings — bring it back via the Extras 'toggle-halo' action, or Settings → Logo → Show logo."); // 2.6.4
          }
        } catch (_) {}
      }, 2000);
      syncInputBarLabel();
      renderList();
      refreshDrawerRecent();

      const first = [...index.notes].sort((a, b) => (b.pinned - a.pinned))[0] || index.notes[0];
      const lastActive = state.ws && wsFindGroup(state.ws.layout, state.ws.focusGid)?.activeId;
      const resume = lastActive && metaOf(lastActive) ? metaOf(lastActive) : first;
      if (resume) {
        // preload the resume note so the modal opens instantly
        const { note } = await rpc('get_note', { id: resume.id });
        if (note) {
          state.currentId = resume.id;
          state.current = { id: note.id, title: note.title, content: note.content };
          titleInput.value = note.title;
          renderList(); refreshPinBtn(); renderStatus(); renderPreview();
        }
        wsNoteShown(resume.id);
        buildWs(); // seat the editor into the focused pane, panes render their own views
        if (state._wsHealed) { state._wsHealed = false; toast('info', 'Mended your workspace — stray empty panes removed ✨'); }
        applyEditorPrefs();
        applyUi(); // positions/minimize apply AFTER structure exists
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
