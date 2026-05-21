import { apiClient } from "@/api/client";
import { deleteToken, saveToken } from "@/auth/tokenStorage";
import type { LoginPayload, LoginResponse, ProfileResponse, User } from "@/types";

// Penerapan Factory Pattern (Functional) untuk AuthService
export const createAuthService = (client = apiClient) => {
    return {
        login: async (payload: LoginPayload): Promise<User> => {
            const response = await client.post<LoginResponse>("/login", payload);
            await saveToken(response.data.token);
            return response.data.user;
        },

        getCurrentUser: async (): Promise<User> => {
            const response = await client.get<ProfileResponse>("/profile");
            return response.data.user;
        },

        logout: async (): Promise<void> => {
            try {
                await client.post("/logout");
            } catch (error) {
                console.log("Logout error:", error); // ← ambil dari salsa
            } finally {
                await deleteToken();
            }
        }
    };
};

export const authService = createAuthService();
export const { login, getCurrentUser, logout } = authService;