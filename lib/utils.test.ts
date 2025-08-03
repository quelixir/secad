import { validateCallbackUrl } from "./utils";

describe("validateCallbackUrl", () => {
  it("should return null for null or undefined input", () => {
    expect(validateCallbackUrl(null)).toBeNull();
    expect(validateCallbackUrl(undefined)).toBeNull();
    expect(validateCallbackUrl("")).toBeNull();
  });

  it("should allow relative URLs", () => {
    expect(validateCallbackUrl("/entities")).toBe("/entities");
    expect(validateCallbackUrl("/registry/transactions/123")).toBe(
      "/registry/transactions/123",
    );
    expect(validateCallbackUrl("/auth/signin")).toBe("/auth/signin");
    expect(validateCallbackUrl("/")).toBe("/");
  });

  it("should allow URLs with query parameters", () => {
    expect(validateCallbackUrl("/entities?tab=members")).toBe(
      "/entities?tab=members",
    );
    expect(validateCallbackUrl("/registry/transactions/123?view=details")).toBe(
      "/registry/transactions/123?view=details",
    );
  });

  it("should allow URLs from the same origin when baseUrl is provided", () => {
    const baseUrl = "http://localhost:3000";
    expect(validateCallbackUrl("http://localhost:3000/entities", baseUrl)).toBe(
      "http://localhost:3000/entities",
    );
    expect(
      validateCallbackUrl(
        "http://localhost:3000/registry/transactions/123",
        baseUrl,
      ),
    ).toBe("http://localhost:3000/registry/transactions/123");
  });

  it("should reject URLs from different origins", () => {
    const baseUrl = "http://localhost:3000";
    expect(
      validateCallbackUrl("https://malicious.com/redirect", baseUrl),
    ).toBeNull();
    expect(validateCallbackUrl("http://evil.com/entities", baseUrl)).toBeNull();
    expect(validateCallbackUrl("https://google.com", baseUrl)).toBeNull();
  });

  it("should handle encoded URLs", () => {
    const encodedUrl = encodeURIComponent(
      "/registry/transactions/kwuel3n72510s4zwm8561p27",
    );
    expect(validateCallbackUrl(encodedUrl)).toBe(
      "/registry/transactions/kwuel3n72510s4zwm8561p27",
    );
  });

  it("should reject invalid URLs", () => {
    expect(validateCallbackUrl("not-a-url")).toBeNull();
    expect(validateCallbackUrl("ftp://invalid")).toBeNull();
  });

  it("should work with custom base URL", () => {
    const customBaseUrl = "https://myapp.com";
    expect(
      validateCallbackUrl("https://myapp.com/entities", customBaseUrl),
    ).toBe("https://myapp.com/entities");
    expect(
      validateCallbackUrl("https://other.com/entities", customBaseUrl),
    ).toBeNull();
  });
});
