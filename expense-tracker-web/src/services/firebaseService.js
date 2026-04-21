// localStorage-backed service — drop-in replacement for the Firebase version.
// All functions are async to keep the same call-site interface.

const KEYS = { users: 'et_users', groups: 'et_groups', expenses: 'et_expenses' };

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  return load(KEYS.users).find((u) => u.id === uid) || null;
}

export async function findUserByEmail(email) {
  return load(KEYS.users).find((u) => u.email === email.toLowerCase().trim()) || null;
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup({ name, members, createdBy }) {
  const groups = load(KEYS.groups);
  const group = { id: genId(), name, members, createdBy, createdAt: new Date().toISOString() };
  save(KEYS.groups, [...groups, group]);
  return group.id;
}

export async function getGroup(groupId) {
  return load(KEYS.groups).find((g) => g.id === groupId) || null;
}

export async function getUserGroupsWithMemberObjects(userId) {
  return load(KEYS.groups).filter((g) => g.members?.some((m) => m.id === userId));
}

export async function updateGroup(groupId, updates) {
  save(KEYS.groups, load(KEYS.groups).map((g) => g.id === groupId ? { ...g, ...updates } : g));
}

export async function addGroupMember(groupId, member) {
  save(KEYS.groups, load(KEYS.groups).map((g) =>
    g.id === groupId ? { ...g, members: [...(g.members || []), member] } : g
  ));
}

export async function removeGroupMember(groupId, memberId) {
  save(KEYS.groups, load(KEYS.groups).map((g) =>
    g.id === groupId ? { ...g, members: g.members.filter((m) => m.id !== memberId) } : g
  ));
}

export async function deleteGroup(groupId) {
  save(KEYS.groups, load(KEYS.groups).filter((g) => g.id !== groupId));
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function createExpense(data) {
  const expenses = load(KEYS.expenses);
  const expense = {
    ...data,
    id: genId(),
    date: data.date instanceof Date ? data.date.toISOString() : data.date,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.expenses, [...expenses, expense]);
  return expense.id;
}

export async function getGroupExpenses(groupId) {
  return load(KEYS.expenses)
    .filter((e) => e.groupId === groupId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getExpense(expenseId) {
  return load(KEYS.expenses).find((e) => e.id === expenseId) || null;
}

export async function updateExpense(expenseId, updates) {
  save(KEYS.expenses, load(KEYS.expenses).map((e) => e.id === expenseId ? { ...e, ...updates } : e));
}

export async function deleteExpense(expenseId) {
  save(KEYS.expenses, load(KEYS.expenses).filter((e) => e.id !== expenseId));
}

// ── Receipt Images ─────────────────────────────────────────────────────────────
// Images are not persisted (localStorage size limits).
// OCR scanning still works; the image just won't show in expense detail after save.

export async function uploadReceiptImage(_file, _expenseId) {
  return null;
}
