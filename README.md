# VAiOS

VAiOS is the original local-first virtual AI desktop restored from its standalone implementation. It creates and edits complete HTML apps and widgets, installs `.vaios` packages, stores large source in IndexedDB, mirrors apps into a virtual filesystem, and exports complete JSONL restore images.

```sh
./install.sh
```

The verification command has no dependency install step. It syntax-checks the browser modules and runs the Node test suite.

## Start the desktop

```sh
./run.sh
# open http://localhost:8080
```

The primary desktop is a standalone HTML application. Its **New App**, **URL to VAiOS**, and **HTML to VAiOS** tools create installable apps and widgets. AI creation and versioned editing are optional and use only the OpenAI-compatible endpoint explicitly saved in Settings; direct HTML/package export remains available without AI.

The `apps/` directory preserves installable packages recovered with the desktop. Import any `.vaios` file through **App Manager** or **Mass Import .vaios**:

- **HTML to VAiOS** — converts a self-contained HTML document into a single-copy `.vaios` package and can optionally ask a user-configured local OpenAI-compatible endpoint for SVG/metadata.
- **URL to VAiOS** — packages a URL-backed app with sandbox-aware metadata and the same optional local endpoint workflow.
- **Neon Kart 16** — a self-contained original browser game used as a pointer-lock/fullscreen package example.
Third-party game launchers recovered nearby were intentionally not published because their redistribution rights were not established.

## Working features

- Nine built-in desktop apps: Task Manager, New App, URL to VAiOS, HTML to VAiOS, App Manager, Widget Manager, Settings, Backups, and Text Editor.
- Three-column Start menu, draggable desktop folders, movable widgets, CPU/disk taskbar monitor, clock, quick backup, and fullscreen controls.
- Draggable/resizable app windows with focus, minimize, maximize, close, app actions, and browser fullscreen controls.
- Virtual drive with `/Apps`, `/Widgets`, `/Documents`, `/Backups`, and `/System`; installed items receive `index.html`, `manifest.json`, `item.json`, and local-storage files.
- Desktop and item context menus, mass `.vaios` import, duplicate/rename/source editing, exports, versioned AI editing, and SVG/metadata reskin actions.
- `iframe.srcdoc` execution with declared fullscreen, pointer-lock, gamepad, autoplay, and clipboard capabilities.
- Strict `.vaios` v1 parsing: complete HTML lives only at `files/index.html`; `item.html` must remain empty.
- IndexedDB app source and localStorage metadata, filesystem, widgets, settings, and app/custom state.
- Complete JSONL export containing full app HTML, byte counts, per-app SHA-256 audit data, desktop folders, virtual filesystem, widgets, settings, and custom localStorage.
- Validate-before-mutate restore for complete v6 backups. Missing required records, missing app source, count mismatches, byte mismatches, or SHA-256 mismatches abort restoration before storage changes.

## Exact failure strings

```text
Full JSONL backup aborted. Missing/unreadable large HTML payload(s)
Full JSONL validation failed: item audit count mismatch.
Full JSONL validation failed: app byte count or SHA-256 mismatch.
```

## Distinction

Large browser-desktop projects such as daedalOS provide broad operating-system simulations and many integrated apps. VAiOS focuses on a narrower portable-app contract: direct packaging of complete HTML, single-copy large-source storage, desktop window controls, and a strict all-or-nothing restore image that can recreate the installed application set offline. No code or design is copied from those projects.

## Security and limitations

- Imported HTML is untrusted code. The iframe limits top-level control, but `allow-scripts` plus `allow-same-origin` is not a hard security boundary. Inspect packages before installing them.
- Clipboard, pointer lock, fullscreen, downloads, and similar capabilities still require browser/user permission.
- Large data is limited by browser quota. Export intentionally aborts rather than silently omitting an unreadable app.
- `localStorage.clear()` is scoped to the VAiOS origin; host VAiOS on a dedicated origin if other apps share the same site.
- Relative external assets may fail unless embedded or rewritten into the HTML document.
- Remote sites may refuse framing through CSP or `X-Frame-Options`; VAiOS does not bypass those controls.
- JSONL backups are integrity-checked, not encrypted or signed. They may contain app-created local state; store them accordingly.
- Remote LLM features require a user-configured compatible endpoint. No endpoint credential is bundled.
- Browser-only use may report a harmless missing `cordova.js`; Cordova supplies it in APK builds.
- Cross-device synchronization is not included; JSONL backup/restore is the portable path.

## Support

Donations can fund additional production time and may request priority for a compatible direction through the funded-direction issue template using a public transaction hash. They do not guarantee implementation or purchase ownership, returns, deadlines, or support. See [SUPPORT.md](SUPPORT.md) and verify the asset and exact network before sending.

MIT licensed. The exact package and restore contracts are in [PROJECT_SPEC.md](PROJECT_SPEC.md).
