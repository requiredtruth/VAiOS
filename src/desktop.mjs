import { installPackage, metadata, appSource, removeApp, exportBackup, restoreBackup, filesystem, saveFilesystem, settings, saveSettings, widgets, saveWidgets } from "./storage.mjs";

const $ = selector => document.querySelector(selector);
const windows = new Map();
let topZ = 10;

function status(text, error = false) {
  $("#status").textContent = text;
  $("#status").classList.toggle("error", error);
}

function applySettings() {
  const value = settings();
  document.documentElement.style.setProperty("--accent", value.accent || "#65d5ff");
  document.body.dataset.wallpaper = value.wallpaper || "midnight";
  $("#accent").value = value.accent || "#65d5ff";
  $("#wallpaper").value = value.wallpaper || "midnight";
}

function renderDesktop() {
  const grid = $("#desktop-icons"); grid.replaceChildren();
  for (const item of metadata().filter(value => value.desktopIcon)) {
    const button = document.createElement("button"); button.className = "desktop-icon"; button.dataset.app = item.id;
    button.innerHTML = `<span aria-hidden="true">${escapeText(item.icon)}</span><b>${escapeText(item.name)}</b>`;
    button.addEventListener("dblclick", () => launch(item));
    button.addEventListener("click", () => status(`Double-click to open ${item.name}`));
    grid.append(button);
  }
  for (const folder of filesystem().folders) {
    const button = document.createElement("button"); button.className = "desktop-icon";
    button.innerHTML = `<span aria-hidden="true">📁</span><b>${escapeText(folder.name)}</b>`;
    button.addEventListener("dblclick", () => status(`${folder.name} is an organizational desktop folder.`)); grid.append(button);
  }
  renderLibrary(); renderWidgets();
}

function escapeText(value) {
  const span = document.createElement("span"); span.textContent = String(value); return span.innerHTML;
}

function renderLibrary() {
  const list = $("#library-list"); list.replaceChildren();
  for (const item of metadata()) {
    const row = document.createElement("li");
    const open = document.createElement("button"); open.textContent = `${item.icon} ${item.name}`; open.addEventListener("click", () => launch(item));
    const remove = document.createElement("button"); remove.textContent = "Remove"; remove.className = "danger";
    remove.addEventListener("click", async () => {
      if (!confirm(`Remove ${item.name}? Export a complete backup first if it matters.`)) return;
      try { closeWindow(item.id); await removeApp(item.id); renderDesktop(); status(`${item.name} removed.`); }
      catch (error) { status(error.message, true); }
    });
    row.append(open, remove); list.append(row);
  }
  if (!metadata().length) list.innerHTML = "<li>No apps installed.</li>";
}

async function launch(item) {
  if (windows.has(item.id)) { focusWindow(windows.get(item.id)); return; }
  try {
    const html = await appSource(item.id);
    if (!html) throw new Error(`App source unavailable for ${item.id}`);
    const node = document.createElement("section"); node.className = "app-window"; node.dataset.id = item.id;
    node.style.left = `${80 + windows.size * 28}px`; node.style.top = `${70 + windows.size * 24}px`; node.style.zIndex = ++topZ;
    node.innerHTML = `<header><strong>${escapeText(item.icon)} ${escapeText(item.name)}</strong><nav><button data-action="min" title="Minimize">—</button><button data-action="max" title="Maximize">□</button><button data-action="full" title="Browser fullscreen">⛶</button><button data-action="close" title="Close">×</button></nav></header><iframe title="${escapeText(item.name)}"></iframe>`;
    const frame = node.querySelector("iframe");
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-downloads");
    frame.setAttribute("allow", "fullscreen; pointer-lock; gamepad; autoplay; clipboard-read; clipboard-write");
    frame.setAttribute("allowfullscreen", ""); frame.srcdoc = html;
    node.addEventListener("pointerdown", () => focusWindow(node));
    makeDraggable(node, node.querySelector("header"));
    node.querySelector('[data-action="close"]').addEventListener("click", () => closeWindow(item.id));
    node.querySelector('[data-action="min"]').addEventListener("click", () => node.classList.add("minimized"));
    node.querySelector('[data-action="max"]').addEventListener("click", () => node.classList.toggle("maximized"));
    node.querySelector('[data-action="full"]').addEventListener("click", () => node.requestFullscreen().catch(error => status(`Fullscreen failed: ${error.message}`, true)));
    $("#windows").append(node); windows.set(item.id, node); addTask(item); status(`${item.name} opened from IndexedDB source.`);
  } catch (error) { status(error.message, true); }
}

