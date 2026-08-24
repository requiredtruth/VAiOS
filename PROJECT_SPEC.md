# VAiOS 0.2.0 restored contract

## Original desktop surface

`index.html` is the owner-authored standalone VAiOS desktop. It retains the `ai_vdesktop_*` v4 stores and v2/v3 migration path, three-column Start menu, taskbar CPU/disk monitor, virtual drive, desktop folders, normal widgets, movable windows, context menus, and the nine original built-in apps. It remains usable as a browser page and as a Cordova WebView entry point.

The built-ins are Task Manager, New App, URL to VAiOS, HTML to VAiOS, App Manager, Widget Manager, Settings, Backups, and Text Editor. AI actions are optional and call only the OpenAI-compatible URL saved by the user in Settings. No remote endpoint or credential is shipped.

## Application packages

`.vaios` is JSON, not a ZIP. It has `kind: "vaios-app-package"`, `extension: "vaios"`, `version: 1`, rich item metadata, and a complete responsive document at `files["index.html"]`. Canonical packages also carry `manifest.json` and `item.json`; large source is not duplicated in item metadata. Imported large source is stored in IndexedDB while metadata stays in localStorage.

## Execution

Apps run from `iframe.srcdoc`. The desktop owns framing, focus, movement, resize, minimize, maximize, close, action menus, widget placement, and fullscreen controls. Frames declare scripts, same-origin storage, forms, modals, downloads, pointer lock, fullscreen, gamepad, autoplay, and clipboard permissions. A packaged app must not assume control of the top-level window.

## Complete restore images

Complete v6 JSONL export must read every installed app source. Any unreadable or empty source aborts the export. Each item carries exact HTML, byte count, and SHA-256, duplicated in the final backup audit. Restore validates JSON, required singleton records, item counts, source presence, byte lengths, and both copies of every app hash before writing IndexedDB or localStorage. Legacy v4 import remains available for old owner backups.

## Non-goals

0.2.0 does not proxy remote sites, bypass frame policies, sync through a server, execute native code, or turn untrusted HTML into a security boundary. Direct package download never invokes AI or silently changes imported source; AI creation/editing happens only through explicit user actions.
