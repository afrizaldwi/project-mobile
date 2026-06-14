import type { UserRole } from "@/types";

export type ParsedProfileScope = {
    role: UserRole;
    userId: number;
};

const PROFILE_SCOPE_PATTERN = /^(admin|penyewa):(\d+)$/;

export function parseProfileScope(scope: string): ParsedProfileScope {
    const match = scope.match(PROFILE_SCOPE_PATTERN);
    const userId = match ? Number(match[2]) : Number.NaN;
    if (!match || !Number.isInteger(userId) || userId < 1) {
        throw new Error("Scope profil tidak valid.");
    }

    return {
        role: match[1] as UserRole,
        userId,
    };
}

export function buildProfileScope(role: UserRole, userId: number): string {
    if ((role !== "admin" && role !== "penyewa") || !Number.isInteger(userId) || userId < 1) {
        throw new Error("Scope profil tidak valid.");
    }

    return `${role}:${userId}`;
}
