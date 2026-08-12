// ShimbaData Collector popup — manual entry + opt-in page detection.

const API = "https://shimbadata.onrender.com";

const SCHEMAS = {
  schools: {
    fields: [
      { name: "name", label: "School name", placeholder: "e.g. Lusaka Central Secondary School", required: true },
      { name: "level", label: "Level", placeholder: "e.g. Primary, Secondary, University" },
      { name: "province", label: "Province", placeholder: "e.g. Lusaka" },
      { name: "district", label: "District", placeholder: "e.g. Lusaka" },
      { name: "lat", label: "Latitude", placeholder: "e.g. -15.4271" },
      { name: "lon", label: "Longitude", placeholder: "e.g. 28.2518" },
    ],
  },
  papers: {
    fields: [
      { name: "title", label: "Paper title", placeholder: "e.g. G12 ECZ Mathematics 2022 Paper 1", required: true },
      { name: "subject", label: "Subject", placeholder: "e.g. Mathematics" },
      { name: "grade", label: "Grade", placeholder: "e.g. 12" },
      { name: "year", label: "Year", placeholder: "e.g. 2022" },
      { name: "questionsCount", label: "Question count", placeholder: "e.g. 10" },
    ],
  },
  "health-facilities": {
    fields: [
      { name: "name", label: "Facility name", placeholder: "e.g. Chamakubi Health Post", required: true },
      { name: "type", label: "Type", placeholder: "e.g. Health Post, Clinic, Hospital" },
      { name: "province", label: "Province", placeholder: "e.g. Central" },
      { name: "district", label: "District", placeholder: "e.g. Chibombo" },
      { name: "status", label: "Status", placeholder: "e.g. Operational" },
      { name: "lat", label: "Latitude", placeholder: "e.g. -14.7999" },
      { name: "lon", label: "Longitude", placeholder: "e.g. 27.6419" },
    ],
  },
  laws: {
    fields: [
      { name: "title", label: "Law / Act title", placeholder: "e.g. Education Act", required: true },
      { name: "year", label: "Year", placeholder: "e.g. 2016" },
      { name: "category", label: "Category", placeholder: "e.g. Education" },
      { name: "chapter", label: "Chapter", placeholder: "e.g. 23" },
    ],
  },
};

let currentDataset = "schools";
let inputs = {};
let candidates = [];

const $ = (id) => document.getElementById(id);

function renderForm() {
  const schema = SCHEMAS[currentDataset];
  const form = $("form");
  form.innerHTML = "";
  inputs = {};
  for (const f of schema.fields) {
    const label = document.createElement("label");
    label.textContent = f.label + (f.required ? " *" : "");
    const input = document.createElement("input");
    input.placeholder = f.placeholder || "";
    input.required = !!f.required;
    input.id = "f_" + f.name;
    inputs[f.name] = input;
    form.appendChild(label);
    form.appendChild(input);
  }
  $("candidates").innerHTML = "";
  candidates = [];
}

function collectEntry() {
  const entry = {};
  for (const [k, input] of Object.entries(inputs)) {
    const v = input.value.trim();
    if (v === "") continue;
    const n = parseFloat(v);
    entry[k] = k === "lat" || k === "lon" || k === "grade" || k === "year" || k === "questionsCount"
      ? (Number.isNaN(n) ? v : n) : v;
  }
  return entry;
}

function showStatus(msg, ok) {
  const s = $("status");
  s.textContent = msg;
  s.className = "status " + (ok ? "ok" : "err");
}

