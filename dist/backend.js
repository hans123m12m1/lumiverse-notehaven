/**
 * Notehaven — backend module (Spindle / Lumiverse)
 *
 * Responsibilities:
 *  - Per-user storage of notes, images, logo and settings (spindle.userStorage)
 *  - Request/response message handling for the frontend module
 *  - {{note::Title}} macro for injecting notes into prompts
 *
 * Everything is stored as TEXT (JSON / base64 data URLs) because
 * spindle.userStorage is a text API — this keeps the extension free-tier
 * friendly — and needs NO special backend capabilities at all.
 */

'use strict';

/* ------------------------------------------------------------------ */
/* Storage layout (per user)                                           */
/* ------------------------------------------------------------------ */
/*
 *  index.json            { notes: [ NoteMeta ] }
 *  notes/<id>.json       { id, title, content, createdAt, updatedAt }
 *  images/<imgId>.txt    base64 data URL
 *  logo.txt              base64 data URL for the chat logo
 *  settings.json         { logo: {size,visible,x,y,snap}, editor: {mode} }
 *
 * NoteMeta: { id, title, color, pinned, tags[], snippet, words,
 *             imageIds[], createdAt, updatedAt }
 */

const INDEX_FILE = 'index.json';
const SETTINGS_FILE = 'settings.json';
const LOGO_FILE = 'logo.txt';

const NOTE_COLORS = ['#b28cff', '#ff8fb3', '#ffcf7a', '#8fe3c0', '#8fc9ff'];
const MAX_DATA_URL_LEN = 24 * 1024 * 1024; // ~24 MB text guard (≈16 MB files after base64)

const UI_DEFAULTS = () => ({
  customCSS: '',
  accent: '',          // '' → follow the app accent
  modalOpacity: 1,
  backdropDim: 0.6,
  backdropBlur: 3,
  fontSize: 13.5,
  radius: 14,
  railWidth: 224,      // notes rail width in px
  modalW: 0,           // 0 → auto (CSS default); otherwise px
  modalH: 0,           // 0 → auto; otherwise px
  bgImageId: '',       // custom background picture (an imageId); '' → none
  bgDim: 0.85,         // veil opacity over the background so text stays readable
});

const DEFAULT_SETTINGS = () => ({
  // x/y: null → the frontend parks the Halo near the bottom-right corner
  logo: { size: 64, visible: true, snapToEdge: true, x: null, y: null },
  editor: { mode: 'write' }, // 'write' | 'read' (single live-preview surface)
  ui: UI_DEFAULTS(),
});

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

function notePath(id) {
  return `notes/${id}.json`;
}

function imagePath(imageId) {
  return `images/${imageId}.txt`;
}

// in-flight chunked uploads live apart from finished media (and get swept after use)
function uploadMetaPath(uploadId) {
  return `uploads/${uploadId}.meta.json`;
}

function uploadPartPath(uploadId, index) {
  return `uploads/${uploadId}.${index}.part`;
}

function extractTags(content) {
  const tags = new Set();
  const re = /(?:^|[\s,(])#([A-Za-z0-9_/-]{1,32})/g;
  let m;
  while ((m = re.exec(content || '')) !== null) tags.add(m[1]);
  return [...tags].slice(0, 24);
}

function extractImageIds(content) {
  const ids = new Set();
  const re = /!\[[^\]]*\]\(nh-img:\/\/([A-Za-z0-9_-]+)\)/g;
  let m;
  while ((m = re.exec(content || '')) !== null) ids.add(m[1]);
  return [...ids];
}

