import type { InternalAxiosRequestConfig } from "axios";

import { clearAuthStorage, getToken } from "@/auth/tokenStorage";

type AuthSessionInactiveHandler = (message: string) => void | Promise<void>;

let authSessionInactiveHandler: AuthSessionInactiveHandler | null = null;
let sessionTerminationPromise: Promise<void> | null = null;

export function setAuthSessionInactiveHandler(
  handler: AuthSessionInactiveHandler | null,
) {
  authSessionInactiveHandler = handler;
}

function getRequestUrl(config?: InternalAxiosRequestConfig) {
  return String(config?.url ?? "");
}

function isPenyewaProtectedRequest(url: string) {
  return url.startsWith("/penyewa") || url.includes("/penyewa/");
}

function isProfileInactiveSewaError(url: string, message: string) {
  if (!url.startsWith("/profile")) return false;

  const normalized = message.toLowerCase();
  return (
    normalized.includes("sewa") ||
    normalized.includes("penyewa") ||
    normalized.includes("tidak aktif") ||
    normalized.includes("nonaktif")
  );
}

function isLoginRequest(url: string) {
  return url === "/login" || url.endsWith("/login");
}

function isLogoutRequest(url: string) {
  return url === "/logout" || url.endsWith("/logout");
}

export function shouldEndCurrentSession(error: unknown) {
  const candidate = error as {
    config?: InternalAxiosRequestConfig;
    response?: { status?: number; data?: { message?: string } };
  };
  const status = candidate.response?.status;
  const url = getRequestUrl(candidate.config);
  const message = candidate.response?.data?.message ?? "";

  if (status === 401) {
    if (isLoginRequest(url) || isLogoutRequest(url)) {
      return false;
    }

    return true;
  }

  if (status !== 403) return false;

  return (
    isPenyewaProtectedRequest(url) || isProfileInactiveSewaError(url, message)
  );
}

export async function endCurrentSession(
  message = "Sesi Anda sudah tidak aktif. Silakan login kembali.",
) {
  if (sessionTerminationPromise) {
    await sessionTerminationPromise;
    return;
  }

  sessionTerminationPromise = (async () => {
    const token = await getToken();

    if (!token) {
      return;
    }

    await clearAuthStorage();
    await authSessionInactiveHandler?.(message);
  })();

  try {
    await sessionTerminationPromise;
  } finally {
    sessionTerminationPromise = null;
  }
}
