import { describe, expect, it } from "vitest";
import { normalizeViteBasePath, resolveViteBase } from "../../src/config/viteBase";

describe("Vite Pages base path", () => {
  it("keeps local and unique-domain deployments at the origin root", () => {
    expect(resolveViteBase({})).toBe("/");
    expect(resolveViteBase({ CI_PAGES_URL: "https://project-a1b2c3.pages.example/" })).toBe("/");
  });

  it("preserves the established GitHub repository path", () => {
    expect(
      resolveViteBase({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "pdoeble/MicrotubeDesignExplorer",
      }),
    ).toBe("/MicrotubeDesignExplorer/");
  });

  it("derives classic and namespace-in-path GitLab Pages bases", () => {
    expect(
      resolveViteBase({
        CI_PAGES_URL: "https://phdoeble.pages.example/MicrotubeDesignExplorer",
      }),
    ).toBe("/MicrotubeDesignExplorer/");
    expect(
      resolveViteBase({
        CI_PAGES_URL: "https://pages.example/phdoeble/MicrotubeDesignExplorer/",
      }),
    ).toBe("/phdoeble/MicrotubeDesignExplorer/");
  });

  it("lets an explicit path override host-specific CI variables", () => {
    expect(
      resolveViteBase({
        CI_PAGES_URL: "https://project.pages.example/wrong/",
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "owner/wrong",
        VITE_PUBLIC_BASE_PATH: "nested/canary",
      }),
    ).toBe("/nested/canary/");
  });

  it("normalizes slashes and rejects URL components or traversal", () => {
    expect(normalizeViteBasePath("//group///project//")).toBe("/group/project/");
    expect(() => normalizeViteBasePath("/project?state=x")).toThrow(/query/);
    expect(() => normalizeViteBasePath("/group/../project")).toThrow(/dot segments/);
    expect(() => resolveViteBase({ CI_PAGES_URL: "not a URL" })).toThrow(/valid absolute URL/);
  });
});
