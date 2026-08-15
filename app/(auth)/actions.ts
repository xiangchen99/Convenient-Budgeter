"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  deleteSession,
  signInUser,
  signUpUser,
} from "@/lib/db/auth";

export type AuthState = { error: string | null; message: string | null };

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required.", message: null };
  }

  try {
    const { sessionId } = await signInUser(email, password);
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
    return { error: message, message: null };
  }

  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required.", message: null };
  }
  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters.",
      message: null,
    };
  }

  try {
    const { sessionId } = await signUpUser(email, password, displayName);
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create account.";
    return { error: message, message: null };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await deleteSession(token);
  }
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
