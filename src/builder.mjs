import { createPackage } from "./core.mjs";

const $ = selector => document.querySelector(selector);
let html = "";

function slug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function message(text, error = false) {
  $("#status").textContent = text;
  $("#status").classList.toggle("error", error);
}

$("#html-file").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  html = await file.text();
  $("#name").value ||= file.name.replace(/\.html?$/i, "");
  $("#id").value ||= slug($("#name").value);
  $("#preview").srcdoc = html;
  message(`Loaded ${new TextEncoder().encode(html).byteLength.toLocaleString()} bytes. Preview is isolated.`);
});

$("#name").addEventListener("input", () => { if (!$("#id").dataset.manual) $("#id").value = slug($("#name").value); });
$("#id").addEventListener("input", () => { $("#id").dataset.manual = "true"; });

$("#build-form").addEventListener("submit", event => {
  event.preventDefault();
  try {
    if (!html) throw new Error("Choose a complete HTML file first.");
    const pkg = createPackage({
      id: $("#id").value,
      name: $("#name").value,
      categories: $("#categories").value.split(",").map(value => value.trim()).filter(Boolean),
      icon: $("#icon").value,
      type: $("#type").value,
      desktopIcon: $("#desktop-icon").checked,
      html,
    });
    const blob = new Blob([JSON.stringify(pkg, null, 2) + "\n"], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${pkg.item.id}.vaios`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    message(`Downloaded ${link.download} directly. No AI or reskin step was invoked.`);
  } catch (error) { message(error.message, true); }
});
