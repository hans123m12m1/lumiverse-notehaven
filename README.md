# Notehaven 🌙

A cozy **Lumiverse** (by [Prolix](https://github.com/prolix-oc/Lumiverse)) extension built on the **Spindle** framework:

- 📓 **Notes** — an Obsidian-inspired (but homier) notebook right in the sidebar drawer, with `[[wiki links]]`, `#tags`, pins, colors, live markdown preview, checklists, and **embedded media**: images, animated GIFs, **videos (mp4/webm/mov/mkv/avi/3gp…) and audio (mp3/wav/ogg/m4a/flac/opus…)** up to ~16 MB each. Uploads are type-checked against a media allow-list, so only real images/video/audio get stored.
- ✨ **The Halo** — your own logo floating over the Lumiverse chat. **Drag it anywhere, resize it (24–256 px), snap it to screen edges, or hide it entirely.** Double-click it to jump into your notes.

No build step required — `dist/` is hand-written, dependency-free ES2022 and installs as-is.

- 🗂 **File Tree Navigator (2.0)** — a second drawer tab with an Obsidian-style tree: nested subfolders, 📌 Shortcuts + 🕘 Recent + 🏷 Tags sections (collapsible & reorderable), 6 sort modes, smart search (`words -exclude #tag folder:name OR…`), drag & drop, and word/token badges that roll up through subfolders.
- 🗄 **Tabs & split panes (2.0)** — browser-style tabs (drag to reorder, right-click to pin/split), **Split right / Split down** with draggable dividers, up to 5+ nested panes. Unfocused panes keep a live reading view of their note.
- 🪟 **A real workspace window (2.0)** — drag it anywhere (position is remembered), minimize-to-header, fullscreen, resize from both corners and both edges, back/forward history, Find & Replace (Ctrl+F), and three view modes: ✍ Live · 📖 Reading · ⌨ Source.
- ⚙️ **Deep settings (2.1)** — the full File-Tree-spec preference sheet: editor behaviors (new-tab-vs-replace, default tab view, strict line breaks, fold headings/lists, line numbers, indent guides, RTL, line height, spellcheck + languages, auto-pair, smart lists, tab/space indents) and navigator behaviors (expand-on-select, one-branch, collapse scope, keep-selected, spring-loaded folders, icon overrides, color-to-icons-only, 7 counter toggles, shortcuts/recent/folder/tag visibility, tags-as-folder, “Untagged”, recent count) plus confirm-before-delete and a 🗑 Trash folder mode. All in Settings, applying live.
- 📌 **Real pinning (2.0)** — pinned notes own the *top* of the list in their own section; folders pin too. Notes & folders take icons from an svg library, emojis, or uploaded pictures (tap a folder icon for a preview popover — works on PC & mobile). Duplication names sequentially: `name.txt` → `name (1).txt`.


---

## Installation

1. Push this folder to a GitHub repository (replace the `github` / `homepage` fields and `author` in `spindle.json` with yours).
2. Open **Lumiverse → Extensions** panel.
3. Click **Install Extension** and paste your repo URL
   (or `POST /api/v1/spindle/install`).
4. Grant the one requested permission: **`ui_panels`** (needed for the floating logo; notes work entirely on free-tier APIs).
5. Look for the **Notes** and **Halo** tabs in the sidebar drawer — or press `Ctrl/Cmd+K` and type "notes".

The extension auto-seeds a *Welcome* note on first run so you always land somewhere friendly.

## The Notes modal

Notes open in a big, comfy **centered window** (the sidebar **Notes** tab is a launcher with recent notes — or double-click the Halo logo):

- **Left rail** — all your notes: search, click to open, right-click to manage
- **Right side** — the editor: title, formatting toolbar, Edit/Split/Read views, status bar

| Feature | How it works |
| --- | --- |
| Create / open / delete | `＋ New note` button, list click, trash (two-click confirm) |
| **Rename** | Edit the title at the top, or right-click a note → ✏️ Rename |
| **Pin / recolor / duplicate** | Right-click any note in the list |
| **Images** | 🖼 toolbar button → pick a file → it's downscaled (1600 px), stored per-user, embedded as `![name](nh-img://id)`. Click an image in the preview for **fullscreen zoom** or **remove**. |
| `[[Wiki links]]` | Type `[[Note Title]]` — click to open; **pink links create the note on click** (Obsidian-style) |
| `#tags` | Typed anywhere in a note; shown as chips and matched by the search bar |
| Checklists | `- [ ]` / `- [x]` — **toggleable right in the text** |
| ✍ Write / 📖 Read | One **live-preview surface**: images, wiki-links, tasks and formatting render inline while you type. Read mode locks the surface and hides the toolbar |
| Search | Filters by title, content snippet and tags |
| Autosave | Debounced ~1 s, with a live "Saving…/Saved ✓" indicator + word & character count |
| Close | ✕ button, `Esc` key, or click the dimmed backdrop |

Everything is stored **per user** via `spindle.userStorage`, so multi-user installs keep everyone's notes private.

## The Halo (chat logo)

All Halo controls live **inside Notehaven → ⚙ Settings** now — no separate drawer tab eating space:

- **Upload logo** — any PNG/JPEG/WebP/SVG, or an **animated GIF** (kept fully animated!), persists across sessions. Big files upload in chunks — no more timeouts.
- **Resize** — a comfy slider (24–256 px) in the tab, or right-click the logo for Small/Medium/Large/Giant presets.
- **Move** — just drag it; **snap-to-edge** docks it like a magnet when you let go. It parks itself near the bottom-right corner by default; reset its spot anytime.
- **Show / hide** — the tab switch, the right-click menu, *or* the **"Toggle Chat Logo"** action in the chat input bar's Extras popover (there's also an **"Open Notes"** action there).
- **Tap / click** the logo to pop your notes open instantly (drag-tolerant — it won't misfire while you move it, and it listens on several event paths so host drag handlers can't swallow your click). On phones, **long-press** it for the menu.
- **Resize on the spot (PC)** — **Ctrl+scroll** right on the logo; the Settings slider and right-click size presets work too.

## Folders, organization & bulk actions

- **Folders / categories** — no side bars, no tabs: folders live right inside the **All** list as section headers with their notes grouped neatly beneath. Tap a folder row (chevron included) to **collapse it like a dropdown** ▾ — your collapsed choices are remembered across sessions. Create folders with **＋ New folder** at the bottom, rename inline, and right-click (long-press) a folder for more: emoji or **custom image icons**, delete (keep notes → Inbox, or delete everything)
- **Dark & light themes** — the ☀️/🌙 button in the notes header flips instantly; Settings → **Theme** offers Auto (follow Lumiverse) / Dark / Light
- **One-click pins** — 📌 the pin button toggles instantly (no menus): pinned notes sort to the top of the list, and errors surface as toasts instead of failing silently
- **Custom background** — set any picture behind your notes from Settings → Appearance, with a "veil" slider that keeps text readable in dark *and* light mode 🖼
- **Move notes** — drag them onto a folder's section header (PC), right-click → *📁 Move to…*, or create notes directly inside a folder; new notes land in the folder you're browsing
- **Multi-select** — tap ☑ in the list header: check individual notes or **All**, then **Move** or **Delete** in bulk
- **Resizable UI** — drag the rail's right edge on PC (slider in Settings too), drag the window's bottom-right corner to resize the whole sheet (phones stay comfy full-screen)

## Import & Export

Open the **⋯ menu** in the notes modal header:

| Option | What you get |
| --- | --- |
| **Export this note (.md)** | Plain Markdown with the title as an `# H1` — Obsidian-friendly. Embedded images stay as `nh-img://` references. |
| **Export this note (.json)** | The note *plus* its embedded images, re-importable anywhere. |
| **Export ALL notes (backup .json)** | Full backup of every note + every image. |
| **Import (.md / .json)** | `.md`/`.txt` files become new notes (a leading `# Heading` becomes the title). Notehaven `.json` files restore notes *with* images; id collisions are safely regenerated. |

Right-clicking a note in the list also has **Export (.md)**.

**Import understands more than Markdown:**

| File | What happens |
| --- | --- |
| `.md` / `.markdown` / `.txt` | Becomes a note (first `# H1` → title) |
| `.json` | Notehaven backup restored *with images*; any other JSON becomes a fenced code note |
| `.docx` | **Real Word text extraction** (dependency-free OOXML zip parsing) |
| `.toml`, `.yaml`, `.csv`, `.ini`, `.log`, `.py`, `.js`, … | Imported as a fenced code-block note (` ```toml ` etc.) |

## Settings (⚙ next to the list toggle)

- **Accent color** (or follow the app), **window opacity**, **backdrop dim & blur**, **editor font size**, **corner roundness**
- **Custom CSS** — free-form styling, applied live
- **Export / Import theme** — bundle it all as `notehaven-theme.json` and share it

Everything persists per user at `{DATA_DIR}/users/{userId}/extensions/notehaven/`.

## Phones & tablets

- The notes modal goes **full-screen** on small screens; the note rail slides over the editor and tucks itself away when you pick a note.
- **Split mode stacks vertically** (editor on top, preview below) on narrow screens.
- Touch-sized buttons, tap-to-open Halo, long-press context menus everywhere.

## Prompt macro

Insert any note into a prompt or preset block:

```
{{note::Story Ideas}}
```

Matches titles case-insensitively (exact, then prefix), strips embedded images into `[Image: …]` placeholders, and is marked `volatile` so it always reads fresh content.

## Repository layout

```
notehaven/
├── spindle.json        # manifest (identifier: notehaven)
├── dist/
│   ├── backend.js      # userStorage persistence, RPC handlers, {{note}} macro
│   └── frontend.js     # drawer tabs, editor, preview renderer, Halo float widget
└── README.md
```

### How it talks

The frontend and backend communicate over Spindle's JSON messaging with a typed
request/response envelope (`{ type, requestId }` ⇢ `{ type: 'nh:result', requestId, ok, data|error }`).
All writes are text/JSON — images are stored as base64 data URLs, which keeps the
extension on free-tier APIs and away from binary scanner heuristics.

### Permissions requested

| Permission | Why |
| --- | --- |
| `ui_panels` | Floating Halo logo widget (`ctx.ui.createFloatWidget`) — gracefully degrades if not granted |

Everything else (drawer tabs, input-bar action, context menus, storage, macros, toasts, file picker) is **free-tier**.

## License

[Lumiverse Community License v2.0](LICENSE.md) — the same license as the Lumiverse platform itself. Personal & non-profit use, view it, fork it internally; contribute improvements back; no public redistribution or commercial hosting without permission.
