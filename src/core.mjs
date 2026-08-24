/** Pure package and backup contracts shared by the browser and tests. */

export const PACKAGE_KIND = "vaios-app-package";
export const PACKAGE_VERSION = 1;
export const BACKUP_KIND = "vaios-backup";
export const BACKUP_VERSION = 1;

export class VAiOSError extends Error {}

function plain(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, label, { empty = false } = {}) {
  if (typeof value !== "string" || (!empty && !value.trim())) throw new VAiOSError(`${label} must be a non-empty string`);
  return value;
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new VAiOSError(`${label} fields are incomplete or unexpected`);
}

export function utf8Bytes(text) {
  return new TextEncoder().encode(text).byteLength;
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

export function validatePackage(raw) {
  if (!plain(raw)) throw new VAiOSError("package must be a JSON object");
  exactKeys(raw, ["kind", "extension", "version", "item", "files"], "package");
  if (raw.kind !== PACKAGE_KIND || raw.extension !== "vaios" || raw.version !== PACKAGE_VERSION) throw new VAiOSError("unsupported .vaios package identity or version");
  if (!plain(raw.item)) throw new VAiOSError("item must be an object");
  exactKeys(raw.item, ["id", "name", "categories", "icon", "type", "size", "desktopIcon", "html"], "item");
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(raw.item.id)) throw new VAiOSError("item.id must be a lowercase stable identifier");
  requireString(raw.item.name, "item.name");
  if (!Array.isArray(raw.item.categories) || !raw.item.categories.length || raw.item.categories.some(value => typeof value !== "string" || !value.trim())) throw new VAiOSError("item.categories must contain names");
  if (!Number.isSafeInteger(raw.item.size) || raw.item.size < 0) throw new VAiOSError("item.size must be a non-negative integer");
  if (typeof raw.item.desktopIcon !== "boolean") throw new VAiOSError("item.desktopIcon must be boolean");
  for (const key of ["icon", "type"]) requireString(raw.item[key], `item.${key}`);
  if (raw.item.html !== "") throw new VAiOSError("item.html must stay empty; source belongs only in files/index.html");
  if (!plain(raw.files) || typeof raw.files["index.html"] !== "string") throw new VAiOSError("files/index.html must contain the self-contained app document");
  const allowed = new Set(["index.html", "manifest.json", "item.json", "readme.txt"]);
  if (Object.keys(raw.files).some(name => !allowed.has(name))) throw new VAiOSError("package contains an unsupported file");
  const html = raw.files["index.html"];
  if (!/^\s*<!doctype html>/i.test(html) || !/<meta\s+charset=/i.test(html) || !/name=["']viewport["']/i.test(html)) throw new VAiOSError("index.html must be a complete responsive HTML document");
  if (utf8Bytes(html) !== raw.item.size) throw new VAiOSError("item.size does not match files/index.html bytes");
  return structuredClone(raw);
}

export function createPackage({ id, name, categories, icon, type = "app", desktopIcon = true, html }) {
  return validatePackage({
    kind: PACKAGE_KIND,
    extension: "vaios",
    version: PACKAGE_VERSION,
    item: { id, name, categories, icon, type, size: utf8Bytes(html), desktopIcon, html: "" },
    files: { "index.html": html },
  });
}

export async function encodeBackupJSONL(state) {
  if (!plain(state) || !Array.isArray(state.apps) || !plain(state.settings) || !plain(state.filesystem) || !plain(state.widgets) || !plain(state.localStorage)) throw new VAiOSError("backup state is incomplete");
  const lines = [{ kind: BACKUP_KIND, version: BACKUP_VERSION }];
  lines.push({ kind: "settings", value: state.settings });
  lines.push({ kind: "filesystem", value: state.filesystem });
  lines.push({ kind: "widgets", value: state.widgets });
  lines.push({ kind: "local-storage", value: state.localStorage });
  const ids = new Set();
  for (const app of state.apps) {
    if (!plain(app) || !plain(app.item) || typeof app.html !== "string" || !app.html) throw new VAiOSError("complete backup aborted: an app source could not be read");
    if (ids.has(app.item.id)) throw new VAiOSError("complete backup aborted: duplicate app id");
    const pkg = validatePackage({ kind: PACKAGE_KIND, extension: "vaios", version: PACKAGE_VERSION, item: app.item, files: { "index.html": app.html } });
    ids.add(pkg.item.id);
    lines.push({ kind: "app", item: pkg.item, html: app.html, bytes: utf8Bytes(app.html), sha256: await sha256Hex(app.html) });
  }
  const body = lines.map(value => JSON.stringify(value)).join("\n") + "\n";
  lines.push({ kind: "complete", appCount: state.apps.length, bodySha256: await sha256Hex(body) });
  return lines.map(value => JSON.stringify(value)).join("\n") + "\n";
}

export async function decodeBackupJSONL(text) {
  if (typeof text !== "string" || !text.trim()) throw new VAiOSError("backup is empty");
  let rows;
  try { rows = text.trimEnd().split("\n").map(line => JSON.parse(line)); }
  catch { throw new VAiOSError("backup contains invalid JSONL"); }
  if (rows.length < 6 || rows[0].kind !== BACKUP_KIND || rows[0].version !== BACKUP_VERSION || rows.at(-1).kind !== "complete") throw new VAiOSError("backup header or completion marker is missing");
  const footer = rows.at(-1);
  const body = rows.slice(0, -1).map(value => JSON.stringify(value)).join("\n") + "\n";
  if (await sha256Hex(body) !== footer.bodySha256) throw new VAiOSError("backup body hash mismatch; restore aborted");
  const singleton = name => {
    const matches = rows.filter(row => row.kind === name);
    if (matches.length !== 1 || !plain(matches[0].value)) throw new VAiOSError(`backup requires exactly one ${name} record`);
    return matches[0].value;
  };
  const apps = [];
  for (const row of rows.filter(value => value.kind === "app")) {
    if (typeof row.html !== "string" || utf8Bytes(row.html) !== row.bytes || await sha256Hex(row.html) !== row.sha256) throw new VAiOSError("app byte count or SHA-256 mismatch; restore aborted");
    const pkg = validatePackage({ kind: PACKAGE_KIND, extension: "vaios", version: PACKAGE_VERSION, item: row.item, files: { "index.html": row.html } });
    apps.push({ item: pkg.item, html: row.html });
  }
  if (apps.length !== footer.appCount) throw new VAiOSError("backup app count mismatch; restore aborted");
  const allowed = new Set([BACKUP_KIND, "settings", "filesystem", "widgets", "local-storage", "app", "complete"]);
  if (rows.some(row => !plain(row) || !allowed.has(row.kind))) throw new VAiOSError("backup contains an unsupported record; restore aborted");
  return { apps, settings: singleton("settings"), filesystem: singleton("filesystem"), widgets: singleton("widgets"), localStorage: singleton("local-storage") };
}
