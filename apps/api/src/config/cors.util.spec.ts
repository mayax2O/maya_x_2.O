import {
  createCorsOriginValidator,
  isVercelPreviewOrigin,
  parseOriginList,
} from "./cors.util";

describe("parseOriginList", () => {
  it("splits, trims, and drops empty entries", () => {
    expect(
      parseOriginList(
        " http://localhost:3000 , http://localhost:3001,,https://maya-x-2-o-admin.vercel.app ",
      ),
    ).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
      "https://maya-x-2-o-admin.vercel.app",
    ]);
  });

  it("strips a single layer of wrapping double quotes", () => {
    expect(
      parseOriginList('"https://a.vercel.app,https://b.vercel.app"'),
    ).toEqual(["https://a.vercel.app", "https://b.vercel.app"]);
  });

  it("strips a single layer of wrapping single quotes", () => {
    expect(parseOriginList("'https://a.vercel.app'")).toEqual([
      "https://a.vercel.app",
    ]);
  });

  it("only strips quotes wrapping the whole value, not a stray quote mid-string", () => {
    expect(parseOriginList('https://a.vercel.app,"weird')).toEqual([
      "https://a.vercel.app",
      '"weird',
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseOriginList("")).toEqual([]);
  });
});

describe("isVercelPreviewOrigin", () => {
  const projects = ["maya-x-2-o-web", "maya-x-2-o-admin"];

  it("matches a hash-based preview URL", () => {
    expect(
      isVercelPreviewOrigin(
        "https://maya-x-2-o-admin-54251ws3v-adminhkgofc-8722s-projects.vercel.app",
        projects,
      ),
    ).toBe(true);
  });

  it("matches a git-branch preview URL", () => {
    expect(
      isVercelPreviewOrigin(
        "https://maya-x-2-o-web-git-claude-m6-0ffe9b-adminhkgofc-8722s-projects.vercel.app",
        projects,
      ),
    ).toBe(true);
  });

  it("does not match the bare production URL (no extra segment)", () => {
    expect(
      isVercelPreviewOrigin("https://maya-x-2-o-admin.vercel.app", projects),
    ).toBe(false);
  });

  it("does not match an unrelated project's vercel.app deployment", () => {
    expect(
      isVercelPreviewOrigin(
        "https://some-other-app-abc123-team.vercel.app",
        projects,
      ),
    ).toBe(false);
  });

  it("does not match a spoofed origin using the slug as a suffix trick", () => {
    expect(
      isVercelPreviewOrigin(
        "https://evil.com-maya-x-2-o-admin-abc.vercel.app",
        projects,
      ),
    ).toBe(false);
  });

  it("does not match http (only https)", () => {
    expect(
      isVercelPreviewOrigin(
        "http://maya-x-2-o-admin-abc123-team.vercel.app",
        projects,
      ),
    ).toBe(false);
  });
});

describe("createCorsOriginValidator", () => {
  const validator = createCorsOriginValidator(
    ["https://maya-x-2-o-admin.vercel.app", "http://localhost:3001"],
    ["maya-x-2-o-admin"],
  );

  it("allows a request with no Origin header (non-browser callers)", () => {
    const callback = jest.fn();
    validator(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("allows an exact allow-list match", () => {
    const callback = jest.fn();
    validator("http://localhost:3001", callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("allows a matching Vercel preview origin", () => {
    const callback = jest.fn();
    validator(
      "https://maya-x-2-o-admin-54251ws3v-adminhkgofc-8722s-projects.vercel.app",
      callback,
    );
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("blocks an origin that matches neither the allow-list nor the preview pattern", () => {
    const callback = jest.fn();
    validator("https://evil.example.com", callback);
    expect(callback).toHaveBeenCalledWith(null, false);
  });

  it("never resolves with a wildcard", () => {
    const callback = jest.fn();
    validator("https://evil.example.com", callback);
    const [, allowedOrigin] = callback.mock.calls[0] as [unknown, unknown];
    expect(allowedOrigin).not.toBe("*");
  });
});
