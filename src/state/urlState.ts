import type { SimulationRequest } from "../contracts/generated/simulation-request";

export const URL_STATE_PARAM = "state";
export const URL_STATE_VERSION = "1.0.0";

type EncodedUrlState = {
  version: typeof URL_STATE_VERSION;
  request: SimulationRequest;
};

export function encodeUrlState(request: SimulationRequest): string {
  const payload: EncodedUrlState = { request, version: URL_STATE_VERSION };
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeUrlState(value: string): SimulationRequest | null {
  try {
    const parsed = JSON.parse(base64UrlDecode(value)) as Partial<EncodedUrlState>;
    if (parsed.version !== URL_STATE_VERSION || !parsed.request) return null;
    return parsed.request;
  } catch {
    return null;
  }
}

export function requestFromLocationSearch(search: string): SimulationRequest | null {
  const params = new URLSearchParams(search);
  const encoded = params.get(URL_STATE_PARAM);
  return encoded ? decodeUrlState(encoded) : null;
}

export function writeRequestToUrl(request: SimulationRequest): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set(URL_STATE_PARAM, encodeUrlState(request));
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): string {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}
