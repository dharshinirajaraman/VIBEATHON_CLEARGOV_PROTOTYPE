export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: string;
  age?: string;
  gender?: string;
  profilePhoto?: string;
}

export interface UploadedDoc {
  docId: string;
  label: string;
  fileName: string;
  fileType: string;
  fileSizeKB: number;
  dataUrl: string;
  uploadedAt: string;
}

export type AppStatus =
  | "pending_ai"
  | "ai_pass"
  | "ai_flagged"
  | "admin_reviewing"
  | "approved"
  | "rejected"
  | "more_info";

export interface AIIssue {
  docId: string;
  docLabel: string;
  code: string;
  message: string;
}

export interface ApplicationEvent {
  id: string;
  status: AppStatus;
  label: string;
  note?: string;
  at: string;
}

export interface Application {
  id: string;
  refNo: string;
  userId: string;
  userName: string;
  userEmail: string;
  schemeId: string;
  schemeName: string;
  schemeCategory: string;
  status: AppStatus;
  submittedAt: string;
  updatedAt: string;
  // Personal details
  fullName: string;
  age?: string;
  dob: string;
  gender: string;
  profilePhoto?: string;
  mobile: string;
  altMobile: string;
  email: string;
  fatherName: string;
  motherName: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  aadhar: string;
  pan: string;
  annualIncome: string;
  category: string;
  // Documents
  documents: UploadedDoc[];
  // AI + admin
  aiIssues: AIIssue[];
  adminNote: string;
  adminAction: string;
  adminActedAt: string;
  rejectionReason?: string;
  manualReviewReason?: string;
  timeline?: ApplicationEvent[];
}

import { SCHEMES, type Scheme } from "../data/schemes";

const KEYS = {
  USERS: "cg_users",
  APPS: "cg_applications",
  SESSION: "cg_session",
  CUSTOM_SCHEMES: "cg_custom_schemes",
  SAVED_SCHEMES: "cg_saved_schemes",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Simple hash (not cryptographic — browser-only demo) ──
function hashPw(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = (h << 5) + h + pw.charCodeAt(i);
  return (h >>> 0).toString(16);
}

// ── Users ──
export function getUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(KEYS.USERS, []);
}

export function registerUser(name: string, email: string, password: string): StoredUser | null {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return null;
  const user: StoredUser = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    email: email.toLowerCase(),
    passwordHash: hashPw(password),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  writeJSON(KEYS.USERS, [...users, user]);
  return user;
}

export function updateUser(id: string, patch: Partial<Pick<StoredUser, "name" | "email" | "age" | "gender" | "profilePhoto">>): StoredUser | null {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...patch };
  writeJSON(KEYS.USERS, users);
  const session = loadSession();
  if (session?.id === id) writeJSON(KEYS.SESSION, users[index]);
  return users[index];
}

export function loginUser(email: string, password: string): StoredUser | null {
  // Admin hardcoded
  if (
    email.trim().toLowerCase() === "admin@cleargov.gov.in" &&
    password === "Admin@2025"
  ) {
    return {
      id: "admin",
      name: "Administrator",
      email: "admin@cleargov.gov.in",
      passwordHash: "",
      role: "admin",
      createdAt: "2024-01-01T00:00:00Z",
    };
  }
  const users = getUsers();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.passwordHash === hashPw(password)
  );
  return user ?? null;
}

export function emailExists(email: string): boolean {
  return !!getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// ── Session ──
export function saveSession(user: StoredUser): void {
  writeJSON(KEYS.SESSION, user);
}

export function loadSession(): StoredUser | null {
  return readJSON<StoredUser | null>(KEYS.SESSION, null);
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.SESSION);
}

// ── Applications ──
export function getApplications(): Application[] {
  return readJSON<Application[]>(KEYS.APPS, []);
}

export function getApplicationsByUser(userId: string): Application[] {
  return getApplications().filter((a) => a.userId === userId);
}

export function getApplicationById(id: string): Application | null {
  return getApplications().find((a) => a.id === id) ?? null;
}

function genRef(): string {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CG${yy}${mm}-${rand}`;
}

export function saveApplication(app: Omit<Application, "id" | "refNo" | "submittedAt" | "updatedAt">): Application {
  const apps = getApplications();
  const now = new Date().toISOString();
  const full: Application = {
    ...app,
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    refNo: genRef(),
    submittedAt: now,
    updatedAt: now,
    timeline: app.timeline ?? [{ id: `event_${Date.now()}`, status: app.status, label: "Application submitted", at: now }],
  };
  writeJSON(KEYS.APPS, [...apps, full]);
  return full;
}

export function updateApplication(id: string, patch: Partial<Application>): boolean {
  const apps = getApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  const now = new Date().toISOString();
  const current = apps[idx];
  const timeline = patch.status && patch.status !== current.status
    ? [...(current.timeline ?? []), { id: `event_${Date.now()}`, status: patch.status, label: patch.status === "rejected" ? "Application rejected" : patch.status === "more_info" ? "More information requested" : patch.status === "approved" ? "Application approved" : "Application sent for review", note: patch.rejectionReason ?? patch.manualReviewReason ?? patch.adminNote, at: now }]
    : current.timeline;
  apps[idx] = { ...current, ...patch, timeline, updatedAt: now };
  writeJSON(KEYS.APPS, apps);
  return true;
}

export function getSavedSchemeIds(userId: string): string[] {
  return readJSON<Record<string, string[]>>(KEYS.SAVED_SCHEMES, {})[userId] ?? [];
}

export function toggleSavedScheme(userId: string, schemeId: string): string[] {
  const saved = readJSON<Record<string, string[]>>(KEYS.SAVED_SCHEMES, {});
  const current = saved[userId] ?? [];
  saved[userId] = current.includes(schemeId) ? current.filter(id => id !== schemeId) : [...current, schemeId];
  writeJSON(KEYS.SAVED_SCHEMES, saved);
  return saved[userId];
}

export function getAvailableSchemes(): Scheme[] {
  return [...SCHEMES, ...readJSON<Scheme[]>(KEYS.CUSTOM_SCHEMES, [])];
}

export function saveCustomScheme(scheme: Omit<Scheme, "id" | "schemeCode">): Scheme {
  const custom = readJSON<Scheme[]>(KEYS.CUSTOM_SCHEMES, []);
  const full: Scheme = {
    ...scheme,
    id: `custom_${Date.now()}`,
    schemeCode: `CG-CUSTOM-${String(custom.length + 1).padStart(3, "0")}`,
  };
  writeJSON(KEYS.CUSTOM_SCHEMES, [...custom, full]);
  return full;
}
