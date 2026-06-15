import * as SecureStore from "expo-secure-store";

import type { User, UserRole } from "@/types";

const TOKEN_KEY = "auth_token";
const CACHED_USER_KEY = "cached_auth_user";

type CachedAuthUser = Pick<User, "id" | "nama_lengkap" | "email" | "role">;

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "penyewa";
}

function parseCachedUser(value: string | null): CachedAuthUser | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      typeof parsed.id !== "number" ||
      !Number.isFinite(parsed.id) ||
      typeof parsed.nama_lengkap !== "string" ||
      typeof parsed.email !== "string" ||
      !isUserRole(parsed.role)
    )
      return null;

    return {
      id: parsed.id,
      nama_lengkap: parsed.nama_lengkap,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveCachedUser(user: User): Promise<void> {
  const cachedUser: CachedAuthUser = {
    id: user.id,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    role: user.role,
  };
  await SecureStore.setItemAsync(CACHED_USER_KEY, JSON.stringify(cachedUser));
}

export async function getCachedUser(): Promise<CachedAuthUser | null> {
  return parseCachedUser(await SecureStore.getItemAsync(CACHED_USER_KEY));
}

export async function deleteCachedUser(): Promise<void> {
  await SecureStore.deleteItemAsync(CACHED_USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await deleteToken();
  await deleteCachedUser();
}
