import { apiClient } from "@/api/client";
import { deleteToken, saveToken } from "@/auth/tokenStorage";
import type { LoginPayload, LoginResponse, ProfileResponse, User } from "@/types";

export async function login(payload: LoginPayload): Promise<User> {
    const response = await apiClient.post<LoginResponse>("/login", payload);

    await saveToken(response.data.token);

    return response.data.user;
}

export async function getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ProfileResponse>("/profile");

    return response.data.user;
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post("/logout");
    } finally {
        await deleteToken();
    }
}