function makeDraggable(node, handle) {
  handle.addEventListener("pointerdown", event => {
    if (event.target.closest("button") || node.classList.contains("maximized")) return;
    const startX = event.clientX, startY = event.clientY, left = node.offsetLeft, top = node.offsetTop;
    handle.setPointerCapture(event.pointerId);
    const move = next => { node.style.left = `${Math.max(0, left + next.clientX - startX)}px`; node.style.top = `${Math.max(0, top + next.clientY - startY)}px`; };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", () => handle.removeEventListener("pointermove", move), { once: true });
  });
}

function focusWindow(node) { node.classList.remove("minimized"); node.style.zIndex = ++topZ; }
function closeWindow(id) { windows.get(id)?.remove(); windows.delete(id); document.querySelector(`[data-task="${CSS.escape(id)}"]`)?.remove(); }
function addTask(item) {
  const button = document.createElement("button"); button.dataset.task = item.id; button.textContent = `${item.icon} ${item.name}`;
  button.addEventListener("click", () => focusWindow(windows.get(item.id))); $("#tasks").append(button);
}

function renderWidgets() {
  const value = widgets();
  for (const [name, config] of Object.entries(value)) {
    const node = document.querySelector(`[data-widget="${name}"]`); if (!node) continue;
    node.hidden = !config.visible; node.style.left = `${config.x}px`; node.style.top = `${config.y}px`;
  }
  $("#toggle-clock").checked = value.clock?.visible !== false;
  $("#toggle-storage").checked = value.storage?.visible !== false;
  $("#storage-widget").textContent = `${metadata().length} app${metadata().length === 1 ? "" : "s"} installed`;
}

setInterval(() => { $("#clock-widget").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }, 1000);

$("#import-app").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try { const item = await installPackage(JSON.parse(await file.text())); renderDesktop(); status(`Installed ${item.name}; source stored once in IndexedDB.`); }
  catch (error) { status(`Install failed: ${error.message}`, true); }
  event.target.value = "";
});

$("#export-backup").addEventListener("click", async () => {
  try {
    status("Reading every installed app before export…");
    const text = await exportBackup(); download("vaios-complete-backup.jsonl", text, "application/x-ndjson");
    status("Complete JSONL restore image downloaded.");
  } catch (error) { status(error.message, true); }
});

$("#import-backup").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try { status("Validating complete backup before changing storage…"); await restoreBackup(await file.text()); location.reload(); }
  catch (error) { status(error.message, true); }
  event.target.value = "";
});

function download(name, content, type) {
  const link = document.createElement("a"); link.download = name; link.href = URL.createObjectURL(new Blob([content], { type })); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

$("#new-folder").addEventListener("click", () => {
  const name = prompt("Folder name"); if (!name?.trim()) return;
  const value = filesystem(); value.folders.push({ id: crypto.randomUUID(), name: name.trim().slice(0, 48) }); saveFilesystem(value); renderDesktop(); status("Desktop folder created.");
});
$("#open-builder").addEventListener("click", () => window.open("builder.html", "_blank", "noopener"));
$("#settings-form").addEventListener("input", () => { saveSettings({ accent: $("#accent").value, wallpaper: $("#wallpaper").value }); applySettings(); });
for (const [id, name] of [["#toggle-clock", "clock"], ["#toggle-storage", "storage"]]) {
  $(id).addEventListener("change", event => { const value = widgets(); value[name].visible = event.target.checked; saveWidgets(value); renderWidgets(); });
}
document.querySelectorAll("[data-panel]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("dialog[open]").forEach(value => value.close()); document.querySelector(button.dataset.panel).showModal();
}));
document.querySelectorAll("dialog [data-close]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));

applySettings(); renderDesktop(); $("#clock-widget").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
