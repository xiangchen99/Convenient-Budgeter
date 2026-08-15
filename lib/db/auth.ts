import { cache } from "react";
import { cookies } from "next/headers";
import { getDb } from "./index";

export const AUTH_COOKIE_NAME = "cb_session_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#16a34a" },
  { name: "Groceries", color: "#0d9488" },
  { name: "Transport", color: "#2563eb" },
  { name: "Shopping", color: "#d97706" },
  { name: "Bills & Utilities", color: "#dc2626" },
  { name: "Entertainment", color: "#7c3aed" },
  { name: "Health", color: "#db2777" },
  { name: "Other", color: "#64748b" },
];

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function hashPassword(
  password: string,
  existingSaltHex?: string
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const saltBytes = existingSaltHex
    ? hexToBuffer(existingSaltHex)
    : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = existingSaltHex ?? bufferToHex(saltBytes.buffer);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashHex = bufferToHex(derivedBits);
  return { hash: hashHex, salt: saltHex };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  return hash === storedHash;
}

export async function createSession(userId: string): Promise<string> {
  const db = await getDb();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db
    .prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
    )
    .bind(sessionId, userId, expiresAt)
    .run();

  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const db = await getDb();
  await db
    .prepare("DELETE FROM sessions WHERE id = ?")
    .bind(sessionId)
    .run();
}

export async function signUpUser(
  emailInput: string,
  passwordInput: string,
  displayNameInput?: string
): Promise<{ user: AuthUser; sessionId: string }> {
  const db = await getDb();
  const email = emailInput.trim().toLowerCase();

  // Check if user already exists
  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string }>();

  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const userId = crypto.randomUUID();
  const { hash, salt } = await hashPassword(passwordInput);
  const displayName = displayNameInput?.trim() || email.split("@")[0];

  // Create user and profile
  const statements = [
    db
      .prepare(
        "INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)"
      )
      .bind(userId, email, hash, salt),
    db
      .prepare("INSERT INTO profiles (id, display_name) VALUES (?, ?)")
      .bind(userId, displayName),
  ];

  // Seed default categories
  for (const cat of DEFAULT_CATEGORIES) {
    statements.push(
      db
        .prepare(
          "INSERT INTO categories (id, user_id, name, color) VALUES (?, ?, ?, ?)"
        )
        .bind(crypto.randomUUID(), userId, cat.name, cat.color)
    );
  }

  await db.batch(statements);

  const sessionId = await createSession(userId);
  return {
    user: { id: userId, email, created_at: new Date().toISOString() },
    sessionId,
  };
}

export async function signInUser(
  emailInput: string,
  passwordInput: string
): Promise<{ user: AuthUser; sessionId: string }> {
  const db = await getDb();
  const email = emailInput.trim().toLowerCase();

  const userRecord = await db
    .prepare(
      "SELECT id, email, password_hash, salt, created_at FROM users WHERE email = ?"
    )
    .bind(email)
    .first<{
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      created_at: string;
    }>();

  if (!userRecord) {
    throw new Error("Invalid email or password.");
  }

  const isValid = await verifyPassword(
    passwordInput,
    userRecord.password_hash,
    userRecord.salt
  );

  if (!isValid) {
    throw new Error("Invalid email or password.");
  }

  const sessionId = await createSession(userRecord.id);
  return {
    user: {
      id: userRecord.id,
      email: userRecord.email,
      created_at: userRecord.created_at,
    },
    sessionId,
  };
}

export const getSessionUser = cache(async function getSessionUser(
  sessionId?: string
): Promise<{ user: AuthUser; profile: UserProfile | null } | null> {
  if (!sessionId) return null;

  try {
    const db = await getDb();
    const nowIso = new Date().toISOString();

    const session = await db
      .prepare(
        `SELECT s.id as session_id, s.user_id, s.expires_at,
                u.email, u.created_at as user_created_at,
                p.display_name, p.created_at as profile_created_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN profiles p ON p.id = s.user_id
         WHERE s.id = ? AND s.expires_at > ?`
      )
      .bind(sessionId, nowIso)
      .first<{
        session_id: string;
        user_id: string;
        expires_at: string;
        email: string;
        user_created_at: string;
        display_name: string | null;
        profile_created_at: string | null;
      }>();

    if (!session) return null;

    return {
      user: {
        id: session.user_id,
        email: session.email,
        created_at: session.user_created_at,
      },
      profile: {
        id: session.user_id,
        display_name: session.display_name,
        created_at: session.profile_created_at ?? session.user_created_at,
      },
    };
  } catch {
    return null;
  }
});

export const getCurrentUser = cache(async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await getSessionUser(token);
  return result?.user ?? null;
});

export const getUserProfile = cache(async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const db = await getDb();
    const profile = await db
      .prepare("SELECT id, display_name, created_at FROM profiles WHERE id = ?")
      .bind(userId)
      .first<UserProfile>();
    return profile ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
