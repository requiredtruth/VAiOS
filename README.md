# VAiOS

VAiOS is a local-first browser desktop for complete self-contained HTML applications. It installs strict `.vaios` JSON packages, stores large app source once in IndexedDB, opens apps in movable/resizable iframe windows, and exports a complete hash-verified JSONL restore image.

```sh
./doit.sh
```

The verification command has no dependency install step. It syntax-checks the browser modules and runs the Node test suite.

## Start the desktop

```sh
./run.sh
# open http://localhost:8080
```

Use **Package Builder** to choose an `.html`/`.htm` file, preview it in an isolated iframe, set its name/categories/icon/type, and download a `.vaios` package directly. Normal export never invokes an LLM, reskin, upload, or network service.

## Working features

- Desktop icons, organizational folders, clock/storage widgets, accent/wallpaper settings, app library, and taskbar.
- Draggable/resizable app windows with focus, minimize, maximize, close, and browser fullscreen controls.
- `iframe.srcdoc` execution with declared fullscreen, pointer-lock, gamepad, autoplay, and clipboard capabilities.
- Strict `.vaios` v1 parsing: complete HTML lives only at `files/index.html`; `item.html` must remain empty.
- IndexedDB app source and localStorage metadata, filesystem, widgets, settings, and app/custom state.
- Complete JSONL export containing full app HTML, byte counts, per-app SHA-256, body SHA-256, virtual desktop state, and custom localStorage.
- Validate-before-mutate restore. Any missing record, unsupported record, byte mismatch, hash mismatch, malformed package, or incomplete footer aborts restoration.

## Exact failure strings

```text
complete backup aborted: source unavailable for APP_ID
backup body hash mismatch; restore aborted
app byte count or SHA-256 mismatch; restore aborted
item.html must stay empty; source belongs only in files/index.html
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
- Current folders organize the desktop visually; nested file contents and cross-device synchronization are future work.

## Support

Donations can fund additional production time and may request priority for a compatible direction through the funded-direction issue template using a public transaction hash. They do not guarantee implementation or purchase ownership, returns, deadlines, or support. See [SUPPORT.md](SUPPORT.md) and verify the asset and exact network before sending.

MIT licensed. The exact package and restore contracts are in [PROJECT_SPEC.md](PROJECT_SPEC.md).
