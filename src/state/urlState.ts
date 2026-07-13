import { unzlibSync, zlibSync } from "fflate";
import type { SimulationRequest } from "../contracts/generated/simulation-request";

export const URL_STATE_PARAM = "state";
export const URL_STATE_VERSION = "2.0.0";
export const LEGACY_URL_STATE_VERSION = "1.0.0";

const COMPRESSED_STATE_PREFIX = "v2.";
const MAX_ENCODED_STATE_CHARS = 32_768;
const MAX_DECOMPRESSED_STATE_BYTES = 65_536;

type EncodedUrlState = {
  version: typeof URL_STATE_VERSION;
  request: SimulationRequest;
};

type LegacyEncodedUrlState = {
  version: typeof LEGACY_URL_STATE_VERSION;
  request: SimulationRequest;
};

export function encodeUrlState(request: SimulationRequest): string {
  const payload: EncodedUrlState = { request, version: URL_STATE_VERSION };
  const compressed = zlibSync(new TextEncoder().encode(JSON.stringify(payload)), { level: 9 });
  return `${COMPRESSED_STATE_PREFIX}${base64UrlEncodeBytes(compressed)}`;
}

export function decodeUrlState(value: string): SimulationRequest | null {
  if (value.length === 0 || value.length > MAX_ENCODED_STATE_CHARS) return null;
  try {
    if (value.startsWith(COMPRESSED_STATE_PREFIX)) {
      const compressed = base64UrlDecodeBytes(value.slice(COMPRESSED_STATE_PREFIX.length));
      const output = new Uint8Array(MAX_DECOMPRESSED_STATE_BYTES + 1);
      const decompressed = unzlibSync(compressed, { out: output });
      if (decompressed.length > MAX_DECOMPRESSED_STATE_BYTES) return null;
      const parsed = JSON.parse(new TextDecoder().decode(decompressed)) as Partial<EncodedUrlState>;
      return parsed.version === URL_STATE_VERSION && parsed.request ? parsed.request : null;
    }

    const parsed = JSON.parse(base64UrlDecodeText(value)) as Partial<LegacyEncodedUrlState>;
    return parsed.version === LEGACY_URL_STATE_VERSION && parsed.request ? parsed.request : null;
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

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecodeBytes(value: string): Uint8Array {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function base64UrlDecodeText(value: string): string {
  return new TextDecoder().decode(base64UrlDecodeBytes(value));
}