async function submit() {
  const email = $("email").value.trim();
  const entry = collectEntry();
  if (!email) return showStatus("Enter your email first.", false);
  const schema = SCHEMAS[currentDataset];
  for (const f of schema.fields) {
    if (f.required && !entry[f.name]) return showStatus(`"${f.label}" is required.`, false);
  }
  $("submitBtn").disabled = true;
  showStatus("Submitting…", true);
  try {
    const r = await fetch(`${API}/api/sd/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset: currentDataset, entry, email }),
    });
    const d = await r.json();
    if (r.ok) {
      showStatus(`Submitted ✓ (${d.id}) — pending review.`, true);
      chrome.storage.local.set({ email });
      for (const input of Object.values(inputs)) input.value = "";
      $("email").value = email;
      $("consentBox").checked = false;
      $("submitBtn").disabled = true;
    } else {
      showStatus("Error: " + (d.error || r.status), false);
      $("submitBtn").disabled = false;
    }
  } catch {
    showStatus("Network error — try again.", false);
    $("submitBtn").disabled = false;
  }
}

// ── Opt-in page detection (reads visible text only on click) ──
async function detect() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: detectOnPage });
    const data = results?.[0]?.result;
    if (!data) return showStatus("Could not read this page.", false);

    const schema = SCHEMAS[currentDataset];
    candidates = data.candidates || [];
    const box = $("candidates");
    box.innerHTML = "";
    candidates.forEach((c) => {
      const el = document.createElement("div");
      el.className = "candidate";
      el.textContent = c;
      el.onclick = () => {
        inputs.name.value = c;
        box.innerHTML = "";
      };
      box.appendChild(el);
    });
    if (candidates.length) showStatus(`${candidates.length} candidate${candidates.length > 1 ? "s" : ""} found — click one to fill the name.`, true);
    else showStatus("No obvious candidates on this page. Fill the form manually.", false);

    if (currentDataset === "schools" || currentDataset === "health-facilities") {
      const address = data.address;
      if (address && !inputs.province?.value) {
        const m = address.match(/(Central|Copperbelt|Eastern|Luapula|Lusaka|Muchinga|North-Western|Northern|Southern|Western)\s+Province/i);
        if (m) inputs.province.value = m[1].charAt(0).toUpperCase() + m[1].slice(1);
      }
    }
  } catch {
    showStatus("Could not run detection on this page (try a normal website tab).", false);
  }
}

function detectOnPage() {
  const text = (document.body ? document.body.innerText.slice(0, 30000) : "") || "";
  const words = text.split(/\s+/).filter(Boolean);
  const candidates = [];
  for (let i = 0; i < words.length - 2; i++) {
    const w = words[i];
    if (!/^[A-Z]/.test(w) || w.length < 4) continue;
    if (!/^(Mr|Mrs|Ms|Dr|The|Tel|Email|Address|P\.O|Box|www)/i.test(w)) {
      const phrase = [w, words[i + 1], words[i + 2]].join(" ");
      if (/School|College|Academy|University|Institute|Clinic|Hospital|Health/i.test(phrase)) {
        candidates.push(phrase);
      }
    }
  }
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const address = lines.find((l) => /Province|Zambia/i.test(l)) || "";
  return { title: document.title, candidates: [...new Set(candidates)].slice(0, 4), address };
}

// ── Wiring ──
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      currentDataset = t.dataset.dataset;
      renderForm();
      $("candidates").innerHTML = "";
    };
  });
  renderForm();

  chrome.storage.local.get(["email"], (d) => { if (d.email) $("email").value = d.email; });
  $("detectBtn").onclick = detect;
  $("consentBox").onchange = (e) => {
    const entry = collectEntry();
    const schema = SCHEMAS[currentDataset];
    const filled = schema.fields.filter((f) => f.required && entry[f.name]).length === schema.fields.filter((f) => f.required).length;
    $("submitBtn").disabled = !(e.target.checked && filled && $("email").value.trim());
  };
  $("email").oninput = () => {
    $("submitBtn").disabled = !($("consentBox").checked && $("email").value.trim());
  };
  $("form").addEventListener("input", () => {
    $("submitBtn").disabled = !($("consentBox").checked && $("email").value.trim());
  });
  $("submitBtn").onclick = submit;
});