function wordCount(content) {
  const t = (content || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

function makeSnippet(content) {
  const text = (content || '')
    .replace(/!\[[^\]]*\]\(nh-img:\/\/[A-Za-z0-9_-]+\)/g, '[image]')
    .replace(/[#>*`\-[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 140);
}

async function readIndex(userId) {
  const idx = await spindle.userStorage.getJson(INDEX_FILE, {
    fallback: { notes: [], folders: [] },
    userId,
  });
  if (!idx || !Array.isArray(idx.notes)) return { notes: [], folders: [] };
  if (!Array.isArray(idx.folders)) idx.folders = [];
  return idx;
}

async function writeIndex(index, userId) {
  await spindle.userStorage.setJson(INDEX_FILE, index, { indent: 2, userId });
}

async function readSettings(userId) {
  const s = await spindle.userStorage.getJson(SETTINGS_FILE, {
    fallback: DEFAULT_SETTINGS(),
    userId,
  });
  // Merge over defaults so new fields appear for old installs
  const d = DEFAULT_SETTINGS();
  return {
    logo: { ...d.logo, ...(s && s.logo ? s.logo : {}) },
    editor: { ...d.editor, ...(s && s.editor ? s.editor : {}) },
    ui: { ...d.ui, ...(s && s.ui ? s.ui : {}) },
  };
}

function assertDataUrl(dataUrl, imageOnly = false) {
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_DATA_URL_LEN) return false;
  return imageOnly ? dataUrl.startsWith('data:image/') : /^data:(image|video|audio)\//.test(dataUrl);
}

/* ------------------------------------------------------------------ */
/* First-run welcome note                                              */
/* ------------------------------------------------------------------ */

const WELCOME_CONTENT = [
  '# Welcome to Notehaven 🌙',
  '',
  'A cozy little haven for your thoughts, right inside Lumiverse.',
  '',
  '## Things to try',
  '',
  '- [ ] Press the **＋ New note** button up top',
  '- [ ] Rename this note by clicking its title',
  '- [ ] Right-click (or long-press) a note in the list to pin, recolor, or delete it',
  '- [ ] Link notes together with [[double brackets]] — pink links create the note for you',
  '- [ ] Add #tags anywhere and filter them with the search bar',
  '- [ ] Drop images in with the 🖼 button — they render right in the editor',
  '- [ ] Tick checkboxes straight in the text — no preview needed',
  '- [ ] Tap **＋** in the folder bar to make folders — drag notes onto them (or use 📁 Move to…)',
  '- [ ] Right-click a folder chip for emoji/image icons and rename',
  '- [ ] Hit ☑ at the top of the list to multi-select, move, or bulk delete',
  '- [ ] Open ⚙ Settings to dress the UI up: accent, transparency, radius, custom CSS, themes',
  '',
  '## The Halo (your chat logo)',
  '',
  'Open the **Halo** tab in the sidebar to upload your own logo, resize it,',
  'or hide it entirely. Tap it to pop this window open — it parks quietly at',
  'the edge of your screen. Right-click (long-press on phones) for size presets.',
  '',
  '## Prompt magic',
  '',
  'Insert any note into a prompt with the macro:',
  '',
  '`{{note::Welcome to Notehaven 🌙}}`',
  '',
  'And use the **⋯ menu** up top to export your notes or import .md / .json files.',
  '',
  'Happy writing ✨',
].join('\n');

async function seedWelcomeNote(userId) {
  const now = new Date().toISOString();
  const note = {
    id: newId('note'),
    title: 'Welcome to Notehaven 🌙',
    content: WELCOME_CONTENT,
    createdAt: now,
    updatedAt: now,
  };
  await spindle.userStorage.setJson(notePath(note.id), note, { indent: 2, userId });
  const index = {
    notes: [{
      id: note.id,
      title: note.title,
      color: NOTE_COLORS[0],
      pinned: true,
      folderId: null,
      tags: extractTags(note.content),
      snippet: makeSnippet(note.content),
      words: wordCount(note.content),
      imageIds: [],
      createdAt: now,
      updatedAt: now,
    }],
    folders: [],
  };
  await writeIndex(index, userId);
  return index;
}

/* ------------------------------------------------------------------ */
/* Request handlers                                                    */
/* ------------------------------------------------------------------ */

const handlers = {
  /* ---------------- notes ---------------- */

  async list_notes(_p, userId) {
    const index = await readIndex(userId);
    if (index.notes.length === 0) return { index: await seedWelcomeNote(userId) };
    return { index };
  },

  async get_note(p, userId) {
    const note = await spindle.userStorage.getJson(notePath(p.id), {
      fallback: null,
      userId,
    });
    return { note };
  },

  async create_note(p, userId) {
    const now = new Date().toISOString();
    const note = {
      id: newId('note'),
      title: (p.title || '').trim() || 'Untitled Note',
      content: p.content || '',
      createdAt: now,
      updatedAt: now,
    };
    await spindle.userStorage.setJson(notePath(note.id), note, { indent: 2, userId });

    const index = await readIndex(userId);
    const folderId = index.folders.some((f) => f.id === p.folderId) ? p.folderId : null;
    index.notes.unshift({
      id: note.id,
      title: note.title,
      color: NOTE_COLORS[index.notes.length % NOTE_COLORS.length],
      pinned: false,
      folderId,
      tags: extractTags(note.content),
      snippet: makeSnippet(note.content),
      words: wordCount(note.content),
      imageIds: [],
      createdAt: now,
      updatedAt: now,
    });
    await writeIndex(index, userId);
    return { note, index };
  },

  async save_note(p, userId) {
    const index = await readIndex(userId);
    const meta = index.notes.find((n) => n.id === p.id);
    if (!meta) throw new Error(`Note not found: ${p.id}`);

    const now = new Date().toISOString();
    const title = (p.title || '').trim() || 'Untitled Note';
    const content = typeof p.content === 'string' ? p.content : '';
    const keepIds = extractImageIds(content);

    // Garbage-collect images that were removed from the note
    const doomed = (meta.imageIds || []).filter((id) => !keepIds.includes(id));
    for (const imgId of doomed) {
      try { await spindle.userStorage.delete(imagePath(imgId), userId); } catch (_) { /* already gone */ }
    }

    const previous = await spindle.userStorage.getJson(notePath(p.id), { fallback: null, userId });
    const note = {
      id: p.id,
      title,
      content,
      createdAt: previous?.createdAt || meta.createdAt || now,
      updatedAt: now,
    };
    await spindle.userStorage.setJson(notePath(p.id), note, { indent: 2, userId });

    meta.title = title;
    meta.tags = extractTags(content);
    meta.snippet = makeSnippet(content);
    meta.words = wordCount(content);
    meta.imageIds = keepIds;
    meta.updatedAt = now;
    await writeIndex(index, userId);

    return { meta, index };
  },

  async delete_note(p, userId) {
    const index = await readIndex(userId);
    const meta = index.notes.find((n) => n.id === p.id);
    index.notes = index.notes.filter((n) => n.id !== p.id);

    try { await spindle.userStorage.delete(notePath(p.id), userId); } catch (_) { /* noop */ }
    for (const imgId of meta?.imageIds || []) {
      try { await spindle.userStorage.delete(imagePath(imgId), userId); } catch (_) { /* noop */ }
    }
    await writeIndex(index, userId);
    return { index };
  },

  async set_meta(p, userId) {
    const index = await readIndex(userId);
    const meta = index.notes.find((n) => n.id === p.id);
    if (!meta) throw new Error(`Note not found: ${p.id}`);
    if (typeof p.pinned === 'boolean') meta.pinned = p.pinned;
    if (typeof p.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.color)) meta.color = p.color;
    await writeIndex(index, userId);
    return { meta, index };
  },

  /* ---------------- images ---------------- */

  async put_image(p, userId) {
    if (!assertDataUrl(p.dataUrl)) throw new Error('Invalid or oversized media data (max ~16 MB files)');
    const imageId = newId('img');
    await spindle.userStorage.write(imagePath(imageId), p.dataUrl, userId);
    return { imageId, name: (p.name || 'image').replace(/[[\]()]/g, '') };
  },

  /* ------------- chunked uploads (big files survive message-size caps) ------------- */

  async begin_upload(p, userId) {
    const parts = Number(p.parts) | 0;
    if (parts < 1 || parts > 256) throw new Error('Bad part count');
    const imageId = newId('img');
    await spindle.userStorage.setJson(uploadMetaPath(imageId), { parts, name: String(p.name || 'media').slice(0, 120) }, { userId });
    return { imageId };
  },

  async put_upload_part(p, userId) {
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(p.imageId || '')) throw new Error('Bad upload id');
    const index = Number(p.index) | 0;
    if (index < 0 || index > 255) throw new Error('Bad part index');
    if (typeof p.data !== 'string' || p.data.length > 1024 * 1024) throw new Error('Bad part data');
    await spindle.userStorage.write(uploadPartPath(p.imageId, index), p.data, userId);
    return { ok: true };
  },

  async commit_upload(p, userId) {
    const meta = await spindle.userStorage.getJson(uploadMetaPath(p.imageId), { fallback: null, userId });
    if (!meta) throw new Error('Upload expired — try again');
    let dataUrl = '';
    for (let i = 0; i < meta.parts; i++) dataUrl += await spindle.userStorage.read(uploadPartPath(p.imageId, i), userId);
    for (let i = 0; i < meta.parts; i++) { try { await spindle.userStorage.delete(uploadPartPath(p.imageId, i), userId); } catch (_) { /* noop */ } }
    try { await spindle.userStorage.delete(uploadMetaPath(p.imageId), userId); } catch (_) { /* noop */ }
    if (!assertDataUrl(dataUrl, !!p.logo)) throw new Error('Invalid or oversized media data (max ~16 MB files)');
    if (p.logo) { await spindle.userStorage.write(LOGO_FILE, dataUrl, userId); return { ok: true }; }
    await spindle.userStorage.write(imagePath(p.imageId), dataUrl, userId);
    return { imageId: p.imageId, name: (meta.name || p.name || 'media').replace(/[[\\]()]/g, '') };
  },

  async abort_upload(p, userId) {
    const meta = await spindle.userStorage.getJson(uploadMetaPath(p.imageId), { fallback: null, userId });
    if (meta) {
      for (let i = 0; i < meta.parts; i++) { try { await spindle.userStorage.delete(uploadPartPath(p.imageId, i), userId); } catch (_) { /* noop */ } }
    }
    try { await spindle.userStorage.delete(uploadMetaPath(p.imageId), userId); } catch (_) { /* noop */ }
    return { ok: true };
  },

  async get_image(p, userId) {
    const exists = await spindle.userStorage.exists(imagePath(p.imageId), userId);
    if (!exists) return { dataUrl: null };
    const dataUrl = await spindle.userStorage.read(imagePath(p.imageId), userId);
    return { dataUrl };
  },

  async delete_image(p, userId) {
    try { await spindle.userStorage.delete(imagePath(p.imageId), userId); } catch (_) { /* noop */ }
    return { ok: true };
  },

  /* ---------------- logo + settings ---------------- */

  async put_logo(p, userId) {
    if (p.dataUrl === null || p.dataUrl === '') {
      try { await spindle.userStorage.delete(LOGO_FILE, userId); } catch (_) { /* noop */ }
      return { ok: true };
    }
    if (!assertDataUrl(p.dataUrl, true)) throw new Error('Logo must be an image (png/jpg/webp/gif/svg)');
    await spindle.userStorage.write(LOGO_FILE, p.dataUrl, userId);
    return { ok: true };
  },

  async get_logo(_p, userId) {
    const exists = await spindle.userStorage.exists(LOGO_FILE, userId);
    if (!exists) return { dataUrl: null };
    const dataUrl = await spindle.userStorage.read(LOGO_FILE, userId);
    return { dataUrl };
  },

  async get_settings(_p, userId) {
    return { settings: await readSettings(userId) };
  },

  async save_settings(p, userId) {
    const current = await readSettings(userId);
    const next = {
      logo: { ...current.logo, ...(p.settings?.logo || {}) },
      editor: { ...current.editor, ...(p.settings?.editor || {}) },
      ui: { ...current.ui, ...(p.settings?.ui || {}) },
    };
    // clamp + sanitize
    next.logo.size = Math.min(256, Math.max(24, Number(next.logo.size) || 64));
    next.logo.visible = !!next.logo.visible;
    next.logo.snapToEdge = !!next.logo.snapToEdge;
    next.logo.x = next.logo.x === null ? null : (Number.isFinite(Number(next.logo.x)) ? Number(next.logo.x) : null);
    next.logo.y = next.logo.y === null ? null : (Number.isFinite(Number(next.logo.y)) ? Number(next.logo.y) : null);
    if (!['write', 'read'].includes(next.editor.mode)) next.editor.mode = 'write';

    const clampN = (v, lo, hi, dflt) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
    };
    next.ui.customCSS = String(next.ui.customCSS ?? '').slice(0, 20000);
    next.ui.accent = /^#[0-9a-fA-F]{6}$/.test(next.ui.accent || '') ? next.ui.accent : '';
    next.ui.modalOpacity = clampN(next.ui.modalOpacity, 0.55, 1, 1);
    next.ui.backdropDim = clampN(next.ui.backdropDim, 0, 0.9, 0.6);
    next.ui.backdropBlur = clampN(next.ui.backdropBlur, 0, 24, 3);
    next.ui.fontSize = clampN(next.ui.fontSize, 11, 17, 13.5);
    next.ui.radius = clampN(next.ui.radius, 0, 24, 14);
    next.ui.railWidth = clampN(next.ui.railWidth, 170, 420, 224);
    next.ui.modalW = next.ui.modalW === 0 || next.ui.modalW === '0' ? 0 : clampN(next.ui.modalW, 560, 2400, 0);
    next.ui.modalH = next.ui.modalH === 0 || next.ui.modalH === '0' ? 0 : clampN(next.ui.modalH, 400, 1600, 0);

    await spindle.userStorage.setJson(SETTINGS_FILE, next, { indent: 2, userId });
    return { settings: next };
  },

  /* ---------------- folders + bulk ops ---------------- */

  async create_folder(p, userId) {
    const index = await readIndex(userId);
    const now = new Date().toISOString();
    const folder = {
      id: newId('fold'),
      name: (p.name || '').trim().slice(0, 60) || 'New folder',
      color: NOTE_COLORS[index.folders.length % NOTE_COLORS.length],
      icon: '', // '' | emoji | 'img:<imageId>'
      createdAt: now,
      updatedAt: now,
    };
    index.folders.unshift(folder);
    await writeIndex(index, userId);
    return { folder, index };
  },

  async rename_folder(p, userId) {
    const index = await readIndex(userId);
    const folder = index.folders.find((f) => f.id === p.id);
    if (!folder) throw new Error(`Folder not found: ${p.id}`);
    folder.name = (p.name || '').trim().slice(0, 60) || 'New folder';
    folder.updatedAt = new Date().toISOString();
    await writeIndex(index, userId);
    return { folder, index };
  },

  async set_folder_meta(p, userId) {
    const index = await readIndex(userId);
    const folder = index.folders.find((f) => f.id === p.id);
    if (!folder) throw new Error(`Folder not found: ${p.id}`);

    if (typeof p.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.color)) folder.color = p.color;
    if (typeof p.icon === 'string') {
      const icon = p.icon.slice(0, 80);
      // garbage-collect a replaced icon image
      const old = folder.icon || '';
      if (old.startsWith('img:') && old !== icon) {
        try { await spindle.userStorage.delete(imagePath(old.slice(4)), userId); } catch (_) { /* gone */ }
      }
      folder.icon = icon;
    }
    folder.updatedAt = new Date().toISOString();
    await writeIndex(index, userId);
    return { folder, index };
  },

  async delete_folder(p, userId) {
    const index = await readIndex(userId);
    const folder = index.folders.find((f) => f.id === p.id);
    if (!folder) throw new Error(`Folder not found: ${p.id}`);
    index.folders = index.folders.filter((f) => f.id !== p.id);

    // folder icon image
    if ((folder.icon || '').startsWith('img:')) {
      try { await spindle.userStorage.delete(imagePath(folder.icon.slice(4)), userId); } catch (_) { /* gone */ }
    }

    if (p.deleteNotes) {
      const doomed = index.notes.filter((n) => n.folderId === p.id);
      for (const meta of doomed) {
        try { await spindle.userStorage.delete(notePath(meta.id), userId); } catch (_) { /* noop */ }
        for (const imgId of meta.imageIds || []) {
          try { await spindle.userStorage.delete(imagePath(imgId), userId); } catch (_) { /* noop */ }
        }
      }
      index.notes = index.notes.filter((n) => n.folderId !== p.id);
    } else {
      index.notes.forEach((n) => { if (n.folderId === p.id) n.folderId = null; });
    }
    await writeIndex(index, userId);
    return { index };
  },

  async move_notes(p, userId) {
    const index = await readIndex(userId);
    const ids = new Set(Array.isArray(p.ids) ? p.ids : []);
    const folderId = p.folderId === null || p.folderId === undefined ? null : String(p.folderId);
    if (folderId && !index.folders.some((f) => f.id === folderId)) throw new Error(`Folder not found: ${folderId}`);
    for (const n of index.notes) if (ids.has(n.id)) n.folderId = folderId;
    await writeIndex(index, userId);
    return { index };
  },

  async bulk_delete(p, userId) {
    const index = await readIndex(userId);
    const ids = new Set(Array.isArray(p.ids) ? p.ids : []);
    const doomed = index.notes.filter((n) => ids.has(n.id));
    for (const meta of doomed) {
      try { await spindle.userStorage.delete(notePath(meta.id), userId); } catch (_) { /* noop */ }
      for (const imgId of meta.imageIds || []) {
        try { await spindle.userStorage.delete(imagePath(imgId), userId); } catch (_) { /* noop */ }
      }
    }
    index.notes = index.notes.filter((n) => !ids.has(n.id));
    await writeIndex(index, userId);
    return { index, deleted: doomed.length };
  },

  /* ---------------- export / import ---------------- */

  async export_all(_p, userId) {
    const index = await readIndex(userId);
    const notes = [];
    const images = {};
    for (const meta of index.notes) {
      const note = await spindle.userStorage.getJson(notePath(meta.id), { fallback: null, userId });
      if (!note) continue;
      notes.push({ ...meta, content: note.content, createdAt: note.createdAt });
      for (const imgId of meta.imageIds || []) {
        try { images[imgId] = await spindle.userStorage.read(imagePath(imgId), userId); } catch (_) { /* skip */ }
      }
    }
    return {
      data: {
        app: 'notehaven',
        kind: 'notehaven_backup',
        version: 2,
        exportedAt: new Date().toISOString(),
        folders: index.folders,
        notes,
        images,
      },
    };
  },

  async import_data(p, userId) {
    const data = p.data;
    if (!data || typeof data !== 'object') throw new Error('Not a Notehaven file');
    if (data.app !== 'notehaven' && data.kind !== 'notehaven_backup') throw new Error('Not a Notehaven file');

    const index = await readIndex(userId);
    const existingNoteIds = new Set(index.notes.map((n) => n.id));
    const existingImgIds = new Set();
    index.notes.forEach((n) => (n.imageIds || []).forEach((id) => existingImgIds.add(id)));

    const imgMap = data.images && typeof data.images === 'object' ? data.images : {};
    const notesIn = Array.isArray(data.notes) ? data.notes : (data.note ? [data.note] : []);
    let imported = 0;
    let imagesImported = 0;
    let foldersImported = 0;

    const rehomeImage = async (refId) => {
      const url = imgMap[refId];
      if (typeof url !== 'string' || !url.startsWith('data:image/')) return null;
      const finalId = existingImgIds.has(refId) ? newId('img') : refId;
      await spindle.userStorage.write(imagePath(finalId), url, userId);
      existingImgIds.add(finalId);
      imagesImported++;
      return finalId;
    };

    // --- folders first so notes can point at the (possibly re-ided) folders
    const folderIdMap = {};
    const existingFolderIds = new Set(index.folders.map((f) => f.id));
    const foldersIn = Array.isArray(data.folders) ? data.folders : [];
    for (const rawF of foldersIn) {
      if (!rawF || typeof rawF !== 'object') continue;
      const nid = rawF.id && !existingFolderIds.has(String(rawF.id)) ? String(rawF.id) : newId('fold');
      let icon = typeof rawF.icon === 'string' ? rawF.icon.slice(0, 80) : '';
      if (icon.startsWith('img:')) {
        const refId = icon.slice(4);
        const rehomed = await rehomeImage(refId);
        if (rehomed) icon = `img:${rehomed}`;
        else if (!existingImgIds.has(refId)) icon = '';
      }
      const nowF = new Date().toISOString();
      index.folders.unshift({
        id: nid,
        name: String(rawF.name || '').trim().slice(0, 60) || 'New folder',
        color: /^#[0-9a-fA-F]{6}$/.test(rawF.color || '') ? rawF.color : NOTE_COLORS[index.folders.length % NOTE_COLORS.length],
        icon,
        createdAt: typeof rawF.createdAt === 'string' ? rawF.createdAt : nowF,
        updatedAt: nowF,
      });
      existingFolderIds.add(nid);
      if (rawF.id) folderIdMap[String(rawF.id)] = nid;
      foldersImported++;
    }

    for (const raw of notesIn) {
      if (!raw || typeof raw !== 'object') continue;
      const id = raw.id && !existingNoteIds.has(raw.id) ? String(raw.id) : newId('note');
      let content = typeof raw.content === 'string' ? raw.content : '';

      // re-home images, regenerating ids on collision and rewriting refs
      const refs = extractImageIds(content);
      const rewrites = {};
      const keepIds = [];
      for (const refId of refs) {
        const url = imgMap[refId];
        let finalId = refId;
        if (typeof url === 'string' && url.startsWith('data:image/')) {
          finalId = existingImgIds.has(refId) ? newId('img') : refId;
          await spindle.userStorage.write(imagePath(finalId), url, userId);
          existingImgIds.add(finalId);
          imagesImported++;
        } else if (!existingImgIds.has(refId)) {
          continue; // no data for this ref — leave it; preview shows a placeholder
        }
        if (finalId !== refId) rewrites[refId] = finalId;
        keepIds.push(finalId);
      }
      for (const [oldId, fixedId] of Object.entries(rewrites)) {
        content = content.split(`nh-img://${oldId}`).join(`nh-img://${fixedId}`);
      }

      const now = new Date().toISOString();
      const title = String(raw.title || '').trim() || 'Untitled Note';
      const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : now;
      const note = { id, title, content, createdAt, updatedAt: now };
      await spindle.userStorage.setJson(notePath(id), note, { indent: 2, userId });

      const rawFolderId = raw.folderId ? String(raw.folderId) : null;
      const folderId = rawFolderId
        ? (folderIdMap[rawFolderId] || (existingFolderIds.has(rawFolderId) ? rawFolderId : null))
        : null;

      index.notes.unshift({
        id,
        title,
        color: /^#[0-9a-fA-F]{6}$/.test(raw.color || '') ? raw.color : NOTE_COLORS[index.notes.length % NOTE_COLORS.length],
        pinned: !!raw.pinned,
        folderId,
        tags: extractTags(content),
        snippet: makeSnippet(content),
        words: wordCount(content),
        imageIds: keepIds,
        createdAt,
        updatedAt: now,
      });
      existingNoteIds.add(id);
      imported++;
    }

    if (imported === 0 && foldersImported === 0) throw new Error('No notes found in that file');
    await writeIndex(index, userId);
    return { index, imported, images: imagesImported, folders: foldersImported };
  },

  /* ---------------- misc ---------------- */

  async toast(p, _userId) {
    const level = ['success', 'info', 'warning', 'error'].includes(p.level) ? p.level : 'info';
    spindle.toast[level](String(p.message || '').slice(0, 200));
    return { ok: true };
  },
};

