import test from "node:test";
import assert from "node:assert/strict";
import { createPackage, validatePackage, encodeBackupJSONL, decodeBackupJSONL, VAiOSError, utf8Bytes } from "../src/core.mjs";

const html = "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body><h1>Fixture</h1></body></html>";

function app(id = "fixture-app") {
  return createPackage({ id, name: "Fixture App", categories: ["Tests"], icon: "🧪", html });
}

test("creates the exact non-duplicating package contract", () => {
  const pkg = app();
  assert.equal(pkg.kind, "vaios-app-package");
  assert.equal(pkg.item.html, "");
  assert.equal(pkg.files["index.html"], html);
  assert.equal(pkg.item.size, utf8Bytes(html));
});

test("rejects duplicated item HTML", () => {
  const pkg = app(); pkg.item.html = html;
  assert.throws(() => validatePackage(pkg), /item\.html must stay empty/);
});

test("rejects an incomplete document", () => {
  assert.throws(() => createPackage({ id: "bad-app", name: "Bad", categories: ["Test"], icon: "?", html: "<h1>no document</h1>" }), /complete responsive HTML/);
});

test("rejects package byte-count tampering", () => {
  const pkg = app(); pkg.item.size += 1;
  assert.throws(() => validatePackage(pkg), /does not match/);
});

test("complete JSONL round trips apps and desktop state", async () => {
  const pkg = app();
  const state = {
    apps: [{ item: pkg.item, html }],
    settings: { accent: "#123456", wallpaper: "graphite" },
    filesystem: { folders: [{ id: "folder-1", name: "Work" }] },
    widgets: { clock: { visible: false, x: 10, y: 12 } },
    localStorage: { "fixture.preference": "safe" },
  };
  const backup = await encodeBackupJSONL(state);
  const restored = await decodeBackupJSONL(backup);
  assert.deepEqual(restored, state);
  assert.match(backup, /"sha256":"[0-9a-f]{64}"/);
  assert.match(backup, /"kind":"complete"/);
});

test("backup aborts when any app source is unreadable", async () => {
  const pkg = app();
  await assert.rejects(() => encodeBackupJSONL({ apps: [{ item: pkg.item }], settings: {}, filesystem: {}, widgets: {}, localStorage: {} }), /complete backup aborted/);
});

test("restore aborts on body hash tampering", async () => {
  const pkg = app();
  const backup = await encodeBackupJSONL({ apps: [{ item: pkg.item, html }], settings: {}, filesystem: {}, widgets: {}, localStorage: {} });
  await assert.rejects(() => decodeBackupJSONL(backup.replace("Fixture App", "Changed App")), /body hash mismatch/);
});

test("restore aborts on per-app hash tampering even with a repaired body footer", async () => {
  const pkg = app();
  const backup = await encodeBackupJSONL({ apps: [{ item: pkg.item, html }], settings: {}, filesystem: {}, widgets: {}, localStorage: {} });
  const lines = backup.trimEnd().split("\n").map(JSON.parse);
  lines.find(row => row.kind === "app").sha256 = "0".repeat(64);
  const body = lines.slice(0, -1).map(JSON.stringify).join("\n") + "\n";
  lines.at(-1).bodySha256 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)).then(value => [...new Uint8Array(value)].map(x => x.toString(16).padStart(2, "0")).join(""));
  await assert.rejects(() => decodeBackupJSONL(lines.map(JSON.stringify).join("\n") + "\n"), /app byte count or SHA-256 mismatch/);
});

test("restore rejects partial legacy records instead of falling back", async () => {
  await assert.rejects(() => decodeBackupJSONL('{"kind":"vaios-backup","version":1}\n'), /completion marker/);
});
