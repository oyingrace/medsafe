"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

const SESSION_COOKIE = "ms_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function expectedToken() {
  const secret = process.env.SESSION_SECRET ?? "medsafe-dev-secret";
  const user = process.env.DASHBOARD_USERNAME ?? "admin";
  const pass = process.env.DASHBOARD_PASSWORD ?? "medsafe2026";
  return createHmac("sha256", secret).update(`${user}:${pass}`).digest("hex");
}

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const username = (formData.get("username") as string ?? "").trim();
  const password = (formData.get("password") as string ?? "").trim();

  const validUser = process.env.DASHBOARD_USERNAME ?? "admin";
  const validPass = process.env.DASHBOARD_PASSWORD ?? "medsafe2026";

  if (username !== validUser || password !== validPass) {
    return { error: "Invalid username or password." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return token === expectedToken() ? { username: process.env.DASHBOARD_USERNAME ?? "admin" } : null;
}
