# VAiOS 0.1.0 contract

## Application packages

`.vaios` is JSON, not a ZIP. It has `kind: "vaios-app-package"`, `extension: "vaios"`, `version: 1`, strict `item` metadata, and a complete responsive document at `files["index.html"]`. `item.html` is always empty so large source is not duplicated. Imported source is stored once in IndexedDB while metadata stays in localStorage.

## Execution

Apps run from `iframe.srcdoc`. The desktop owns framing, focus, movement, resize, minimize, maximize, close, and fullscreen controls. Frames declare scripts, same-origin storage, forms, modals, downloads, pointer lock, fullscreen, gamepad, autoplay, and clipboard permissions. A packaged app must not assume control of the top-level window.

## Complete restore images

JSONL export must read every installed app source. Any unreadable or empty source aborts the export; there is no partial or legacy fallback. Each app record includes exact HTML, UTF-8 byte count, and SHA-256. The whole pre-footer body is hashed. Restore validates every line, singleton state record, count, byte length, app hash, package contract, and body hash before clearing current storage.

## Non-goals

0.1.0 does not proxy remote sites, bypass frame policies, sync through a server, execute native code, or turn untrusted HTML into a security boundary. The package builder never invokes AI or silently changes imported source.
