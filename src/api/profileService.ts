import { apiClient } from "@/api/client";
import type {
    PasswordChangePayload,
    PasswordChangeResponse,
    ProfileResponse,
} from "@/types/profile";

export const createProfileService = (client = apiClient) => ({
    getProfile: async (): Promise<ProfileResponse> => {
        const response = await client.get<ProfileResponse>("/profile");
        return response.data;
    },

    changePassword: async (
        payload: PasswordChangePayload,
    ): Promise<PasswordChangeResponse> => {
        const response = await client.patch<PasswordChangeResponse>(
            "/profile/password",
            payload,
        );
        return response.data;
    },
});

export const profileService = createProfileService();
