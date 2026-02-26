const STORAGE_KEY = "section_adviser_records_v1";
const AUTH_KEY = "section_adviser_auth_user";

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
}

function esc(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const defaults = {
  sections: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaults);
    const parsed = JSON.parse(raw);
    return {
      sections: Array.isArray(parsed.sections) ? parsed.sections : clone(defaults.sections)
    };
  } catch (_err) {
    return clone(defaults);
  }
}

const state = loadState();
let currentUser = null;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const appView = document.getElementById("appView");
const loginView = document.getElementById("loginView");
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const sectionForm = document.getElementById("sectionForm");
const rowsEl = document.getElementById("sectionRows");
const searchEl = document.getElementById("searchInput");
const filterEl = document.getElementById("filterGrade");
const emptyEl = document.getElementById("emptyText");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const clearDataBtn = document.getElementById("clearDataBtn");

const statSections = document.getElementById("statSections");
const statAssigned = document.getElementById("statAssigned");
const statGrades = document.getElementById("statGrades");
const currentRoleEl = document.getElementById("currentRole");
const accessBanner = document.getElementById("accessBanner");
const managementHint = document.getElementById("managementHint");

const gradeLevelInput = document.getElementById("gradeLevel");
const sectionNameInput = document.getElementById("sectionName");
const adviserNameInput = document.getElementById("adviserName");
const capacityInput = document.getElementById("capacity");

let editingId = "";

function showAppView() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function showLoginView() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function normalizeUser(value) {
  return String(value || "").trim().toLowerCase();
}

async function fetchUsers() {
  const response = await fetch("users.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load users.json");
  }

  const users = await response.json();
  if (!Array.isArray(users)) {
    throw new Error("Invalid users.json format");
  }

  return users;
}

async function authenticate(username, password) {
  const users = await fetchUsers();
  const normalized = normalizeUser(username);

  return users.find((user) => {
    return normalizeUser(user.username) === normalized && String(user.password) === password;
  });
}

function setAuthUser(user) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ username: user.username, role: user.role || "user" }));
}

function clearAuthUser() {
  sessionStorage.removeItem(AUTH_KEY);
}

function getAuthUser() {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.username) return null;
    return {
      username: parsed.username,
      role: parsed.role === "admin" ? "admin" : "user"
    };
  } catch (_err) {
    return null;
  }
}

function isAdminUser() {
  return Boolean(currentUser && currentUser.role === "admin");
}

function applyPermissions() {
  const admin = isAdminUser();
  currentRoleEl.textContent = admin ? "ADMIN" : "USER";

  gradeLevelInput.disabled = !admin;
  sectionNameInput.disabled = !admin;
  adviserNameInput.disabled = !admin;
  capacityInput.disabled = !admin;
  submitBtn.disabled = !admin;
  cancelEditBtn.disabled = !admin;
  clearDataBtn.disabled = !admin;

  if (admin) {
    accessBanner.classList.add("hidden");
    managementHint.textContent = "Add or edit records with real-time updates.";
  } else {
    accessBanner.textContent = "User mode: view/search/filter only. Section creation, edit, assign, delete, and clear are admin-only.";
    accessBanner.classList.remove("hidden");
    managementHint.textContent = "Admin-only tools are disabled for this account.";
  }
}

function denyAdminAction() {
  accessBanner.textContent = "Action blocked: only admin can modify records.";
  accessBanner.classList.remove("hidden");
}

function getFilteredSections() {
  const q = searchEl.value.trim().toLowerCase();
  const grade = filterEl.value.trim();
  return state.sections.filter((row) => {
    const adviser = (row.adviser || "").toLowerCase();
    const searchPass = !q || row.name.toLowerCase().includes(q) || adviser.includes(q);
    const gradePass = !grade || row.grade === grade;
    return searchPass && gradePass;
  });
}

function renderStats() {
  const total = state.sections.length;
  const assigned = state.sections.filter((s) => (s.adviser || "").trim()).length;
  const grades = new Set(state.sections.map((s) => s.grade)).size;
  statSections.textContent = String(total);
  statAssigned.textContent = String(assigned);
  statGrades.textContent = String(grades);
}

