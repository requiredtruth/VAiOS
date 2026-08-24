import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("desktop iframe exposes required capability declarations", async () => {
  const source = await readFile("index.html", "utf8");
  for (const capability of ["allow-scripts", "allow-same-origin", "allow-pointer-lock", "fullscreen", "gamepad", "clipboard-read", "clipboard-write", "allowFullscreen"]) assert.match(source, new RegExp(capability));
});

test("builder exports directly without AI or reskin calls", async () => {
  const source = await readFile("src/builder.mjs", "utf8");
  assert.match(source, /URL\.createObjectURL/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|WebSocket|openai|anthropic|gemini/i);
});

test("storage validates the entire backup before clearing", async () => {
  const source = await readFile("src/storage.mjs", "utf8");
  assert.ok(source.indexOf("await decodeBackupJSONL(text)") < source.indexOf("store.clear()"));
  assert.match(source, /source unavailable/);
});

test("HTML entry points are responsive documents", async () => {
  for (const path of ["index.html", "builder.html"]) {
    const source = await readFile(path, "utf8");
    assert.match(source, /^<!doctype html>/i);
    assert.match(source, /name="viewport"/);
  }
  assert.match(await readFile("builder.html", "utf8"), /type="module"/);
});

test("restored standalone desktop JavaScript compiles", async () => {
  const source = await readFile("index.html", "utf8");
  const match = source.match(/<script>\s*([\s\S]*)<\/script>\s*<\/body>/i);
  assert.ok(match, "standalone desktop script missing");
  assert.doesNotThrow(() => new Function(match[1]));
});

test("restored desktop contains the original built-ins and stores", async () => {
  const source = await readFile("index.html", "utf8");
  for (const app of ["Task Manager", "New App", "URL to VAiOS", "HTML to VAiOS", "App Manager", "Widget Manager", "Settings", "Backups", "Text Editor"]) assert.match(source, new RegExp(app));
  for (const key of ["ai_vdesktop_settings_v4", "ai_vdesktop_items_v4", "ai_vdesktop_hidden_widgets_v4", "ai_vdesktop_widget_positions_v4", "ai_vdesktop_desktop_folders_v1", "ai_vdesktop_fs_v4"]) assert.match(source, new RegExp(key));
  for (const action of ["Mass Import .vaios", "AI Reskin SVG + Metadata", "AI Edit as v", "Download JSONL Backup"]) assert.match(source, new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(source, /10\.0\.|192\.168\./);
});

test("complete v6 restore validates records and app hashes before mutation", async () => {
  const source = await readFile("index.html", "utf8");
  const validation = source.indexOf("await validateFullJsonl(lines)");
  const firstIndexedDbWrite = source.indexOf("await idbPutLarge(key,html)", validation);
  const firstLocalStorageWrite = source.indexOf("if(settings)saveSettings", validation);
  assert.ok(validation > 0);
  assert.ok(validation < firstIndexedDbWrite);
  assert.ok(validation < firstLocalStorageWrite);
  assert.match(source, /app byte count or SHA-256 mismatch/);
});

test("recovered installable apps follow the single-copy package contract", async () => {
  for (const path of [
    "apps/html-to-vaios.vaios",
    "apps/url-to-vaios.vaios",
    "apps/neon-kart-16.vaios",
    "apps/philippines-skyline-webcam-wall.vaios",
  ]) {
    const pkg = JSON.parse(await readFile(path, "utf8"));
    assert.equal(pkg.kind, "vaios-app-package");
    assert.equal(pkg.version, 1);
    assert.equal(pkg.item.type, "app");
    assert.equal(pkg.item.html, "");
    assert.match(pkg.folder, /^\/Apps\/[a-z0-9-]+$/);
    assert.match(pkg.files["index.html"], /^<!doctype html>/i);
    assert.doesNotMatch(JSON.stringify(pkg), /10\.0\.|192\.168\.|worldforge|requiredtruth/i);
  }
});
