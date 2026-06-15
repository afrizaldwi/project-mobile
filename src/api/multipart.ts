import type { InternalAxiosRequestConfig } from "axios";

type MultipartFieldDebug = {
  field: string;
  isFile: boolean;
  hasUri?: boolean;
  hasName?: boolean;
  hasType?: boolean;
};

export function isFormDataPayload(data: unknown): data is FormData {
  if (!data || typeof data !== "object") return false;

  const candidate = data as { append?: unknown; _parts?: unknown };
  return (
    (typeof FormData !== "undefined" && data instanceof FormData) ||
    (typeof candidate.append === "function" && Array.isArray(candidate._parts))
  );
}

export function setMultipartContentType(
  headers: InternalAxiosRequestConfig["headers"],
) {
  const value = "multipart/form-data";
  const mutableHeaders = headers as any;

  if (typeof mutableHeaders.setContentType === "function") {
    mutableHeaders.setContentType(value);
    return;
  }

  if (typeof mutableHeaders.set === "function") {
    mutableHeaders.set("Content-Type", value);
    return;
  }

  mutableHeaders["Content-Type"] = value;
}

function getMultipartDebugFields(data: unknown): MultipartFieldDebug[] {
  const parts = (data as { _parts?: unknown })._parts;
  if (!Array.isArray(parts)) return [];

  return parts.map((part) => {
    const [field, value] = Array.isArray(part)
      ? part
      : [String(part), undefined];
    const isFile = Boolean(
      value && typeof value === "object" && "uri" in value,
    );
    const file = value as
      | { uri?: unknown; name?: unknown; type?: unknown }
      | undefined;

    return {
      field: String(field),
      isFile,
      ...(isFile
        ? {
            hasUri: Boolean(file?.uri),
            hasName: Boolean(file?.name),
            hasType: Boolean(file?.type),
          }
        : {}),
    };
  });
}

export function logMultipartError(error: unknown) {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;

  const config = (error as { config?: InternalAxiosRequestConfig }).config;
  if (!config || !isFormDataPayload(config.data)) return;

  console.log("[api multipart error]", {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL ?? ""}${config.url ?? ""}`,
    isFormData: true,
    fields: getMultipartDebugFields(config.data),
  });
}
