import { apiClient } from "@/api/client";
import { deleteToken, saveToken } from "@/auth/tokenStorage";
import type { LoginPayload, LoginResponse, ProfileResponse, User } from "@/types";

export async function login(payload: LoginPayload): Promise<User> {
    const response = await apiClient.post("/login", payload);

    const data = response.data as LoginResponse;

    await saveToken(data.token);

    return data.user;
}

export async function getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/profile");

    const data = response.data as ProfileResponse;

    return data.user;
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post("/logout");
    } catch (error) {
        console.log("Logout error:", error);
    } finally {
        await deleteToken();
    }
}