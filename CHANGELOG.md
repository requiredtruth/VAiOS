# Changelog

## 0.2.0 - 2026-08-24

- Restored the actual owner-authored standalone VAiOS desktop instead of the reduced reimplementation.
- Restored all nine built-in apps, the Start hierarchy, Task Manager, virtual drive, widgets, desktop folders, context actions, mass import, and optional self-hosted AI creation/editing.
- Preserved the established v4 localStorage keys, v2/v3 migration, IndexedDB large-source storage, `.vaios` packaging, and complete JSONL backup behavior.
- Removed a private-network example from the public Settings placeholder.

## 0.1.0 - 2026-08-24

- Added a responsive browser desktop with draggable/resizable windows, taskbar, folders, widgets, settings, and app library.
- Added strict `.vaios` package import and a direct HTML-to-package builder.
- Added single-copy IndexedDB app source storage and complete JSONL backup/restore with SHA-256 and byte checks.
- Added isolated iframe execution, fullscreen/pointer-lock capability declarations, tests, and CI.
