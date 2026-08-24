import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("desktop iframe exposes required capability declarations", async () => {
  const source = await readFile("src/desktop.mjs", "utf8");
  for (const capability of ["allow-scripts", "allow-same-origin", "allow-pointer-lock", "fullscreen", "gamepad", "clipboard-read", "clipboard-write", "allowfullscreen"]) assert.match(source, new RegExp(capability));
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

test("HTML entry points are responsive documents with module scripts", async () => {
  for (const path of ["index.html", "builder.html"]) {
    const source = await readFile(path, "utf8");
    assert.match(source, /^<!doctype html>/i);
    assert.match(source, /name="viewport"/);
    assert.match(source, /type="module"/);
  }
});
