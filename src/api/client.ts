import { create } from "axios";

import {
  endCurrentSession,
  setAuthSessionInactiveHandler,
  shouldEndCurrentSession,
} from "@/api/authSessionInterceptor";
import {
  isFormDataPayload,
  logMultipartError,
  setMultipartContentType,
} from "@/api/multipart";
import { getToken } from "@/auth/tokenStorage";
import { API_BASE_URL } from "@/constants/env";

export { setAuthSessionInactiveHandler };

export const createApiClient = (baseURL: string = API_BASE_URL) => {
  const client = create({
    baseURL,
    timeout: 30000,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  client.interceptors.request.use(async (config) => {
    if (isFormDataPayload(config.data) && config.headers) {
      setMultipartContentType(config.headers);
    }

    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      logMultipartError(error);

      if (shouldEndCurrentSession(error)) {
        await endCurrentSession();
      }

      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();