/* ------------------------------------------------------------------ */
/* Message pump                                                        */
/* ------------------------------------------------------------------ */

spindle.onFrontendMessage(async (payload, userId) => {
  if (!payload || typeof payload !== 'object') return;
  const handler = handlers[payload.type];
  if (!handler) return;
  try {
    const data = await handler(payload, userId);
    spindle.sendToFrontend(
      { type: 'nh:result', requestId: payload.requestId, ok: true, data },
      userId,
    );
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    spindle.log.warn(`Notehaven handler "${payload.type}" failed: ${message}`);
    spindle.sendToFrontend(
      { type: 'nh:result', requestId: payload.requestId, ok: false, error: message },
      userId,
    );
  }
});

/* ------------------------------------------------------------------ */
/* {{note::Title}} macro                                               */
/* ------------------------------------------------------------------ */

spindle.registerMacro({
  name: 'note',
  category: 'extension:notehaven',
  description: 'Insert the content of a Notehaven note, e.g. {{note::Story Ideas}}',
  returnType: 'string',
  args: [{ name: 'title', description: 'Title of the note (exact or prefix match)', required: true }],
  volatile: true,
  handler: async (macroCtx) => {
    try {
      const args = macroCtx?.args;
      const wanted = String(Array.isArray(args) ? args[0] : args?.title ?? '').trim();
      if (!wanted) return '';

      const userId = macroCtx?.userId ?? macroCtx?.env?.userId ?? macroCtx?.env?.user?.id ?? undefined;
      const index = await readIndex(userId);
      const lower = wanted.toLowerCase();
      const meta = index.notes.find((n) => n.title.toLowerCase() === lower)
        || index.notes.find((n) => n.title.toLowerCase().startsWith(lower));
      if (!meta) return `[Notehaven: no note titled "${wanted}"]`;

      const note = await spindle.userStorage.getJson(notePath(meta.id), { fallback: null, userId });
      if (!note) return `[Notehaven: note "${wanted}" could not be read]`;

      // Replace embedded images with a text placeholder for the LLM
      return note.content.replace(
        /!\[([^\]]*)\]\(nh-img:\/\/[A-Za-z0-9_-]+\)/g,
        (_m, alt) => `[Image: ${alt || 'embedded'}]`,
      );
    } catch (err) {
      spindle.log.warn(`Notehaven macro failed: ${err?.message || err}`);
      return '';
    }
  },
});

spindle.log.info('Notehaven backend loaded 🌙');
