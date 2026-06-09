import { apiClient } from "@/api/client";
import { deleteCachedUser, deleteToken, saveCachedUser, saveToken } from "@/auth/tokenStorage";
import type { LoginPayload, LoginResponse, ProfileResponse, User } from "@/types";

// Penerapan Factory Pattern (Functional) untuk AuthService
export const createAuthService = (client = apiClient) => {
    return {
        login: async (payload: LoginPayload): Promise<User> => {
            const response = await client.post<LoginResponse>(
                "/login",
                {
                    ...payload,
                    client_type: "mobile",
                },
                {
                    headers: {
                        "X-Client-Type": "mobile",
                    },
                }
            );
            const token = response.data.token || response.data.access_token;

            if (!token) {
                throw new Error("Token login tidak ditemukan dari server.");
            }

            await saveToken(token);
            await saveCachedUser(response.data.user);
            return response.data.user;
        },

        getCurrentUser: async (): Promise<User> => {
            const response = await client.get<ProfileResponse>("/profile");
            await saveCachedUser(response.data.user);
            return response.data.user;
        },

        logout: async (): Promise<void> => {
            try {
                await client.post("/logout");
            } catch (error) {
                console.log("Logout error:", error); // ← ambil dari salsa
            } finally {
                await deleteToken();
                await deleteCachedUser();
            }
        }
    };
};

export const authService = createAuthService();
export const { login, getCurrentUser, logout } = authService;
