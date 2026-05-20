import axios from "axios";

import { deleteToken, getToken } from "@/auth/tokenStorage";
import { API_BASE_URL } from "@/constants/env";

// Penerapan Factory Pattern untuk HTTP Client
export const createApiClient = (baseURL: string = API_BASE_URL) => {
    const client = axios.create({
        baseURL,
        timeout: 10000,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });

    client.interceptors.request.use(async (config) => {
        const token = await getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401) {
                await deleteToken();
            }

            return Promise.reject(error);
        }
    );

    return client;
};

// Membuat instance default agar logika dan import di file lain tidak perlu diubah
export const apiClient = createApiClient();

