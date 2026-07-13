export type ViteBuildEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Normalize a Pages deployment path for Vite.
 *
 * The value is a URL path, never an origin. Keeping this boundary explicit
 * prevents a deployment host from leaking into application code.
 */
export function normalizeViteBasePath(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "/") return "/";
  if (trimmed.includes("?") || trimmed.includes("#") || trimmed.includes("\\")) {
    throw new Error(`Vite base path must not contain a query, fragment, or backslash: ${value}`);
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Vite base path must not contain dot segments: ${value}`);
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

/** Resolve the build base without weakening the established GitHub path. */
export function resolveViteBase(environment: ViteBuildEnvironment): string {
  const explicitBase = environment.VITE_PUBLIC_BASE_PATH;
  if (explicitBase !== undefined) return normalizeViteBasePath(explicitBase);

  const gitLabPagesUrl = environment.CI_PAGES_URL;
  if (gitLabPagesUrl) {
    let parsed: URL;
    try {
      parsed = new URL(gitLabPagesUrl);
    } catch (error) {
      throw new Error(`CI_PAGES_URL is not a valid absolute URL: ${gitLabPagesUrl}`, {
        cause: error,
      });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`CI_PAGES_URL must use HTTP or HTTPS: ${gitLabPagesUrl}`);
    }
    return normalizeViteBasePath(parsed.pathname);
  }

  const repoName = environment.GITHUB_REPOSITORY?.split("/")[1];
  if (environment.GITHUB_ACTIONS === "true" && repoName) {
    return normalizeViteBasePath(repoName);
  }
  return "/";
}
