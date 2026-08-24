/** IndexedDB app source store with localStorage metadata and strict full backups. */

import { decodeBackupJSONL, encodeBackupJSONL, validatePackage, VAiOSError } from "./core.mjs";

const DB_NAME = "vaios-apps-v1";
const STORE = "sources";
const META = "vaios.app.metadata";
const SETTINGS = "vaios.settings";
const FILESYSTEM = "vaios.filesystem";
const WIDGETS = "vaios.widgets";

function db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new VAiOSError(`IndexedDB open failed: ${request.error?.message || "unknown error"}`));
  });
}

function transaction(mode, operation) {
  return db().then(database => new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const result = operation(tx.objectStore(STORE));
    tx.oncomplete = () => { database.close(); resolve(result()); };
    tx.onerror = () => { database.close(); reject(new VAiOSError(`IndexedDB transaction failed: ${tx.error?.message || "unknown error"}`)); };
    tx.onabort = tx.onerror;
  }));
}

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return structuredClone(fallback); }
}

export function metadata() { return readJSON(META, []); }
export function settings() { return readJSON(SETTINGS, { accent: "#65d5ff", wallpaper: "midnight" }); }
export function filesystem() { return readJSON(FILESYSTEM, { folders: [] }); }
export function widgets() { return readJSON(WIDGETS, { clock: { visible: true, x: 20, y: 20 }, storage: { visible: true, x: 20, y: 116 } }); }
export function saveSettings(value) { localStorage.setItem(SETTINGS, JSON.stringify(value)); }
export function saveFilesystem(value) { localStorage.setItem(FILESYSTEM, JSON.stringify(value)); }
export function saveWidgets(value) { localStorage.setItem(WIDGETS, JSON.stringify(value)); }

export async function installPackage(raw) {
  const pkg = validatePackage(raw);
  await transaction("readwrite", store => { store.put({ id: pkg.item.id, html: pkg.files["index.html"] }); return () => undefined; });
  const list = metadata().filter(item => item.id !== pkg.item.id); list.push(pkg.item); list.sort((a, b) => a.name.localeCompare(b.name));
  localStorage.setItem(META, JSON.stringify(list));
  return pkg.item;
}

export async function appSource(id) {
  return transaction("readonly", store => {
    const request = store.get(id);
    return () => request.result?.html;
  });
}

export async function removeApp(id) {
  await transaction("readwrite", store => { store.delete(id); return () => undefined; });
  localStorage.setItem(META, JSON.stringify(metadata().filter(item => item.id !== id)));
}

export async function completeState() {
  const apps = [];
  for (const item of metadata()) {
    const html = await appSource(item.id);
    if (typeof html !== "string" || !html) throw new VAiOSError(`complete backup aborted: source unavailable for ${item.id}`);
    apps.push({ item, html });
  }
  const custom = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && ![META, SETTINGS, FILESYSTEM, WIDGETS].includes(key)) custom[key] = localStorage.getItem(key);
  }
  return { apps, settings: settings(), filesystem: filesystem(), widgets: widgets(), localStorage: custom };
}

export async function exportBackup() { return encodeBackupJSONL(await completeState()); }

export async function restoreBackup(text) {
  const state = await decodeBackupJSONL(text); // Validate every byte before mutating anything.
  await transaction("readwrite", store => {
    store.clear();
    for (const app of state.apps) store.put({ id: app.item.id, html: app.html });
    return () => undefined;
  });
  localStorage.clear();
  localStorage.setItem(META, JSON.stringify(state.apps.map(app => app.item)));
  saveSettings(state.settings); saveFilesystem(state.filesystem); saveWidgets(state.widgets);
  for (const [key, value] of Object.entries(state.localStorage)) localStorage.setItem(key, value);
  return state;
}