function renderTable() {
  const list = getFilteredSections();
  const admin = isAdminUser();

  rowsEl.innerHTML = list.map((row) => {
    const assigned = (row.adviser || "").trim().length > 0;
    const actions = admin
      ? `
          <div class="table-actions">
            <button class="btn btn-secondary mini" type="button" onclick="editRow('${row.id}')">Edit</button>
            <button class="btn btn-ghost mini" type="button" onclick="toggleAssign('${row.id}')">${assigned ? "Unassign" : "Assign"}</button>
            <button class="btn btn-ghost mini" type="button" onclick="deleteRow('${row.id}')">Delete</button>
          </div>
        `
      : `<span class="muted">View only</span>`;

    return `
      <tr>
        <td>${esc(row.grade)}</td>
        <td>${esc(row.name)}</td>
        <td>${esc(row.adviser || "Unassigned")}</td>
        <td>${esc(row.capacity || "-")}</td>
        <td><span class="status ${assigned ? "" : "pending"}">${assigned ? "Assigned" : "Pending"}</span></td>
        <td>${actions}</td>
      </tr>
    `;
  }).join("");

  emptyEl.style.display = list.length ? "none" : "block";
  renderStats();
}

function resetSectionForm() {
  editingId = "";
  sectionForm.reset();
  submitBtn.textContent = "Add Section";
}

function editRow(id) {
  if (!isAdminUser()) {
    denyAdminAction();
    return;
  }

  const row = state.sections.find((item) => item.id === id);
  if (!row) return;
  editingId = id;
  gradeLevelInput.value = row.grade;
  sectionNameInput.value = row.name;
  adviserNameInput.value = row.adviser || "";
  capacityInput.value = row.capacity || "";
  submitBtn.textContent = "Update Section";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRow(id) {
  if (!isAdminUser()) {
    denyAdminAction();
    return;
  }

  state.sections = state.sections.filter((item) => item.id !== id);
  saveState();
  renderTable();
  if (editingId === id) resetSectionForm();
}

function toggleAssign(id) {
  if (!isAdminUser()) {
    denyAdminAction();
    return;
  }

  const row = state.sections.find((item) => item.id === id);
  if (!row) return;
  row.adviser = (row.adviser || "").trim() ? "" : "TBD Adviser";
  saveState();
  renderTable();
}

window.editRow = editRow;
window.deleteRow = deleteRow;
window.toggleAssign = toggleAssign;

sectionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isAdminUser()) {
    denyAdminAction();
    return;
  }

  const grade = gradeLevelInput.value.trim();
  const name = sectionNameInput.value.trim();
  const adviser = adviserNameInput.value.trim();
  const capacity = capacityInput.value.trim();

  if (!grade || !name) return;

  if (editingId) {
    const row = state.sections.find((item) => item.id === editingId);
    if (!row) return;
    row.grade = grade;
    row.name = name;
    row.adviser = adviser;
    row.capacity = capacity;
  } else {
    state.sections.push({ id: makeId(), grade, name, adviser, capacity });
  }

  saveState();
  renderTable();
  resetSectionForm();
});

searchEl.addEventListener("input", renderTable);
filterEl.addEventListener("change", renderTable);

cancelEditBtn.addEventListener("click", () => {
  if (!isAdminUser()) {
    denyAdminAction();
    return;
  }
  resetSectionForm();
});

clearDataBtn.addEventListener("click", () => {
  if (!isAdminUser()) {
    denyAdminAction();
    return;
  }

  state.sections = [];
  saveState();
  renderTable();
  resetSectionForm();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginError.textContent = "Enter your username and password.";
    return;
  }

  try {
    const user = await authenticate(username, password);
    if (!user) {
      loginError.textContent = "Invalid username or password.";
      return;
    }

    currentUser = {
      username: user.username,
      role: user.role === "admin" ? "admin" : "user"
    };

    setAuthUser(currentUser);
    loginForm.reset();
    showAppView();
    applyPermissions();
    renderTable();
  } catch (_error) {
    loginError.textContent = "Could not load users. Open the project through a local server.";
  }
});

logoutBtn.addEventListener("click", () => {
  clearAuthUser();
  currentUser = null;
  showLoginView();
  loginError.textContent = "";
  loginPassword.value = "";
  loginUsername.focus();
});

function init() {
  currentUser = getAuthUser();

  if (currentUser) {
    showAppView();
    applyPermissions();
    renderTable();
    return;
  }

  showLoginView();
  loginUsername.focus();
}

init();
